import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  role: {
    type: String,
    default: "user",
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId, // Reference to PlanSchema's ID
    ref: "Plan", // Refers to the "Plan" model
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("user", UserSchema);
export default User;