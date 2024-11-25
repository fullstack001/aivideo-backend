import express from "express";
import axios from "axios";
import translate from "@iamtraction/google-translate";
import dotenv from "dotenv";
import auth from "../../middleware/auth";
import {languageData} from "../../config/languageData.js";
// Add this line to import Socket.IO
import { getIO } from '../../socket';

dotenv.config();

const router = express.Router();

const baseUrl = "https://api.heygen.com";

export const heygenApi = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
    "X-Api-Key": process.env.HEYGEN_APIKEY},
});

import Video from "../../models/Video";
import Notification from "../../models/Notification";

const API_URL = process.env.API_URL;


// /translate endpoint to handle translation requests
router.post("/translate", auth, async (req, res) => {
  const { text, targetLanguage } = req.body;

  if (!text || !targetLanguage) {
    return res.status(400).json({ error: "Text and targetLanguage are required" });
  }

  try {
    // Translate without specifying the source language
    const response = await translate(text, { to: targetLanguage });

    res.json({
      originalLanguage: response.from.language.iso, // Detected source language
      translatedText: response.text,
    });
  } catch (err) {
    console.error("Error during translation:", err);
    res.status(500).send("Translation error");
  }
});

router.post("/create-video", auth, async (req, res) => {
  const { character , voice, background,  name } = req.body;  

  const creatingData = {
    title: name || `Video_${Date.now()}`, // You can customize this as needed
    video_inputs: [
      {
        character: character,
        voice: voice, }
    ],
    callback_id:"test123"
    
  };

  if(background){
    creatingData.video_inputs[0].background = background;
  }


  try {
    const response = await heygenApi.post("/v2/video/generate", creatingData);
    const video = new Video({
      user: req.user.id,
      video_id:response.data.data.video_id
    });
    await video.save();
    res.json({ resultData: response.data });
  } catch (error) {
    console.error("Error creating video:", error);
    res.status(500).json({ error: "Error creating video" });
  }
});

router.post("/translate-video", auth, async (req, res) => {
  const { id, targetLanguage } = req.body;
  const video = await Video.findById(id);
  const content = video.script;
  
  try {
    const response = await translate(content, { from: "en", to: targetLanguage });
    const translatedScript = response.text;
    
    // Remove existing language from video name and add new language
    const baseVideoName = video.video_name.split('-')[0];
    const newLanguageName = languageData.find(lang => lang.code === targetLanguage)?.name;
    
    const creatingData = {
      replica_id: video.avatar?.replica_id,
      script: translatedScript,
      video_name: `${baseVideoName}-${newLanguageName}`,
      callback_url: `${API_URL}/api/video-create/video-created`,
    };

    console.log(creatingData);

    if (video.background) {
      creatingData.background_url = video.background;
    }

    const videoCreateOption = { ...vidoeCreateOption, data: creatingData };
    
    const tavusResponse = await axios(videoCreateOption);
    const translatedVideo = new Video({
      user: req.user.id,
      script: video.script,
      background: video.background || null,
      avatar: video.avatar,
      video_id: tavusResponse.data.video_id,
      video_name: tavusResponse.data.video_name,
      status: tavusResponse.data.status,
      language: targetLanguage,
    });
    
    await translatedVideo.save();
    res.json({ resultData: tavusResponse.data });
  } catch (err) {
    console.error("Error during translation or video creation:", err);
    res.status(500).send("Translation or video creation error");
  }
});

// Modify the /video-created endpoint
router.post("/video-created", async (req, res) => {
  console.log(req.body); // Emit the video data to connected clients
  const videoData = req.body;
  const video = await Video.findOne({ video_id: videoData.video_id });
  if(video){
    video.status = videoData.status||"ready";
    video.download_url = videoData.download_url;
    video.stream_url = videoData.stream_url;
    await video.save();
  }
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
