import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
  },
  vinCode: {
    type: String,
    require: true,
  },
  vehicle: {
    type: String,
    require: false,
  },
  type: {
    type: String,
    require: true,
  },

  report: {
    type: String,
    require: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const Report = mongoose.model("report", ReportSchema);
export default Report;
