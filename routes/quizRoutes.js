import express from "express";
const router = express.Router();

import {
  createQuiz,
  getAllQuizzes,
  getQuizResults,
} from "../controllers/quizController.js";

import {
  addQuestion,
  getQuestionsByQuiz,
} from "../controllers/questionController.js";

import { submitQuiz } from "../controllers/resultController.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

// Quiz routes
router.post("/", protect, allowRoles("admin"), createQuiz);
router.get("/", protect, getAllQuizzes);

router.post("/:quizId/submit", protect, submitQuiz);
router.get('/:quizId/results', protect, allowRoles("admin"), getQuizResults);


// Question routes
router.post("/:quizId/questions", protect, allowRoles("admin"), addQuestion);
router.get("/:quizId/questions", getQuestionsByQuiz);

export default router;
