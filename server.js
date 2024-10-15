import express from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

import connectDB from "./config/database";
import createAdmin from "./config/createAdmin";

import auth from "./routes/api/auth";
import question from "./routes/api/question";
import payment from "./routes/api/payment";
import admin from "./routes/api/admin";
import credit from "./routes/api/credit";
import videoCreate from "./routes/api/videoCreate";
import videoManagement from "./routes/api/videoManagement";
import notification from "./routes/api/notification";
import replica from "./routes/api/replica";

import { initIO } from "./socket";

dotenv.config();

const app = express();
const server = http.createServer(app);
server.timeout = 1000000;

initIO(server);

connectDB();
createAdmin();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "2000mb", extended: false }));
app.use(cors({ origin: "*" }));

app.use("/api/auth", auth);
app.use("/api/question", question);
app.use("/api/payment", payment);
app.use("/api/admin", admin);
app.use("/api/credit", credit);
app.use("/api/video-create", videoCreate);
app.use("/api/video-management", videoManagement);
app.use("/api/notification", notification);
app.use("/api/replica", replica);
app.get("/", (req, res) => {
  res.send(" API Running");
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port:${port}`);
});
