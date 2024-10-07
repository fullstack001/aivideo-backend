import express from "express";
import axios from "axios";
const translate = require("@iamtraction/google-translate");
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const router = express.Router();

const pexelKey = process.env.PEXEL_API_KEY;

// /get-backgrounds endpoint to fetch backgrounds from Pexels
router.get("/get-backgrounds", async (req, res) => {
  const url =
    "https://api.pexels.com/v1/search?query=background&page=1&per_page=10";
  const options = {
    headers: {
      Authorization: pexelKey, // Make sure your didKey is passed correctly
    },
  };

  try {
    const response = await axios.get(url, options);

    // Axios automatically parses the JSON response, so no need to call .json() as with fetch
    return res.status(200).json(response.data); // Send the avatar data back to the client
  } catch (error) {
    console.error("Error fetching avatars:", error);

    if (error.response) {
      return res
        .status(error.response.status)
        .json({ error: error.response.data });
    } else if (error.request) {
      return res
        .status(500)
        .json({ error: "No response received from server" });
    } else {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
});

// /translate endpoint to handle translation requests
router.post("/translate", async (req, res) => {
  const { text, targetLanguage } = req.body;

  translate(text, { from: "en", to: targetLanguage })
    .then((response) => {
      console.log(response.from.language.iso);
      res.json({ translated: response.text });
      //=> nl
    })
    .catch((err) => {
      console.error("Error during translation:", err);
      res.status(500).send("Translation error");
    });

  // Check if we already have valid access tokens, otherwise redirect to /auth
});

router.post("/create-video", async (req, res) => {
  const { avatar, content, background, language } = req.body;
  console.log(req.body);

  const tavusApiKey = process.env.TAVUS_API_KEY; // Make sure to add this to your .env file
  const API_URL = process.env.API_URL;
  const options = {
    method: "POST",
    url: "https://tavusapi.com/v2/videos",
    headers: {
      "x-api-key": tavusApiKey,
      "Content-Type": "application/json",
    },
    data: {
      background_url: background?.src.original,
      replica_id: avatar?.replica_id,
      script: content,
      video_name: `Video_${Date.now()}`, // You can customize this as needed
      callback_url: `${API_URL}/api/video-create/video-created`,
    },
  };

  try {
    const response = await axios(options);
    console.log(response.data);
    res.json({ resultData: response.data });
  } catch (error) {
    console.error("Error creating video:", error);
    res.status(500).json({ error: "Error creating video" });
  }
});

router.get("/video-created", async (req, res) => {
  console.log(req.body);
  res.json({ videoUrl: "https://www.google.com" });
});

module.exports = router;
