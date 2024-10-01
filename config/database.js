import { connect } from "mongoose";

const connectDB = async () => {
  try {
    await connect(process.env.DATABASE_URL);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

export default connectDB;
