import express from "express";
const router = express.Router();
import Question from "../../models/Question";

router.post("/", async (req, res) => {
  try {
    const { email, message } = req.body;
    const question = new Question({
      email,
      message,
    });

    question
      .save()
      .then(() => {
        res.send({ msg: "seccess" });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ mgs: "Message send error " });
      });
  } catch (err) {
    console.log(error);
    res.status(500).json({ mgs: "Message send error " });
  }
});

module.exports = router;
