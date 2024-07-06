const Joi = require('joi');

const validateRegistration = (data) => {
  
  const schema = Joi.object({
    firstName: Joi.string().min(3).max(30).required(),
    lastName: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(30).required(),
    phone: Joi.string().optional().allow(''),
  });
  return schema.validate(data, { abortEarly: false });
};

const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return schema.validate(data, { abortEarly: false });
};

const validateOrganisation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    description: Joi.string().optional()
  });
  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateOrganisation
};
