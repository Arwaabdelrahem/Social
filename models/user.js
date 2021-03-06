const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const mongoose = require("mongoose");
const pagination = require("mongoose-paginate-v2");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    resetPasswordCode: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

function rigesterValidation(user) {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    image: Joi.string(),
  });
  return schema.validate(user);
}

function logValidation(user) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return schema.validate(user);
}

userSchema.plugin(pagination);

const User = mongoose.model("User", userSchema);

module.exports.User = User;
module.exports.register = rigesterValidation;
module.exports.log = logValidation;
