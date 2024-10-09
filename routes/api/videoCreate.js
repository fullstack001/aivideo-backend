import express from "express";
import axios from "axios";
import translate from "@iamtraction/google-translate";
import dotenv from "dotenv";
import auth from "../../middleware/auth";
import fs from "fs";
import path from "path";
// Add this line to import Socket.IO
import { Server } from "socket.io";

dotenv.config();

const router = express.Router();

const pexelKey = process.env.PEXEL_API_KEY;

import Video from "../../models/Video";

router.get("/user-videos", auth, async (req, res) => {
  try {
    const vidoes = await Video.find({ user: req.user.id });
    res.json({ vidoes });
  } catch (error) {
    console.error("Error fetching user videos:", error);
    res.status(500).json({ error: "Error fetching user videos" });
  }
});

// /get-backgrounds endpoint to fetch backgrounds from Pexels
router.get("/get-backgrounds", auth, async (req, res) => {
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
router.post("/translate", auth, async (req, res) => {
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

router.post("/create-video", auth, async (req, res) => {
  const { avatar, content, background, language, name, originContent } =
    req.body;
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
      video_name: name || `Video_${Date.now()}`, // You can customize this as needed
      callback_url: `${API_URL}/api/video-create/video-created`,
    },
  };

  try {
    const response = await axios(options);
    const video = new Video({
      user: req.user.id,
      script: originContent,
      background: background?.src.original,
      avatar: avatar,
      video_id: response.data.video_id,
      videoName: response.data.video_name,
      status: response.data.video_status,
      language: language,
    });
    await video.save();
    res.json({ resultData: response.data });
  } catch (error) {
    console.error("Error creating video:", error);
    res.status(500).json({ error: "Error creating video" });
  }
});

// Modify the /video-created endpoint
router.post("/video-created", async (req, res) => {
  console.log(req.body); // Emit the video data to connected clients
  const videoData = req.body;
  const video = await Video.findOne({ videoId: videoData.video_id });
  video.status = videoData.status;
  video.download_url = videoData.download_url;
  video.stream_url = videoData.stream_url;
  await video.save();

  const io = req.app.get("io");
  io.emit(videoData.video_id, req.body);

  res.json({ message: "Video data received and sent to clients" });
});

module.exports = router;
