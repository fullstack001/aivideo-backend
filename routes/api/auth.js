import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { jwtDecode } from "jwt-decode";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator";
import jwtSecret from "../../config/jwtSecret";

import auth from "../../middleware/auth";

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

import User from "../../models/User";

// @route    POST api/auth/signup
// @desc     Register user
// @access   Public

router.post(
  "/signup",
  check("email", "Please include a valid email").isEmail(),
  check(
    "password",
    "Please enter a password with 6 or more characters"
  ).isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //Retrieve the info from post request
    const { name, email, password } = req.body;
    try {
      //Check in the DB whether user already exists or not
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: "exist" });
      }

      // Prepare user template to be stored in DB
      user = new User({
        name,
        email,
        password,
      });

      // Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save the user registration details to DB
      await user.save();

      //   res.send('User Registered');

      const payload = {
        user: {
          name: user.name,
          id: user._id,
          email: user.email,
          isAdmin: user.isAdmin,
          credit: user.credit,
        },
      };

      jwt.sign(payload, jwtSecret, { expiresIn: "1 days" }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route    POST api/auth/signin
// @desc     Register user
// @access   Public

router.post(
  "/signin",
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password is required").exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log(jwtSecret)

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "email" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: "password" });
      }

      const payload = {
        user: {
          name: user.name,
          id: user._id,
          email: user.email,
          isAdmin: user.isAdmin,
          credit: user.credit,
          following: user.following,
        },
      };

      jwt.sign(payload, jwtSecret, { expiresIn: "1 days" }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

router.get("/getUserData", auth, async (req, res) => {
  try {
    const newUserData = await User.findById(req.user.id);
    const payload = {
      user: {
        name: newUserData.name,
        id: newUserData._id,
        email: newUserData.email,
        isAdmin: newUserData.isAdmin,
        credit: newUserData.credit,
        following: newUserData.following,
      },
    };

    jwt.sign(payload, jwtSecret, { expiresIn: "1 days" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route    POST api/auth/changeuser
// @desc     change user data
// @access   Private

router.post("/changeuser/:id", auth, async (req, res) => {
  const user = User.findById(req.params.id);
  const { name, email } = req.body;
  if (!user) return res.status(404).json({ msg: "User not find" });
  try {
    // Update the user's profile
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true } // Return the updated user
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "The email already exist" });
  }
});

// @route    POST api/auth/changepass
// @desc     change user password
// @access   Private

router.post("/changepass/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id);
  const { oldPass, newPass } = req.body;
  if (!user) return res.status(400).json({ msg: "User not find" });

  const isMatch = await bcrypt.compare(oldPass, user.password);

  if (!isMatch) {
    return res.status(400).json({ msg: "Old password not mached" });
  }

  if (oldPass == newPass) {
    return res.status(400).json({ msg: "You already use this password" });
  }

  try {
    // Update the user's password
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(newPass, salt);
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { password },
      { new: true } // Return the updated user
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "The email already exist" });
  }
});

// @route    POST api/auth/resetpass
// @desc     reset user psssword
// @access   Public

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwtDecode(token);
    if (Date.now() > decoded.exp * 1000) {
      res.status(400).send({ msg: "Token has expired" });
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res
        .status(400)
        .send({ msg: "Invalid token or user does not exist" });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.status(200).send("Password has been reset");
  } catch (error) {
    res.status(400).send({ msg: "Invalid token" });
  }
});

module.exports = router;
