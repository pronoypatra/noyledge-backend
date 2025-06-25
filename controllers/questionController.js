import Quiz from '../models/Quiz.js';
import Result from '../models/Result.js';
import Question from '../models/Question.js'; 

export const addQuestion = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const { questionText, options, correctOption } = req.body;

    // Basic validation
    if (!questionText || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        message: 'Question text and at least two options are required.',
      });
    }

    if (typeof correctOption !== 'number' || correctOption < 0 || correctOption >= options.length) {
      return res.status(400).json({
        message: 'Valid correctOption index is required.',
      });
    }

    // Prepare options with isCorrect
    const formattedOptions = options.map((text, index) => ({
      optionText: text,
      isCorrect: index === correctOption,
    }));

    // Create and save the question
    const newQuestion = new Question({
      quiz: quizId,
      questionText,
      options: formattedOptions,
    });

    await newQuestion.save();

    res.status(201).json({
      message: 'Question added successfully',
      question: newQuestion,
    });
  } catch (err) {
    console.error('❌ Error adding question:', err);
    res.status(500).json({ message: 'Server error adding question' });
  }
};

export const getQuestionsByQuiz = async (req, res) => {
  const { quizId } = req.params;

  try {
    const questions = await Question.find({ quiz: quizId});
    
    if (!questions || questions.length === 0) {
      console.warn("⚠️ No questions found for quizId:", quizId);
    } else {
    }

    res.json(questions);
  } catch (err) {
    console.error("❌ Error occurred in getQuestionsByQuiz:", err.message);
    res.status(500).json({ message: "Server error fetching questions" });
  }
};