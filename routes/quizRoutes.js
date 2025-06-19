const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getAllQuizzes,
  getQuizResults,
} = require("../controllers/quizController");

const {
  addQuestion,
  getQuestionsByQuiz,
} = require("../controllers/questionController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const { submitQuiz } = require("../controllers/resultController");

const quizController = require('../controllers/quizController');

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
