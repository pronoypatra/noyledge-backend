// Load env vars FIRST, before any other imports
// This ensures environment variables are available when modules are imported
import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import cors from "cors";
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cron from 'node-cron';
import connectDB from "./config/db.js"; 

import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bannedKeywordRoutes from "./routes/bannedKeywordRoutes.js";

import { initializeDefaultBadges } from "./utils/badges.js";
import { initializeDefaultCategories } from "./controllers/categoryController.js";
import { autoExpireReports } from "./controllers/reportController.js";
import Chat from "./models/Chat.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json()); // To accept JSON payloads

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads directory created');
}

// Routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/banned-keywords", bannedKeywordRoutes);

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  socket.on('send-message', async (data) => {
    try {
      const { chatId, senderId, text } = data;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return;
      }

      // Add message to database
      chat.messages.push({
        sender: senderId,
        text: text.trim(),
        timestamp: new Date(),
      });

      chat.lastMessageAt = new Date();
      await chat.save();

      // Populate sender info
      const message = chat.messages[chat.messages.length - 1];
      await message.populate('sender', 'name avatar');

      // Emit to all users in the chat room
      io.to(chatId).emit('new-message', message);
    } catch (error) {
      console.error('Error sending message via socket:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Cron job to auto-expire reports (runs daily at midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('Running auto-expire reports job...');
  try {
    // This will be handled by the autoExpireReports controller
    // We'll call it via a scheduled task
    const Report = (await import('./models/Report.js')).default;
    const expiredReports = await Report.find({
      status: 'pending',
      expiresAt: { $lt: new Date() },
    });

    for (const report of expiredReports) {
      report.status = 'ignored';
      report.resolvedAt = new Date();
      await report.save();
    }

    console.log(`Auto-expired ${expiredReports.length} reports`);
  } catch (error) {
    console.error('Error in auto-expire reports job:', error);
  }
});

// Initialize default data on startup
const initializeData = async () => {
  try {
    await initializeDefaultBadges();
    await initializeDefaultCategories();
    console.log('Default data initialized');
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

// Start server after database connection
const startServer = async () => {
  try {
    // Connect to DB - this will exit if connection fails
    await connectDB();
    
    // Initialize default data after DB connection
    await initializeData();
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();
