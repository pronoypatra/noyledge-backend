import Quiz from "../models/Quiz.js";
import Question from "../models/Question.js";
import Result from "../models/Result.js";

export const createQuiz = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!req.user) {
      console.error('No user found in request!');
      return res.status(401).json({ message: "You must be logged in to create a quiz." });
    }

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const newQuiz = new Quiz({
      title,
      description,
      createdBy: req.user.userId, // make sure your user object has userId here
      questions: [], // Initially no questions
    });

    await newQuiz.save();

    res.status(201).json({ message: "Quiz created successfully", quiz: newQuiz });
  } catch (err) {
    res.status(500).json({ message: "Error creating quiz" });
  }
};

export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate("createdBy", "name email");
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getQuizResults = async (req, res) => {
  try {
    const quizId = req.params.quizId;

    const results = await Result.find({ quizId }).populate('userId', 'name');
    // console.log("📊 Retrieved results:", results);

    const quiz = await Quiz.findById(quizId);

    const formattedResults = results.map(r => {
      return {
        username: r.username || r.userId?.name,
        score: r.score,
        total: r.total,
        attemptedAt: r.attemptedAt,
      };
    });

    res.status(200).json({
      title: quiz?.title || 'Quiz',
      results: formattedResults,
    });

  } catch (err) {
    console.error("❌ Error in getQuizResults:", err);
    res.status(500).json({ message: 'Error fetching results' });
  }
};

