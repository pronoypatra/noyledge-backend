import Quiz from '../models/Quiz.js';
import Result from '../models/Result.js';
import Question from '../models/Question.js'; 
import User from '../models/User.js';
import { replaceBannedKeywords } from '../utils/bannedKeywords.js';

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

    // Filter banned keywords
    const filteredQuestionText = await replaceBannedKeywords(questionText);
    const filteredOptions = await Promise.all(
      options.map(async (text) => await replaceBannedKeywords(text))
    );

    // Prepare options with isCorrect
    const formattedOptions = filteredOptions.map((text, index) => ({
      optionText: text,
      isCorrect: index === correctOption,
    }));

    // Create and save the question
    const newQuestion = new Question({
      quiz: quizId,
      questionText: filteredQuestionText,
      originalText: questionText, // Store original text
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
    }

    // Return questions (banned keywords already filtered when created)
    res.json(questions);
  } catch (err) {
    console.error("❌ Error occurred in getQuestionsByQuiz:", err.message);
    res.status(500).json({ message: "Server error fetching questions" });
  }
};

export const saveQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.userId;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const user = await User.findById(userId);
    const isSaved = user.savedQuestions.includes(questionId);

    if (isSaved) {
      user.savedQuestions = user.savedQuestions.filter(id => id.toString() !== questionId.toString());
    } else {
      user.savedQuestions.push(questionId);
    }

    await user.save();

    res.json({
      message: isSaved ? "Question removed from saved" : "Question saved",
      saved: !isSaved,
    });
  } catch (err) {
    console.error('Error saving question:', err);
    res.status(500).json({ message: "Error saving question" });
  }
};

export const getSavedQuestions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate({
      path: 'savedQuestions',
      populate: {
        path: 'quiz',
        select: 'title description',
      },
    });

    res.json(user.savedQuestions || []);
  } catch (err) {
    console.error('Error getting saved questions:', err);
    res.status(500).json({ message: "Error fetching saved questions" });
  }
};