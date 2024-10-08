import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  background: { type: String },
  script: {
    type: String,
    require: true,
  },
  avatar: { type: Object, require: true },
  video_id: {
    type: String,
    required: true,
  },
  video_name: {
    type: String,
  },
  status: {
    type: String,
  },
  download_url: {
    type: String,
  },
  stream_url: {
    type: String,
  },
  language: {
    type: String,
    require: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const Video = mongoose.model("video", VideoSchema);

export default Video;
