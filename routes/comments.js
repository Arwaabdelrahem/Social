const express = require("express");
const auth = require("../middleware/auth");
const multer = require("../middleware/multer");
const cloud = require("../cloudinary");
const { Post } = require("../models/post");
const fs = require("fs");
const router = express.Router();

router.post("/:id", auth, multer, async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("post no longer exist");

  let img;
  if (req.file) {
    img = await cloud.cloudUpload(req.file.path);
  }

  let comment = {
    content: req.body.content,
    image: img ? img.image : undefined,
    user: req.user._id,
  };

  try {
    post.comments.push(comment);
    post = await post.save();
    fs.unlinkSync(req.file.path);
    res.status(200).send("comment sent");
  } catch (error) {
    res.status(400).send("failed to comment");
  }
});

router.put("/:postId/:id", auth, multer, async (req, res, next) => {
  let post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).send("post no longer exist");

  let img;
  if (req.file) {
    img = await cloud.cloudUpload(req.file.path);
  }

  for (const i in post.comments) {
    if (post.comments[i].user != req.user._id) {
      return res.status(403).send("Forbidden");
    }

    if (post.comments[i]._id == req.params.id) {
      post.comments[i].set({
        content: req.body.content,
        image: img ? img.image : undefined,
      });
      await post.save();
      break;
    }
  }

  try {
    fs.unlinkSync(req.file.path);
    res.status(200).send("comment sent");
  } catch (error) {
    res.status(400).send("failed to comment");
  }
});

router.delete("/:postId/:id", auth, async (req, res, next) => {
  let post = await Post.findById(req.params.postId);
  if (!post) return res.send("Post is already not exist");

  for (const i in post.comments) {
    if (post.comments[i]._id == req.params.id) {
      post.comments[i].remove();
    }
  }

  try {
    post = await post.save();
    res.status(200).send("comment deleted");
  } catch (error) {
    res.status(400).send(error.message);
  }
});
module.exports = router;
