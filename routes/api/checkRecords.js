import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
    const { vin } = req.body;

    console.log(vin);

    try {
        const reports = await axios.get(`${process.env.CARSIMULCAST_URI}checkrecords/${vin}`, {
            headers: {
                "API-KEY": process.env.CARSIMULCAST_API_KEY,
                "API-SECRET": process.env.CARSIMULCAST_SECRET_KEY,
                "Content-Type": "application/pdf",
                "Content-Diposition": "inline;filename=sticker.pdf",
            },
        });
        res.json(reports.data)
    } catch (error) {
        res.status(404).json(error)
    }
    
})

module.exports = router;

