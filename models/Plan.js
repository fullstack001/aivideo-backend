import mongoose, { Schema } from "mongoose";

const PlanSchema = new Schema({
  name: { type: String, required: true },
  videosPerMonth: { type: Number, required: true },
  duration: { type: String, required: true },
  cost_monto: { type: Number, required: true },
  cost_year: { type: Number, required: true },
  strage: { type: Number, required: true },
  date: { type: Date, default: Date.now() },
});

export default mongoose.model("plan", PlanSchema);
