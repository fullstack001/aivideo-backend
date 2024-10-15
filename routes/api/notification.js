import express from "express";
import auth from "../../middleware/auth.js";

const router = express.Router();

router.get("/get-notifications", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id });
    res.json({ notifications });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

export default router;
