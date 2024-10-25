import express from "express";
import axios from "axios";
import multer from "multer";
import path from "path";
import fs from "fs";
import auth from "../../middleware/auth";
import dotenv from "dotenv";
import { getIO } from '../../socket';

dotenv.config();

const router = express.Router();

const API_URL = process.env.API_URL;
const tavusApiKey = process.env.TAVUS_API_KEY; // Make sure to add this to your .env file

import Replica from "../../models/Replica";
import Notification from "../../models/Notification";

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "replica-consentvideo");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Modified create-replica endpoint
router.post(
  "/create-replica",
  auth,
  upload.single("file"),
  async (req, res) => {
    const { name } = req.body;
    const fileName = req.file.filename;
    try {
      console.log(fileName, name);

      // Get the full URL for the uploaded file
      const fileUrl = `${API_URL}/api/replica/get-replica-consent-video/${fileName}`;

      // Prepare the data for the Tavus API call
      const tavusData = {
        callback_url: `${API_URL}/api/replica/replica-created`, // Add a callback URL if needed
        replica_name: name,
        train_video_url: fileUrl
      };

      // Make the API call to Tavus
      const tavusResponse = await axios.post('https://tavusapi.com/v2/replicas', tavusData, {
        headers: {
          'x-api-key': tavusApiKey,
          'Content-Type': 'application/json'
        }
      });

      const replica = new Replica({
        user: req.user.id,
        replica_name: name,
        model_name: tavusResponse.data.model_name,
        status: "traning",
      });
      await replica.save();

      // Send the response from Tavus along with the fileName
      res.status(200).json({replica});
    } catch (error) {
      console.error('Error creating replica:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// New endpoint to get the file
router.get("/get-replica-consent-video/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(
    __dirname,
    "../../replica-consentvideo",
    fileName
  );

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

router.post("/replica-created", async (req, res) => {
  const replicaData = req.body;
  const replica = await Replica.findOne({replica_id: replicaData.replica_id});
  if(replica){
    replica.status = replicaData.status;
    await replica.save();
  } 

  const notificationData = {
    user: replica.user,
    title: replica.status === "ready" ? "Replica Created" : "Replica Creation Failed",
    description: replica.status === "ready" 
      ? `Your Replica ${replica.replica_id} has been created`
      : `Your Replica ${replica.replica_id} creation failed-${replicaData.error_message}`,
  };

  const notification = new Notification(notificationData);
  await notification.save();

  const io = getIO();
  io.emit("replicaCreated", replica);
  res.status(200).json({ message:"Replica data received and sent to clients" });
});

export default router;
