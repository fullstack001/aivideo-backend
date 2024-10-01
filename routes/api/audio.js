import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();

// Endpoint to return the file content based on fileName
router.get("/:fileName", async (req, res) => {
  const { fileName } = req.params; // Get fileName from URL parameters

  // Build the full path to the file
  const filePath = path.join(__dirname, fileName);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // If file exists, send the file content
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error while sending file:", err);
        res.status(500).send("Error while sending file");
      }
    });
  } else {
    // If file does not exist, send a 404 error
    res.status(404).send("File not found");
  }
});

module.exports = router;
