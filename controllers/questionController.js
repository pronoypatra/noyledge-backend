const Quiz = require('../models/Quiz');
const Result = require('../models/Result');

exports.addQuestion = async (req, res) => {
  try {
    const quizId = req.params.id;
    const { questionText, options, correctOption } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    quiz.questions.push({ questionText, options, correctOption });
    await quiz.save();

    res.status(200).json({ message: 'Question added successfully', quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding question' });
  }
};

exports.getQuestionsByQuiz = async (req, res) => {
  const { quizId } = req.params;

  try {
    const questions = await Question.find({ quiz: quizId });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
