import Result from "../models/Result.js";
import Question from "../models/Question.js";
export const submitQuiz = async (req, res) => {
  const { quizId, answers } = req.body;
  const userId = req.user.userId;
  try {

    // Fetch all questions for the quiz
    const questions = await Question.find({ quiz: quizId });
    // console.log("❓ Retrieved Questions:", questions.length);

    let score = 0;

    questions.forEach((q) => {
      const submitted = answers.find((a) => a.questionId === q._id.toString());
      const correctOption = q.options.find((opt) => opt.isCorrect);

      // console.log(`🔍 Checking Question ID: ${q._id}`);
      // console.log("✅ Correct Option:", correctOption?.optionText);
      // console.log("📩 Submitted Answer:", submitted?.selectedOption);

      if (submitted && correctOption.optionText === submitted.selectedOption) {
        // console.log("🎯 Correct Answer!");
        score++;
      } else {
        // console.log("❌ Incorrect or unanswered.");
      }
    });

    // console.log(`📊 Final Score: ${score} / ${questions.length}`);

    const result = await Result.create({
      userId: userId,
      quizId: quizId,
      score,
      total: questions.length,
    });
    
    res.status(200).json({ score, total: questions.length });
  } catch (err) {
    console.error("🔥 Error in submitQuiz:", err);
    res.status(500).json({ message: err.message });
  }
};
