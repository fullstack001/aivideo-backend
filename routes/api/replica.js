import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import auth from "@/middleware/auth";

const router = express.Router();

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
      res.status(200).json({ fileName });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// New endpoint to get the file
router.get("/get-replica-consent-video/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(
    __dirname,
    "../../../replica-consentvideo",
    fileName
  );

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

export default router;
