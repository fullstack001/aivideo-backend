import express from "express";
import axios from "axios";
import translate from "@iamtraction/google-translate";
import dotenv from "dotenv";
import auth from "../../middleware/auth";
import fs from "fs";
import path from "path";
// Add this line to import Socket.IO
import { getIO } from '../../socket';

dotenv.config();

const router = express.Router();

const pexelKey = process.env.PEXEL_API_KEY;

import Video from "../../models/Video";

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
    const backgrounds=response.data.photos.map(photo=>{
      return photo.src.original
    })

    // Axios automatically parses the JSON response, so no need to call .json() as with fetch
    return res.status(200).json(backgrounds); // Send the avatar data back to the client
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

  const tavusApiKey = process.env.TAVUS_API_KEY; // Make sure to add this to your .env file
  const API_URL = process.env.API_URL;

  const creatingData = background ? {
    background_url: background,
    replica_id: avatar?.replica_id,
    script: content,
    video_name: name || `Video_${Date.now()}`, // You can customize this as needed
    callback_url: `${API_URL}/api/video-create/video-created`,
  } : {
    replica_id: avatar?.replica_id,
    script: content,
    video_name: name || `Video_${Date.now()}`, // You can customize this as needed
    callback_url: `${API_URL}/api/video-create/video-created`,
  };

  const options = {
    method: "POST",
    url: "https://tavusapi.com/v2/videos",
    headers: {
      "x-api-key": tavusApiKey,
      "Content-Type": "application/json",
    },
    data: creatingData,
  };

  try {
    const response = await axios(options);
    const video = new Video({
      user: req.user.id,
      script: originContent,
      background: background || null,
      avatar: avatar,
      video_id: response.data.video_id,
      video_name: response.data.video_name,
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
  const video = await Video.findOne({ video_id: videoData.video_id });
  video.status = videoData.status;
  video.download_url = videoData.download_url;
  video.stream_url = videoData.stream_url;
  await video.save();
  const notification = new Notification({ 
    user: video.user,
    title: "Video Created",
    description: `Your video ${video.video_name} has been created`,
  });
  await notification.save();

  const io = getIO();
  io.emit("videoCreated", req.body);

  res.json({ message: "Video data received and sent to clients" });
});

module.exports = router;
