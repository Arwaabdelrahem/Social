const { User, register, log } = require("../models/user");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const cloud = require("../cloudinary");
const multer = require("../middleware/multer");
const fs = require("fs");
const nodemailer = require("nodemailer");
const CodeGenerator = require("node-code-generator");
const auth = require("../middleware/auth");
const router = express.Router();

router.get("/", async (req, res, next) => {
  const user = await User.find().select("-password -__v");
  res.status(200).send(user);
});

router.get("/me", auth, async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password");
  res.status(200).send(user);
});
router.get("/:id", async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password -__v");
  if (!user) return res.status(404).send("No User found with the given ID");

  res.status(200).send(user);
});

router.post("/register", multer, async (req, res, next) => {
  const { error } = register(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User exists");

  const img = await cloud.cloudUpload(req.file.path);
  if (!img) return res.status(500).send("Error while uploading");

  user = new User({
    name: req.body.name,
    email: req.body.email,
    password: await bcrypt.hash(req.body.password, 10),
    image: img.image,
  });

  try {
    await user.save();
    fs.unlinkSync(req.file.path);
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.post("/login", async (req, res, next) => {
  const { error } = log(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email or password");

  const compare = await bcrypt.compare(req.body.password, user.password);
  if (!compare) return res.status(400).send("Invalid email or password");

  const token = jwt.sign(
    {
      _id: user.id,
      email: user.email,
    },
    config.get("jwtprivateKey")
  );
  res
    .status(200)
    .header("auth-token", token)
    .json({ User: user, Token: token });
});

router.post("/sendmail", async (req, res, next) => {
  var generator = new CodeGenerator();
  const code = generator.generateCodes("#+#+#+", 100)[0];

  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "arwaabdelrahem2@gmail.com",
      pass: config.get("pass"),
    },
  });

  var mailOptions = {
    from: "arwaabdelrahem2@gmail.com",
    to: req.body.email,
    subject: "Verfication Code",
    text: `your verfication code ${code}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });

  try {
    let newUser = await User.findOne({ email: req.body.email });

    newUser.resetPasswordCode = code;
    newUser = await newUser.save();
    res.status(200).send(newUser);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/reset-password", async (req, res, next) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).status("User with the given email not exits");
  }

  try {
    if (user.resetPasswordCode == req.body.code) {
      user.password = await bcrypt.hash(req.body.newPassword, 10);
      user.resetPasswordCode = "";
      user = await user.save();
      res.status(200).send(user);
    }
  } catch (error) {
    console.log(user.resetPasswordCode);
    res.status(400).send(error.message);
  }
});

router.post("/change-password", auth, async (req, res, next) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).status("User with the given email not exits");
  }

  const compare = await bcrypt.compare(req.body.oldPassword, user.password);
  if (!compare) return res.status(400).send("Incorrect password");

  try {
    user.password = await bcrypt.hash(req.body.newPassword, 10);
    user = await user.save();
    res.status(200).send(user);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// router.post("/follow/:id", auth, async (req, res, next) => {
//   let userf = await User.findById(req.params.id);
//   if (!userf) return res.status(404).send("User not found");

//   let user = await User.findById(req.user._id);

//   try {
//     userf.followersId.push({ user: req.user._id });
//     user.followingIds.push({ user: req.params.id });

//     res.status(200).status("you are now following them");
//   } catch (error) {
//     res.status(400).send(error.message);
//   }
// });

router.put("/:id", auth, multer, async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (req.user._id !== req.params.id) return res.status(403).send("Forbidden");

  const img = await cloud.cloudUpload(req.file.path);
  if (!img) return res.status(500).send("Error while uploading");

  user.name = req.body.name;
  user.email = req.body.email;
  user.password = await bcrypt.hash(req.body.password, 10);
  user.image = img.image;
  user = await user.save();
  res.send(user);
});

router.delete("/:id", auth, async (req, res, next) => {
  const user = await User.findByIdAndRemove(req.params.id);
  if (!user) return res.status(404).send("User with given ID not found");

  res.send(user);
});

module.exports = router;
