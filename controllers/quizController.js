import Quiz from "../models/Quiz.js";
import Question from "../models/Question.js";
import Result from "../models/Result.js";

exports.createQuiz = async (req, res) => {
  try {
    console.log("✅ createQuiz controller hit");
    const { title, description } = req.body;
    const createdBy = req.user._id;
    if (!req.user) {
      console.error('No user found in request!');
      return res.status(401).json({ message: "You must be logged in to create a quiz." });
    }
    // Ensure that req.user._id is available
    console.log('Creating quiz for user:', req.user._id);

    const newQuiz = new Quiz({
      title,
      description,
      createdBy:req.user.userId, 
      questions: [], // Initially no questions
    });
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }
    
    await newQuiz.save();

    res.status(201).json({ message: "Quiz created successfully", quiz: newQuiz });
  } catch (err) {
    console.error("Quiz creation error:", err);
    res.status(500).json({ message: "Error creating quiz" });
  }
};

exports.getAllQuizzes = async (req, res) => {
  try {
    // console.log("✅ getAllQuizzes controller hit");

    const quizzes = await Quiz.find().populate("createdBy", "name email");

    // Log the quizzes to verify if population works
    // console.log("Populated Quizzes:", quizzes);

    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuizResults = async (req, res) => {
  try {
    const quizId = req.params.id;

    const results = await Result.find({ quizId }).populate('userId', 'username');

    res.status(200).json({
      title: (await Quiz.findById(quizId))?.title || 'Quiz',
      results: results.map(r => ({
        username: r.username || r.userId.username,
        score: r.score,
        total: r.total,
        attemptedAt: r.attemptedAt
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching results' });
  }
};

