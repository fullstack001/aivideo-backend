import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import formData from "form-data";
import Mailgun from "mailgun.js";

import Report from "../../models/Report";
import fetchReport from "../../config/fetchReport";
import User from "../../models/User";
import CreditHistory from "../../models/CreditHistory";
dotenv.config();

const router = express.Router();

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: "api",
  key:
    process.env.MAILGUN_API_KEY ||
    "edb14c51bf49f676ea581c1145db7efa-6fafb9bf-36bd02c5",
});
const shareLink = async (type, sender_email, to_email, id, content, res) => {
  const reportURL = `${
    process.env.CLIENT
  }viewreport/${type.toLowerCase()}/${id}`;
  const urlMessage = `<p><strong><span style="font-family: helvetica, arial, sans-serif; font-size: 14pt;"><a href=${reportURL}  class="button">${type} Report</a></span></strong></p>`;

  const htmlContent = `<!DOCTYPE html>
                      <html>
                      <head>
                          <style>
                              body {
                                  font-family: Arial, sans-serif;
                                  background-color: #f3f4f6;
                                  margin: 0;
                                  padding: 0;
                              }

                              .email-container {
                                  background-color: #fefefe;
                                  margin: 20px auto;
                                  padding: 20px;
                                  border-radius: 10px;
                                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                  max-width: 600px;
                              }

                              .button {
                                  display: inline-block;
                                  padding: 10px 20px;
                                  font-size: 16px;
                                  cursor: pointer;
                                  text-align: center;
                                  text-decoration: none;
                                  outline: none;
                                  color: #fefefe;
                                  background-color: #007bff;
                                  border: none;
                                  border-radius: 5px;
                                  box-shadow: 0 4px #999;
                              }

                              .button:hover {background-color: #0069d9}

                              .button:active {
                                  background-color: #0069d9;
                                  box-shadow: 0 2px #666;
                                  transform: translateY(2px);
                              }

                              p {
                                  font-size: 16px;
                                  color: #333;
                              }
                          </style>
                      </head>
                      <body>
                          <div class="email-container">
                              <p>Dear valued client,</p>
                              <p>${sender_email} shares the vehicle history report:</p>
                              <p>Click the below button to view the vehicle history report:</p>
                              ${urlMessage}
                              <p>${content}</p>
                              VinPal Support Team</p>
                          </div>
                      </body>
                      </html>`;

  mg.messages
    .create("vinpal.co", {
      from: `Share Report <${sender_email}>`,
      to: [to_email],
      subject: "Reports",
      text: "Report via VinPal!",
      html: htmlContent,
    })
    .then((msg) => {
      res.json("success");
    }) // logs response data
    .catch((err) => {
      console.log(err);
      res.status(500).json({ msg: err.message });
    });
};

