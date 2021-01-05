const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const user = require("./routes/Users");
const post = require("./routes/Posts");
const comment = require("./routes/comments");
const { errorHandler, serverErrorHandler } = require("./middleware/error");
const app = express();

mongoose
  .connect(
    "mongodb+srv://Arwaabdelrahem:mongo@cluster0.xse5n.mongodb.net/socialDB?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
  )
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
