import express from "express";
import stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const key = process.env.STRIPE_KEY || "";

const stripeInstance = stripe(key);

router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount,
      currency: "usd",
    });

    res.status(200).send(paymentIntent.client_secret);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
