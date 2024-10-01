import mongoose from "mongoose";

const CreditHistorySchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    default: "",
  },
  details: {
    type: String,
    default: "",
  },
  credits: {
    type: Number,
    require: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const CreditHistory = mongoose.model("credithistory", CreditHistorySchema);

export default CreditHistory;
