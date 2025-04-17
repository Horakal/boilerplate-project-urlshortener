require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const options = {
  all: true,
};

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortnedUrl: String,
});

let urlModel = mongoose.model("ShortUrl", urlSchema);

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async function (req, res) {
  const { url } = req.body;

  let valid = isValidHttpUrl(url);
  if (!valid) return res.json({ error: "invalid url" });

  var urlFound = await findShortenedByUrl(url);
  if (urlFound) {
    return res.json({
      original_url: urlFound.originalUrl,
      short_url: urlFound.shortnedUrl,
    });
  }

  var shortnedUrl = shortOriginalUrl(url);
  await createAndSaveUrl(url, shortnedUrl);

  return res.json({
    original_url: url,
    short_url: shortnedUrl,
  });
});
function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}
app.get("/api/shorturl/:short_url", async function (req, res) {
  const short_url = req.params.short_url;

  var urlFound = await findUrlByShort(short_url);

  if (urlFound) {
    res.redirect(urlFound.originalUrl);
  }
});
const findShortenedByUrl = async (url, done) => {
  return await urlModel.findOne({ originalUrl: url }).exec();
};

const findUrlByShort = async (short_url, done) => {
  return await urlModel.findOne({ shortnedUrl: short_url }).exec();
};
const createAndSaveUrl = async (originalUrl, shortnedUrl, done) => {
  let urlData = new urlModel({
    originalUrl: originalUrl,
    shortnedUrl: shortnedUrl,
  });
  return await urlData.save();
};
const shortOriginalUrl = (url) => {
  let sum = 0;
  url.split("").forEach(function (alphabet) {
    sum += alphabet.charCodeAt(0);
  });
  return sum;
};

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
