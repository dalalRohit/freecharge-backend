var express = require("express");
var router = express.Router();
const User = require("./../models/User");
const multer = require("multer");
const upload = multer();
const csv = require("csv-parser");
const fs = require("fs");
const bcrypt = require("bcryptjs");

//Validation utils
const { hashPassword } = require("./../utils/hash");
const { regValidation, loginValidation } = require("./../utils/validation");
const { createTokens, checkAuth } = require("./../utils/auth");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var fileUpload = multer({ storage: storage });

/*
  @POST /register
  @params : {username,name,password,} as JSON 
*/
router.post("/register", upload.none(), async (req, res, next) => {
  const { name, username, password } = req.body;
  console.log(req.body);
  const { error } = regValidation(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  User.findOne({ username })
    .then(async (user) => {
      if (user) {
        return res.status(400).json({
          register: false,
          msg: `User with username ${username} already exists!`,
        });
      }
      const data = {
        name,
        username,
        password,
        account: Math.floor(Math.random() * 100000000),
      };

      const newUser = new User(data);
      const hash = await hashPassword(newUser.password);
      if (hash) {
        newUser.password = hash;
      }
      try {
        await newUser.save();
      } catch (e) {
        return res.status(500).json({ err: e });
      }

      return res.status(201).json({ register: true, user: newUser._id });
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json({ register: false, err });
    });
});

/* 
  @POST /login
  @params : {username,password} as JSON 
*/
router.post("/login", upload.none(), (req, res, next) => {
  let { username, password } = req.body;

  let { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  User.findOne({ username }).then(async (user) => {
    if (!user) {
      return res
        .status(400)
        .json({ login: false, msg: `User not found! Check credentials.` });
    }

    const isPass = await bcrypt.compare(password, user.password);
    if (!isPass) {
      return res
        .status(400)
        .json({ login: false, msg: "Passwords do not match!" });
    }
    const { token } = await createTokens(user._id);
    req.user = user;
    req.tokens = { token };

    //Send user with set HTTP cookies
    const options = {
      httpOnly: true,
      maxAge: 36 * 60 * 1000,
      secure: true,
      sameSite: true,
    };

    //Set cookies
    res.cookie("token", token, options);

    res.status(200).send({
      login: true,
      user: req.user["_id"],
      token: req.tokens.token,
    });
  });
});

// Upload
router.post(
  "/upload",
  checkAuth,
  fileUpload.single("file"),
  (req, res, next) => {
    const file = req.file;
    if (file.mimetype !== "text/csv") {
      return res.send("Only CSV files");
    }
    const results = [];
    let ans = {};
    for (let i = 1; i <= 12; i++) {
      ans[Number(i)] = { deposit: 0, withdraw: 0, mab: 0 };
    }
    let deposits = 0;
    fs.createReadStream(file.path)
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
        const month = new Date(data.Date).getMonth();
        if (month) {
          ans[month].deposit += Number(data.Deposit);
          ans[month].withdraw += Number(data.Withdraw);
        }
        deposits += data.Deposit;
      })
      .on("end", () => {
        //Add CSV to the user doc
        User.findById({ _id: req.user.id })
          .then(async (user) => {
            Object.keys(ans).map((month) => {
              ans[month].mab = ans[month].deposit - ans[month].withdraw;
            });
            let monthAvgBal = 0;
            Object.keys(ans).map((month) => {
              monthAvgBal += ans[month].mab;
            });

            const newuser = user;
            newuser["statement"] = results;
            await newuser.save();

            return res.status(201).json({
              upload: true,
              msg: "CSV uploaded succesfully",
              creditLimit: (monthAvgBal / 12) * 1.2,
            });
          })
          .catch((err) => {
            return res.status(400).json({ err, msg: "No user found" });
          });
      });
  }
);
module.exports = router;
