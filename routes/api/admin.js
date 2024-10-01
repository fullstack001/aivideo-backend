import express from "express";
import User from "../../models/User";

const router = express.Router();

router.get("/user", async (req, res) => {
  try {
    const users = await User.find({ isAdmin: { $ne: true } });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching users" });
  }
});

module.exports = router;
