const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("config");
const bodyParser = require("body-parser");
const user = require("./routes/Users");
const post = require("./routes/Posts");
const comment = require("./routes/comments");
const { errorHandler, serverErrorHandler } = require("./middleware/error");
const app = express();

// config.get("db");
mongoose
  .connect(config.get("db"), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("MongoDB connected");
  });

app.use(cors());
app.use("/Images", express.static("Images"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/users", user);
app.use("/posts", post);
app.use("/posts/comment", comment);
app.use(errorHandler);
app.use(serverErrorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
