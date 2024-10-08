import dotenv from "dotenv";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || "multilanguage_video_secret";

export default jwtSecret;
