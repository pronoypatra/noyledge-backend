import Quiz from "../models/Quiz.js";
import Question from "../models/Question.js";
import Result from "../models/Result.js";
import User from "../models/User.js";
import { replaceBannedKeywords } from "../utils/bannedKeywords.js";

export const createQuiz = async (req, res) => {
  try {
    const { title, description, tags, difficulty, imageUrl } = req.body;
    if (!req.user) {
      console.error('No user found in request!');
      return res.status(401).json({ message: "You must be logged in to create a quiz." });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    // Filter banned keywords
    const filteredTitle = await replaceBannedKeywords(title);
    const filteredDescription = description ? await replaceBannedKeywords(description) : "";

    // Handle image upload
    let finalImageUrl = imageUrl || "";
    if (req.file) {
      // File uploaded via multer
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    // Parse tags - can come as JSON string, array, or comma-separated string
    let tagsArray = [];
    if (tags) {
      if (typeof tags === 'string') {
        try {
          // Try to parse as JSON first
          tagsArray = JSON.parse(tags);
        } catch (e) {
          // If not JSON, treat as comma-separated string
          tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      }
    }

    const newQuiz = new Quiz({
      title: filteredTitle,
      description: filteredDescription,
      createdBy: req.user.userId,
      questions: [],
      tags: tagsArray,
      difficulty: difficulty || "medium",
      imageUrl: finalImageUrl,
      participants: [],
      subscribers: [],
      isPublished: true,
    });

    await newQuiz.save();

    res.status(201).json({ message: "Quiz created successfully", quiz: newQuiz });
  } catch (err) {
    console.error('Error creating quiz:', err);
    res.status(500).json({ message: "Error creating quiz" });
  }
};

export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isPublished: true })
      .populate("createdBy", "name email avatar")
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId)
      .populate("createdBy", "name email avatar")
      .populate("participants", "name")
      .populate("subscribers", "name");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Get stats
    const questions = await Question.find({ quiz: quizId });
    const results = await Result.find({ quizId });

    const participantsCount = new Set(results.map(r => r.userId.toString())).size;
    const totalQuestions = questions.length;
    const averageScore = results.length > 0
      ? results.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / results.length
      : 0;

    res.json({
      quiz,
      stats: {
        participantsCount,
        totalQuestions,
        averageScore: Math.round(averageScore * 100) / 100,
        totalAttempts: results.length,
      },
    });
  } catch (err) {
    console.error('Error getting quiz:', err);
    res.status(500).json({ message: "Error fetching quiz" });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title, description, tags, difficulty, imageUrl, isPublished } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if user is the creator or admin
    if (quiz.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update this quiz" });
    }

    if (title) quiz.title = await replaceBannedKeywords(title);
    if (description !== undefined) quiz.description = description ? await replaceBannedKeywords(description) : "";
    
    // Handle tags
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        quiz.tags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      } else if (Array.isArray(tags)) {
        quiz.tags = tags;
      }
    }
    
    if (difficulty) quiz.difficulty = difficulty;
    
    // Handle image upload
    if (req.file) {
      quiz.imageUrl = `/uploads/${req.file.filename}`;
    } else if (imageUrl !== undefined) {
      quiz.imageUrl = imageUrl;
    }
    
    if (isPublished !== undefined) quiz.isPublished = isPublished;

    await quiz.save();

    res.json({ message: "Quiz updated successfully", quiz });
  } catch (err) {
    console.error('Error updating quiz:', err);
    res.status(500).json({ message: "Error updating quiz" });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if user is the creator or admin
    if (quiz.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this quiz" });
    }

    // Delete associated questions
    await Question.deleteMany({ quiz: quizId });

    // Delete associated results
    await Result.deleteMany({ quizId });

    // Remove from users' saved quizzes
    await User.updateMany(
      { savedQuizzes: quizId },
      { $pull: { savedQuizzes: quizId } }
    );

    // Delete the quiz
    await Quiz.findByIdAndDelete(quizId);

    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error('Error deleting quiz:', err);
    res.status(500).json({ message: "Error deleting quiz" });
  }
};

export const exploreQuizzes = async (req, res) => {
  try {
    const { search, tags, difficulty, sortBy = 'date', page = 1, limit = 10 } = req.query;

    const query = { isPublished: true };

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Filter by difficulty
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all quizzes matching query first
    let quizzes = await Quiz.find(query)
      .populate("createdBy", "name email avatar");

    // Get stats for each quiz
    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const results = await Result.find({ quizId: quiz._id });
        const questions = await Question.find({ quiz: quiz._id });

        const participantsCount = new Set(results.map(r => r.userId.toString())).size;
        const averageScore = results.length > 0
          ? results.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / results.length
          : 0;

        return {
          ...quiz.toObject(),
          stats: {
            participantsCount,
            totalQuestions: questions.length,
            averageScore: Math.round(averageScore * 100) / 100,
          },
        };
      })
    );

    // Sort based on sortBy parameter
    switch (sortBy) {
      case 'name':
        quizzesWithStats.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'popularity':
        quizzesWithStats.sort((a, b) => b.stats.participantsCount - a.stats.participantsCount);
        break;
      case 'date':
      default:
        quizzesWithStats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    // Apply pagination after sorting
    const paginatedQuizzes = quizzesWithStats.slice(skip, skip + parseInt(limit));

    const total = quizzesWithStats.length;

    res.json({
      quizzes: paginatedQuizzes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Error exploring quizzes:', err);
    res.status(500).json({ message: "Error fetching quizzes" });
  }
};

export const subscribeQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const isSubscribed = quiz.subscribers.includes(userId);

    if (isSubscribed) {
      quiz.subscribers = quiz.subscribers.filter(id => id.toString() !== userId.toString());
    } else {
      quiz.subscribers.push(userId);
    }

    await quiz.save();

    res.json({
      message: isSubscribed ? "Unsubscribed from quiz" : "Subscribed to quiz",
      subscribed: !isSubscribed,
    });
  } catch (err) {
    console.error('Error subscribing to quiz:', err);
    res.status(500).json({ message: "Error subscribing to quiz" });
  }
};

export const saveQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if quiz is already saved (compare as strings to handle ObjectId comparison)
    const isSaved = user.savedQuizzes.some(id => id.toString() === quizId.toString());

    if (isSaved) {
      // Remove from saved
      user.savedQuizzes = user.savedQuizzes.filter(id => id.toString() !== quizId.toString());
    } else {
      // Add to saved
      user.savedQuizzes.push(quizId);
    }

    await user.save();

    res.json({
      message: isSaved ? "Quiz removed from saved" : "Quiz saved",
      saved: !isSaved,
    });
  } catch (err) {
    console.error('Error saving quiz:', err);
    res.status(500).json({ message: "Error saving quiz" });
  }
};

export const getSavedQuizzes = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate({
      path: 'savedQuizzes',
      populate: {
        path: 'createdBy',
        select: 'name email avatar',
      },
    });

    res.json(user.savedQuizzes || []);
  } catch (err) {
    console.error('Error getting saved quizzes:', err);
    res.status(500).json({ message: "Error fetching saved quizzes" });
  }
};

export const getQuizResults = async (req, res) => {
  try {
    const quizId = req.params.quizId;

    const results = await Result.find({ quizId }).populate('userId', 'name');

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

