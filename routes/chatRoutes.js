import express from "express";
import {
  getChats,
  createChat,
  getMessages,
  sendMessage,
} from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getChats);
router.post("/", protect, createChat);
router.get("/:chatId/messages", protect, getMessages);
router.post("/:chatId/messages", protect, sendMessage);

export default router;

