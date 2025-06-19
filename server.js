const express = require("express");
import dotenv from "dotenv";
import cors from "cors";
const connectDB = require("./config/db");

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
app.use("/api/auth", require("./routes/authRoutes"));
// app.use('/api', require("./routes/quizRoutes"));
app.use("/api/quizzes", require("./routes/quizRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
