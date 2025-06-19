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

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

import { submitQuiz } from "../controllers/resultController.js";

import * as quizController from '../controllers/quizController.js';

// Quiz routes
router.post("/", protect, allowRoles("admin"), createQuiz);
router.get("/", protect, getAllQuizzes);

router.post("/:quizId/submit", protect, submitQuiz);
// POST /api/quizzes
// router.post('/quizzes', protect, allowRoles("admin"), createQuiz);
// POST /api/quizzes/:id/questions
// router.post('/quizzes/:id/questions', protect, allowRoles("admin"), addQuestion);
// GET /api/quizzes/:id/results
// router.get('/quizzes/:id/results', protect, allowRoles("admin"), getQuizResults);

// Question routes
router.post("/:quizId/questions", protect, allowRoles("admin"), addQuestion);
router.get("/:quizId/questions", protect, getQuestionsByQuiz);


module.exports = router;
