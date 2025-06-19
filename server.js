import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js"; 

import authRoutes from "./routes/authRoutes.js";
// import quizRoutes from "./routes/quizRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // To accept JSON payloads

// Routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Placeholder routes (we’ll add proper ones later)
app.use("/api/auth", authRoutes);
// app.use('/api', quizRoutes);
app.use("/api/quizzes", quizRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
