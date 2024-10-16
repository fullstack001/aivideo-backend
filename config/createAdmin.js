import bcrypt from "bcryptjs";
import User from "../models/User";

const createAdmin = async () => {
  const name = "Admin";
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash("123456", salt);
  const email = "admin@admin.com";
  const admin = await User.findOne({ email });
  if (!admin) {
    const newUser = new User({
      name: name,
      email: email,
      password: password,
      role: "admin",
    });
    await newUser.save();
    console.log("Admin user added successfully.");
  } else {
    console.log("Admin user already exists.");
  }

  // Check if admin user exists, if not, create one
};

module.exports = createAdmin;
