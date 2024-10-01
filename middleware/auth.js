import jwt from "jsonwebtoken";
import jwtSecret from "../config/jwtSecret";

export default function auth(req, res, next) {
  // Get token from header
  const token = req.headers.authorization;

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: "UnAuthrized" });
  }

  // Verify token
  try {
    jwt.verify(token, jwtSecret, (error, decoded) => {
      if (error) {
        return res.status(401).json({ msg: "Token is not valid" });
      } else {
        req.user = decoded.user;
        next();
      }
    });
  } catch (err) {
    console.error("Something is wrong with auth middleware");
    res.status(500).json({ msg: "Server Error" });
  }
}
