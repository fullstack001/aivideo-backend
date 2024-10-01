import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
  },
  message: {
    type: String,
    require: true,
  },
  reply: {
    type: Boolean,
    default: false,
  },
  replyData: {
    type: Date,
    require: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Question = mongoose.model("question", QuestionSchema);

export default Question;
