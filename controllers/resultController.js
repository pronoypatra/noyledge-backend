import Result from "../models/Result.js";
import Question from "../models/Question.js";


exports.submitQuiz = async (req, res) => {
  const { quizId, answers } = req.body;
  const userId = req.user.userId;

  try {
    const questions = await Question.find({ quiz: quizId });
    let score = 0;

    questions.forEach((q) => {
      const submitted = answers.find((a) => a.questionId === q._id.toString());
      const correctOption = q.options.find((opt) => opt.isCorrect);

      if (submitted && correctOption.optionText === submitted.selectedOption) {
        score++;
      }
    });

    const result = await Result.create({
      user: userId,
      quiz: quizId,
      score,
      total: questions.length,
    });

    res.status(200).json({ score, total: questions.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
