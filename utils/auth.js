require("dotenv").config();
const _ = require("lodash");
const jwt = require("jsonwebtoken");

//To generate tokens
const createTokens = async (user) => {
  const token = jwt.sign({ _id: user }, process.env.SECRET, {
    expiresIn: "5d",
  });

  return { token };
};

const checkAuth = async (req, res, next) => {
  const token = req.header("auth-token");
  const decoded = await jwt.decode(token);
  if (!token) {
    req.tokens = {};
    return res
      .status(403)
      .json({ auth: false, msg: "Access Denied. No Token Provided" });
  }

  jwt.verify(token, process.env.SECRET, async (err, user) => {
    if (user) {
      req.user = { id: user._id };
      return next();
    }
    //auth-token is invalid
    else if (err.name !== "TokenExpiredError") {
      req.tokens = {};
      return res
        .status(400)
        .json({ auth: false, msg: `Invalid auth-token. ${err.message}` });
    } else if (err && err.name === "TokenExpiredError") {
      const newToken = await createTokens(decoded._id);
      req.tokens = { token: newToken };

      return next();
    }
  });
};
module.exports = {
  createTokens,
  checkAuth,
};
