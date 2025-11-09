import Report from '../models/Report.js';
import Question from '../models/Question.js';
import Quiz from '../models/Quiz.js';
import { replaceBannedKeywords } from '../utils/bannedKeywords.js';

export const createReport = async (req, res) => {
  try {
    const { questionId, reason } = req.body;
    const reportedBy = req.user.userId;

    if (!questionId || !reason) {
      return res.status(400).json({ message: 'Question ID and reason are required' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user already reported this question
    const existingReport = await Report.findOne({
      questionId,
      reportedBy,
      status: 'pending',
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this question' });
    }

    const report = await Report.create({
      questionId,
      reportedBy,
      reason,
    });

    // Increment report count on question
    question.reportCount += 1;
    await question.save();

    res.status(201).json({
      message: 'Report submitted successfully',
      report,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error creating report' });
  }
};

export const getReports = async (req, res) => {
  try {
    // Only admins can view reports
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status } = req.query;
    const currentUserId = req.user.userId;

    // First, find all quizzes created by the current admin
    const userQuizzes = await Quiz.find({ createdBy: currentUserId }).select('_id');
    const userQuizIds = userQuizzes.map(quiz => quiz._id);

    // If admin has no quizzes, return empty array
    if (userQuizIds.length === 0) {
      return res.json([]);
    }

    // Find all questions that belong to the admin's quizzes
    const userQuestions = await Question.find({ quiz: { $in: userQuizIds } }).select('_id');
    const userQuestionIds = userQuestions.map(question => question._id);

    // If admin has no questions, return empty array
    if (userQuestionIds.length === 0) {
      return res.json([]);
    }

    // Build query to filter reports by question IDs
    const query = {
      questionId: { $in: userQuestionIds }
    };
    
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('questionId', 'questionText options quiz')
      .populate('reportedBy', 'name email')
      .populate({
        path: 'questionId',
        populate: {
          path: 'quiz',
          select: 'title createdBy',
        },
      })
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
};

export const fixReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { reportId } = req.params;
    const { questionText, options } = req.body;
    const currentUserId = req.user.userId;

    const report = await Report.findById(reportId).populate({
      path: 'questionId',
      populate: {
        path: 'quiz',
        select: 'createdBy',
      },
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if the quiz belongs to the current admin
    const quiz = report.questionId?.quiz;
    if (!quiz || quiz.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ message: 'You can only fix reports for your own quizzes' });
    }

    // Get question ID (could be ObjectId or populated object)
    const questionId = report.questionId._id || report.questionId;
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Update question with filtered text
    if (questionText) {
      question.questionText = await replaceBannedKeywords(questionText);
      question.originalText = questionText;
    }

    if (options && Array.isArray(options)) {
      question.options = await Promise.all(
        options.map(async (option) => {
          if (typeof option === 'string') {
            return {
              optionText: await replaceBannedKeywords(option),
              isCorrect: false,
            };
          } else if (option.optionText) {
            return {
              optionText: await replaceBannedKeywords(option.optionText),
              isCorrect: option.isCorrect || false,
            };
          }
          return option;
        })
      );
    }

    await question.save();

    // Update report status
    report.status = 'fixed';
    report.resolvedAt = new Date();
    await report.save();

    res.json({
      message: 'Question fixed successfully',
      question,
    });
  } catch (error) {
    console.error('Error fixing report:', error);
    res.status(500).json({ message: 'Error fixing question' });
  }
};

export const ignoreReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { reportId } = req.params;
    const currentUserId = req.user.userId;

    const report = await Report.findById(reportId).populate({
      path: 'questionId',
      populate: {
        path: 'quiz',
        select: 'createdBy',
      },
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if the quiz belongs to the current admin
    const quiz = report.questionId?.quiz;
    if (!quiz || quiz.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ message: 'You can only ignore reports for your own quizzes' });
    }

    report.status = 'ignored';
    report.resolvedAt = new Date();
    await report.save();

    res.json({
      message: 'Report ignored',
      report,
    });
  } catch (error) {
    console.error('Error ignoring report:', error);
    res.status(500).json({ message: 'Error ignoring report' });
  }
};

export const deleteReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { reportId } = req.params;
    const currentUserId = req.user.userId;

    const report = await Report.findById(reportId).populate({
      path: 'questionId',
      populate: {
        path: 'quiz',
        select: 'createdBy',
      },
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if the quiz belongs to the current admin
    const quiz = report.questionId?.quiz;
    if (!quiz || quiz.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ message: 'You can only delete questions from your own quizzes' });
    }

    // Get question ID (could be ObjectId or populated object)
    const questionId = report.questionId._id || report.questionId;
    const question = await Question.findById(questionId);
    if (question) {
      // Delete the question
      await Question.findByIdAndDelete(questionId);
    }

    // Update report status
    report.status = 'deleted';
    report.resolvedAt = new Date();
    await report.save();

    res.json({
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Error deleting question' });
  }
};

export const autoExpireReports = async (req, res) => {
  try {
    // This should be called by a cron job
    const expiredReports = await Report.find({
      status: 'pending',
      expiresAt: { $lt: new Date() },
    });

    for (const report of expiredReports) {
      report.status = 'ignored';
      report.resolvedAt = new Date();
      await report.save();
    }

    res.json({
      message: `${expiredReports.length} reports auto-expired`,
      expired: expiredReports.length,
    });
  } catch (error) {
    console.error('Error auto-expiring reports:', error);
    res.status(500).json({ message: 'Error auto-expiring reports' });
  }
};

