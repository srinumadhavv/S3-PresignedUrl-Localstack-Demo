const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");
require('dotenv').config()
const app = express();

app.use(express.json());
let s3 = new AWS.S3();

console.log("NODE_ENV",process.env.NODE_ENV);
if (process.env.NODE_ENV === "local") { // ? used for local development
  console.log("yes");
  s3 = new AWS.S3({
    endpoint: "http://localhost:4566",
    s3ForcePathStyle: true,
  }); 
}

// * Returns signed URL from S3
const s3helper = async (name) => {
  const Key = `${name}.jpeg`;
  console.log("Key",process.env.IMAGE_UPLOAD_BUCKET);
  const s3Params = {
    Bucket: process.env.IMAGE_UPLOAD_BUCKET,
    Key,
    Expires: ~~process.env.SIGNED_URL_EXPIRATION_SECONDS,
    ContentType: "image/jpeg",
    ACL: "public-read",
  };
  console.log("s3Params",s3Params);
  const uploadURL = await s3.getSignedUrlPromise("putObject", s3Params);
  console.log("uploadUrl",uploadURL);
  let data = {
    Key,
    uploadURL,
  };
  return data;
};

app.post("/img", async (req, res) => {
  try {
    const name = req.body.name;
    console.log("name",name);
    const data = await s3helper(name);
    return res.status(200).json(data);
    // url = `http://localhost:4566/${process.env.IMAGE_UPLOAD_BUCKET}/${Key}` This is the url where the uploaded image would be available
  } catch (error) {
    return res.status(500).json({ msg: "couldnt Upload image" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
