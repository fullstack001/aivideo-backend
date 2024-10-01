import express from "express";

import auth from "../../middleware/auth";
import User from "../../models/User";
import CreditHistory from "../../models/CreditHistory";

const router = express.Router();

router.post("/add-credit", auth, async (req, res) => {
  const { email, credits } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.credit += credits;
    await user.save();

    const credit = new CreditHistory({
      email: email,
      credits: credits,
      description: "Buy",
    });

    await credit.save();

    const creditHistories = await CreditHistory.find({
      email: email,
    });

    res.json(creditHistories);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const creditData = await CreditHistory.find(); // Retrieve all documents
    res.json(creditData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/get-credit/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const creditData = await CreditHistory.find({ email: email });

    if (!creditData) {
      return res.json({ creditData: [] });
    }
    res.json(creditData);
  } catch (err) {
    res.status(500).json({ msg: "Network Error" });
  }
});

module.exports = router;
