import Result from "../models/Result.js";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";
import { checkAndAwardBadges, updateQuizStreak } from "../utils/badges.js";

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;
    const userId = req.user.userId;
    const startTime = req.body.startTime ? new Date(req.body.startTime) : null;

    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required' });
    }

    // Fetch all questions for the quiz
    const questions = await Question.find({ quiz: quizId });

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this quiz' });
    }

    let score = 0;

    questions.forEach((q) => {
      const submitted = answers.find((a) => {
        // Handle both string and ObjectId comparisons
        const questionIdStr = typeof a.questionId === 'string' ? a.questionId : a.questionId?.toString();
        const qIdStr = q._id.toString();
        return questionIdStr === qIdStr;
      });
      
      const correctOption = q.options.find((opt) => opt.isCorrect);

      // Only count as correct if:
      // 1. Answer was submitted
      // 2. Correct option exists
      // 3. Selected option matches correct option text (and is not empty)
      if (submitted && 
          submitted.selectedOption && 
          submitted.selectedOption.trim() !== '' &&
          correctOption && 
          correctOption.optionText === submitted.selectedOption) {
        score++;
      }
    });

    // Calculate time taken if startTime provided, otherwise use provided timeTaken
    let calculatedTimeTaken = timeTaken || 0;
    if (startTime && (!timeTaken || timeTaken === 0)) {
      calculatedTimeTaken = Math.floor((new Date() - startTime) / 1000); // in seconds
    }
    
    // Ensure timeTaken is a valid number
    if (isNaN(calculatedTimeTaken) || calculatedTimeTaken < 0) {
      calculatedTimeTaken = 0;
    }

    // Create result
    const result = await Result.create({
      userId: userId,
      quizId: quizId,
      score,
      total: questions.length,
      timeTaken: calculatedTimeTaken,
    });
    
    // Update quiz participants
    const quiz = await Quiz.findById(quizId);
    if (quiz && !quiz.participants.includes(userId)) {
      quiz.participants.push(userId);
      await quiz.save();
    }

    // Update quiz streak and check for badges
    let awardedBadges = [];
    try {
      await updateQuizStreak(userId);
      awardedBadges = await checkAndAwardBadges(
        userId,
        quizId,
        score,
        questions.length,
        calculatedTimeTaken
      ) || [];
    } catch (badgeError) {
      console.error('Error updating badges or streaks:', badgeError);
      // Don't fail the submission if badge update fails
    }
    
    res.status(200).json({ 
      score, 
      total: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      timeTaken: calculatedTimeTaken,
      awardedBadges,
    });
  } catch (err) {
    console.error("🔥 Error in submitQuiz:", err);
    res.status(500).json({ 
      message: err.message || 'Error submitting quiz',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
