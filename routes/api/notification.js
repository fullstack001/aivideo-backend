import express from "express";
import auth from "../../middleware/auth";

const router = express.Router();
import Notification from "../../models/Notification";

router.get("/", auth, async (req, res) => {
  const userId = req.user.userId;
  const notifications = await Notification.find({ userId });
  res.json(notifications);
});
export default router;
