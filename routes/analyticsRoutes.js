import express from "express";
import {
  getQuizAnalytics,
  getParticipantGrowth,
  getAttemptsOverTime,
  getScoreTrends,
  getCompletionTimeAnalytics,
} from "../controllers/analyticsController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/quiz/:quizId", protect, getQuizAnalytics);
router.get("/quiz/:quizId/participants", protect, getParticipantGrowth);
router.get("/quiz/:quizId/attempts", protect, getAttemptsOverTime);
router.get("/quiz/:quizId/scores", protect, getScoreTrends);
router.get("/quiz/:quizId/completion-time", protect, getCompletionTimeAnalytics);

export default router;

