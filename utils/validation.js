/*
    A utility file for Registration and Login form/JSON data validation methods
*/

const Joi = require("@hapi/joi");

const regValidation = (regData) => {
  const registerSchema = Joi.object({
    username: Joi.string().required(),
    name: Joi.string().required(),
    password: Joi.string().min(6).required(),
  });
  return registerSchema.validate(regData);
};

const loginValidation = (loginData) => {
  const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(6).required(),
  });

  return loginSchema.validate(loginData);
};

module.exports = {
  regValidation: regValidation,
  loginValidation: loginValidation,
};
