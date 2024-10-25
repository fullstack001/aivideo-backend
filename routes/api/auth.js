import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { jwtDecode } from "jwt-decode";
import jwt from "jsonwebtoken";
import mg from "mailgun-js";
import { OAuth2Client } from 'google-auth-library';
import { check, validationResult } from "express-validator";
import moment from 'moment';

import jwtSecret from "../../config/jwtSecret";
import auth from "../../middleware/auth";
import { validationCodeContent } from "../../config/mailTemplate";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const mailgun = mg({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

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
      const validationCode = `${Math.floor(100000 + Math.random() * 900000)}`;
      const validationCodeExpiration = moment().add(10, 'minutes').toDate();

      user = new User({
        name,
        email,
        password,
        validationCode,
        validationCodeExpiration,
      });

      // Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save the user registration details to DB
      await user.save();

      // Send validation code to user's email
      await sendValidationEmail(user.email, user.name, validationCode);

      res.status(200).json({
        msg: "Signup successful. Verification code sent to your email.",
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

router.post("/resend", async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ msg: "User is already verified" });
    }

    const validationCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    const validationCodeExpiration = moment().add(10, 'minutes').toDate();

    user.validationCode = validationCode;
    user.validationCodeExpiration = validationCodeExpiration;
    await user.save();

    await sendValidationEmail(user.email, user.name, validationCode);

    res.status(200).json({ msg: "Verification code resent to your email" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.post("/verify", async (req, res) => {
  const { email, validationCode } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ msg: "User is already verified" });
    }

    if (Number(user.validationCode) !== Number(validationCode)) {
      return res.status(400).json({ msg: "Invalid code" });
    }

    if (moment().isAfter(user.validationCodeExpiration)) {
      return res.status(400).json({ msg: "Verification code has expired" });
    }

    // Activate the user
    user.isActive = true;
    user.validationCode = undefined;
    user.validationCodeExpiration = undefined;
    await user.save();

    const newUserData = await User.findOne({ email });

    const payload = {
      user: {
        name: newUserData.name,
        id: newUserData._id,
        email: newUserData.email,
        role: newUserData.role,
      },
    };

    jwt.sign(payload, jwtSecret, { expiresIn: "1 days" }, (err, token) => {
      if (err) throw err;
      res.status(200).json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Helper function to send validation email
async function sendValidationEmail(email, name, validationCode) {
  const emailData = {
    from: process.env.MAILGUN_SENDER,
    to: email,
    subject: "Email Verification Code",
    html: validationCodeContent(name, validationCode),
  };

  return new Promise((resolve, reject) => {
    mailgun.messages().send(emailData, (error, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

//@route    POST api/auth/google
//@desc     Register user with google
//@access   Public

router.post("/google", async (req, res) => {
  const { credential } = req.body;
  const client = new OAuth2Client(process.env.AUTH_GOOGLE_CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        name,
        email,
        googleId,
        password: crypto.randomBytes(16).toString("hex"), // Generate a random password
      });
      await user.save();
    } else if (!user.googleId) {
      // If user exists but doesn't have a googleId, update it
      user.googleId = googleId;
      await user.save();
    }

    const jwtPayload = {
      user: {
        name: user.name,
        id: user._id,
        email: user.email,
        role: user.role,
      },
    };

    jwt.sign(jwtPayload, jwtSecret, { expiresIn: "1 days" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

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

      if(!user.isActive){
        const validationCode = `${Math.floor(100000 + Math.random() * 900000)}`;
        const validationCodeExpiration = moment().add(10, 'minutes').toDate();

        // Update user with new validation code
        user.validationCode = validationCode;
        user.validationCodeExpiration = validationCodeExpiration;
        await user.save();

        // Send validation code to user's email
        await sendValidationEmail(user.email, user.name, validationCode);

        return res.status(403).json({ msg: "not_verified" });
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
