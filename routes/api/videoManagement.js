import express from "express";
import  auth  from "../../middleware/auth.js";

const router = express.Router();

import Video from "../../models/Video.js";
import Notification from "../../models/Notification.js";

router.get("/get-user-videos", auth, async (req, res) => {
  try {
    const videos = await Video.find({ user: req.user.id });
    res.json({ videos });
  } catch (error) {
    console.error("Error fetching user videos:", error);
    res.status(500).json({ error: "Error fetching user videos" });
  }
});

router.delete("/delete-video/:videoId",auth,  async (req, res) => {
  try {
    const video = await Video.findOneAndDelete({ _id: req.params.videoId, user: req.user._id });
    if (!video) {
      return res.status(404).json({ message: "Video not found or you don't have permission to delete it" });
    }
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
