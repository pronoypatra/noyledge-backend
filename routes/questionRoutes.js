import express from "express";
import {
  saveQuestion,
  getSavedQuestions,
} from "../controllers/questionController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:questionId/save", protect, saveQuestion);
router.get("/saved", protect, getSavedQuestions);

export default router;

