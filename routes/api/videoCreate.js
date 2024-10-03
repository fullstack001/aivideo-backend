import express from "express";
import axios from "axios";
import fetch from "node-fetch";
import dotenv from "dotenv";
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ffmpeg = require("fluent-ffmpeg");
const os = require("os");

// Conditional FFmpeg path setting
if (os.platform() === "win32") {
  ffmpeg.setFfmpegPath("C:/ffmpeg/bin/ffmpeg.exe");
  ffmpeg.setFfprobePath("C:/ffmpeg/bin/ffprobe.exe");
}
// For Ubuntu, we don't need to set paths as it uses system-wide installation

dotenv.config();

const router = express.Router();

const didKey = process.env.D_ID_API_KEY;
const pexelKey = process.env.PEXEL_API_KEY;
const lovoKey = process.env.LOVO_API_KEY;
router.get("/get-avatars", async (req, res) => {
  const url = "https://api.d-id.com/clips/presenters?limit=200";
  const options = {
    headers: {
      accept: "application/json",
      Authorization: `Basic ${didKey}`, // Make sure your didKey is passed correctly
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

router.get("/get-voices", async (req, res) => {
  const url = "https://api.genny.lovo.ai/api/v1/speakers?sort=displayName%3A1";
  const options = {
    headers: {
      accept: "application/json",
      "x-api-key": lovoKey, // Make sure your didKey is passed correctly
    },
  };

  try {
    const response = await axios.get(url, options);

    // Axios automatically parses the JSON response, so no need to call .json() as with fetch
    return res.status(200).json(response.data.data); // Send the avatar data back to the client
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

router.post("/create-audio", async (req, res) => {
  const { voice, content } = req.body;
  console.log(voice, content);

  try {
    const options = {
      method: "POST",
      url: "https://api.genny.lovo.ai/api/v1/tts/sync",
      headers: {
        "x-api-key": lovoKey,
        accept: "application/json",
        "content-type": "application/json",
      },
      data: {
        speed: 1,
        speaker: voice.id,
        text: content,
        speakerStyle: voice.speakerStyles.id,
      },
    };

    const response = await axios.request(options);
    console.log(response.data);

    const audioUrl = response.data.data[0].urls[0];
    res.json({ audioUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.post("/combine-audio", async (req, res) => {
  const { audioUrls } = req.body;
  const audioFilePaths = [];

  try {
    // Download audio files
    for (const [index, url] of audioUrls.entries()) {
      const filePath = await downloadAudioFile(url, index);
      audioFilePaths.push(filePath);
    }

    // Generate a unique file name
    const uniqueFileName = `combined_audio_${uuidv4()}.wav`;
    const outputFilePath = path.resolve(__dirname, uniqueFileName);

    const ffmpegCommand = ffmpeg();

    // Add each audio file to the FFmpeg command
    audioFilePaths.forEach((filePath) => {
      ffmpegCommand.input(filePath);
    });

    // Concatenate the files and output a combined audio file in WAV format
    ffmpegCommand
      .on("end", () => {
        res.json({ audioUrl: uniqueFileName });
        // Clean up by deleting the temporary audio files
        audioFilePaths.forEach((filePath) => fs.unlinkSync(filePath));
      })
      .on("error", (err) => {
        console.error("Error concatenating audio files:", err);
        res.status(500).send("Error processing audio");
      })
      .mergeToFile(outputFilePath)
      .outputOptions(["-acodec", "pcm_s16le"]); // Ensure WAV format
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Helper function to download audio file
const downloadAudioFile = async (url, index) => {
  const filePath = path.resolve(__dirname, `${Date.now()}_${index}.wav`);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on("finish", () => resolve(filePath));
    writer.on("error", reject);
  });
};

router.post("/create-video", async (req, res) => {
  const { avatar, content, background, language, voice } = req.body;

  const options = {
    method: "POST",
    url: "https://api.d-id.com/clips",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: `Basic ${didKey}`,
    },
    data: {
      presenter_id: avatar.presenter_id,
      script: {
        type: "text",
        subtitles: "false",
        provider: {
          type: "microsoft",
          voice_id: voice.voice_id,
          language: language,
        },
        input: content,
        ssml: "false",
      },
      // background: { source_url: background.src.original },
      config: { result_format: "mp4" },
      presenter_config: { crop: { type: "wide" } },
    },
  };

  axios
    .request(options)
    .then(function (response) {
      console.log(response.data);
      res.json({ videoUrl: response.data });
    })
    .catch(function (error) {
      console.error(error);
      res.status(500).send("Server error");
    });
});

module.exports = router;
