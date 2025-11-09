// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

// Export environment variables with defaults
export const env = {
  PORT: process.env.PORT || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  BACKEND_URL: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CAS_URL: process.env.CAS_URL || "https://cas.example.edu/cas",
  CAS_VERSION: process.env.CAS_VERSION || "2.0",
  CAS_EMAIL_DOMAIN: process.env.CAS_EMAIL_DOMAIN || "example.edu",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

export default env;