const getReport = async (types, email, vinCode, res, vehicle) => {
  const currentUser = await User.findOne({ email });

  try {
    const result = await User.updateOne(
      {
        email: currentUser.follower,
        following: {
          $elemMatch: {
            email: email,
            credit: 0,
          },
        },
      },
      {
        $set: {
          "following.$.credit": 1,
        },
        $inc: {
          credit: 1,
        },
      }
    );

    if (result.nModified > 0) {
      const credit = new CreditHistory({
        email: currentUser.follower,
        credits: 1,
        description: "Get free report",
      });
      await credit.save();
    } else {
      console.log("already updated");
    }
  } catch (error) {
    console.log(error);
  }

  let ids = [],
    urlMessage = "";

  for (const item of types) {
    const resData = await fetchReport(vinCode, item);
    const report = new Report({
      email: email,
      type: item,
      report: resData,
      vinCode: vinCode,
      vehicle: vehicle,
    });
    const savedReport = await report.save();

    const filePath = `ReportFiles/${savedReport.id}.html`;
    await fs.promises.writeFile(filePath, atob(resData));

    ids.push({ type: savedReport.type, id: savedReport.id });
    const reportURL = `${
      process.env.CLIENT
    }viewreport/${savedReport.type.toLowerCase()}/${savedReport.id}`;
    urlMessage += `<p><strong><span style="font-family: helvetica, arial, sans-serif; font-size: 14pt;"><span>${item}: </span><a href=${reportURL}  class="button">${savedReport.type} Report</a></span></strong></p>`;
  }
  const htmlContent = `<!DOCTYPE html>
                      <html>
                      <head>
                          <style>
                              body {
                                  font-family: Arial, sans-serif;
                                  background-color: #f4f4f4;
                                  margin: 0;
                                  padding: 0;
                              }

                              .email-container {
                                  background-color: #ffffff;
                                  margin: 20px auto;
                                  padding: 20px;
                                  border-radius: 10px;
                                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                  max-width: 600px;
                              }

                              .button {
                                  display: inline-block;
                                  padding: 10px 20px;
                                  font-size: 16px;
                                  cursor: pointer;
                                  text-align: center;
                                  text-decoration: none;
                                  outline: none;
                                  color: #fff;
                                  background-color: #007bff;
                                  border: none;
                                  border-radius: 5px;
                                  box-shadow: 0 4px #999;
                              }

                              .button:hover {background-color: #0069d9}

                              .button:active {
                                  background-color: #0069d9;
                                  box-shadow: 0 2px #666;
                                  transform: translateY(2px);
                              }

                              p {
                                  font-size: 16px;
                                  color: #333;
                              }
                          </style>
                      </head>
                      <body>
                          <div class="email-container">
                              <p>Dear valued client,</p>
                              <p>Click the below button to view the vehicle history report:</p>
                              ${urlMessage}
                              <p>hello</p>
                              <p>Please do not reply to this automated message.</p>
                              <p>Best wishes,<br>
                              VinPal Support Team</p>
                          </div>
                      </body>
                      </html>`;

  mg.messages
    .create("vinpal.co", {
      from: "VinPal Support <info@vinpal.co>",
      to: [email],
      subject: "Reports",
      text: "Report via VinPal!",
      html: htmlContent,
    })
    .then((msg) => {
      console.log(msg);
      res.json(ids);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ msg: err.message });
    });
};

router.post("/", async (req, res) => {
  const { email, source, vinCode, vehicle } = req.body;
  const necessaryCredit = source == "Both" ? -2 : -1;
  const types = source !== "Both" ? [source] : ["Carfax", "Autocheck"];
  const creditHistory = new CreditHistory({
    email: email,
    description: "Report Purchase",
    details: source,
    credits: necessaryCredit,
  });
  await creditHistory.save();
  getReport(types, email, vinCode, res, vehicle);
});

router.post("/share-report", async (req, res) => {
  const { to_email, sender_email, id, type, content } = req.body;
  shareLink(type, sender_email, to_email, id, content, res);
});

router.post("/bycredit", async (req, res) => {
  const { email, source, vinCode, vehicle } = req.body;
  const necessaryCredit = source == "Both" ? -2 : -1;
  const user = await User.findOne({ email });
  user.credit = user.credit + necessaryCredit;
  const creditHistory = new CreditHistory({
    email: email,
    description: "Report Purchase",
    details: source,
    credits: necessaryCredit,
  });
  await user.save();
  await creditHistory.save();
  const types = source !== "Both" ? [source] : ["Carfax", "Autocheck"];
  getReport(types, email, vinCode, res, vehicle);
});

router.get("/", async (req, res) => {
  try {
    const report = await Report.find(); // Retrieve all documents
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const report = await Report.find({ email: email }, "-report");

    if (!report) {
      return res.json([]);
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ msg: "Network Error" });
  }
});

router.get("/get-reportdata/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);
    res.json(report.report);
  } catch {
    res.status(403).json({ msg: "Network Error" });
  }
});

module.exports = router;
