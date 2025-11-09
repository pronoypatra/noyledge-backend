import express from "express";
const router = express.Router();

import {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  exploreQuizzes,
  subscribeQuiz,
  saveQuiz,
  getSavedQuizzes,
  getQuizResults,
} from "../controllers/quizController.js";

import {
  addQuestion,
  getQuestionsByQuiz,
} from "../controllers/questionController.js";

import { submitQuiz } from "../controllers/resultController.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { uploadQuizImage } from "../middleware/uploadMiddleware.js";
import { filterBannedKeywords } from "../middleware/bannedKeywordsMiddleware.js";

// Quiz routes - Order matters! More specific routes first
router.get("/explore", exploreQuizzes); // Public route for exploring
router.get("/saved", protect, getSavedQuizzes);
// Note: uploadQuizImage must come before json parsing, so it's handled in the controller
router.post("/", protect, allowRoles("admin"), uploadQuizImage, createQuiz);
router.get("/", protect, getAllQuizzes);
// :quizId routes should come after /explore and /saved
router.post("/:quizId/submit", protect, submitQuiz);
router.get('/:quizId/results', protect, allowRoles("admin"), getQuizResults);
router.post("/:quizId/subscribe", protect, subscribeQuiz);
router.post("/:quizId/save", protect, saveQuiz);
router.get("/:quizId", getQuizById);
router.put("/:quizId", protect, uploadQuizImage, updateQuiz);
router.delete("/:quizId", protect, allowRoles("admin"), deleteQuiz);

// Question routes
router.post("/:quizId/questions", protect, allowRoles("admin"), addQuestion);
router.get("/:quizId/questions", getQuestionsByQuiz);

export default router;
