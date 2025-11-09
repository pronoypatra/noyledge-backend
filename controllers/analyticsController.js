import Analytics from '../models/Analytics.js';
import Result from '../models/Result.js';
import Quiz from '../models/Quiz.js';
import Report from '../models/Report.js';
import Question from '../models/Question.js';

export const getQuizAnalytics = async (req, res) => {
  try {
    const quizId = req.params.quizId;

    // Verify quiz exists and user has permission
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all results for this quiz
    const results = await Result.find({ quizId });

    // Calculate stats
    const totalParticipants = new Set(results.map(r => r.userId.toString())).size;
    const totalAttempts = results.length;
    const averageScore = totalAttempts > 0
      ? results.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / totalAttempts
      : 0;

    // Get reports for questions in this quiz
    const questions = await Question.find({ quiz: quizId });
    const questionIds = questions.map(q => q._id);
    const reports = await Report.find({ questionId: { $in: questionIds } });

    const reportedCount = reports.filter(r => r.status === 'pending').length;
    const fixedCount = reports.filter(r => r.status === 'fixed').length;
    const deletedCount = reports.filter(r => r.status === 'deleted').length;

    res.json({
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        totalQuestions: questions.length,
      },
      stats: {
        totalParticipants,
        totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        reportedQuestions: reportedCount,
        fixedQuestions: fixedCount,
        deletedQuestions: deletedCount,
      },
    });
  } catch (error) {
    console.error('Error getting quiz analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};

export const getParticipantGrowth = async (req, res) => {
  try {
    const quizId = req.params.quizId;

    const results = await Result.find({ quizId }).sort({ attemptedAt: 1 });

    // Group by date
    const growthData = {};
    const uniqueParticipants = new Set();

    results.forEach(result => {
      const date = result.attemptedAt.toISOString().split('T')[0];
      if (!growthData[date]) {
        growthData[date] = { date, participants: 0 };
      }
      const userIdStr = result.userId.toString();
      if (!uniqueParticipants.has(userIdStr)) {
        uniqueParticipants.add(userIdStr);
        growthData[date].participants += 1;
      }
    });

    // Convert to array and calculate cumulative
    let cumulative = 0;
    const chartData = Object.values(growthData).map(item => {
      cumulative += item.participants;
      return {
        date: item.date,
        participants: cumulative,
      };
    });

    res.json(chartData);
  } catch (error) {
    console.error('Error getting participant growth:', error);
    res.status(500).json({ message: 'Error fetching participant growth' });
  }
};

export const getAttemptsOverTime = async (req, res) => {
  try {
    const quizId = req.params.quizId;

    const results = await Result.find({ quizId }).sort({ attemptedAt: 1 });

    // Group by date
    const attemptsData = {};

    results.forEach(result => {
      const date = result.attemptedAt.toISOString().split('T')[0];
      if (!attemptsData[date]) {
        attemptsData[date] = { date, attempts: 0 };
      }
      attemptsData[date].attempts += 1;
    });

    const chartData = Object.values(attemptsData);

    res.json(chartData);
  } catch (error) {
    console.error('Error getting attempts over time:', error);
    res.status(500).json({ message: 'Error fetching attempts data' });
  }
};

export const getScoreTrends = async (req, res) => {
  try {
    const quizId = req.params.quizId;

    const results = await Result.find({ quizId }).sort({ attemptedAt: 1 });

    // Group by date and calculate average score
    const scoreData = {};

    results.forEach(result => {
      const date = result.attemptedAt.toISOString().split('T')[0];
      if (!scoreData[date]) {
        scoreData[date] = { date, totalScore: 0, count: 0 };
      }
      scoreData[date].totalScore += (result.score / result.total) * 100;
      scoreData[date].count += 1;
    });

    // Calculate averages
    const chartData = Object.values(scoreData).map(item => ({
      date: item.date,
      averageScore: Math.round((item.totalScore / item.count) * 100) / 100,
    }));

    res.json(chartData);
  } catch (error) {
    console.error('Error getting score trends:', error);
    res.status(500).json({ message: 'Error fetching score trends' });
  }
};

export const getCompletionTimeAnalytics = async (req, res) => {
  try {
    const quizId = req.params.quizId;

    // Verify quiz exists and user has permission
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all results for this quiz with timeTaken
    const results = await Result.find({ quizId, timeTaken: { $exists: true, $gt: 0 } })
      .select('timeTaken')
      .sort({ timeTaken: 1 });

    if (results.length === 0) {
      return res.json({
        histogram: [],
        stats: {
          averageTime: 0,
          medianTime: 0,
          minTime: 0,
          maxTime: 0,
          totalAttempts: 0,
        },
      });
    }

    // Calculate statistics
    const times = results.map(r => r.timeTaken);
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = Math.round(totalTime / times.length);
    const sortedTimes = [...times].sort((a, b) => a - b);
    const medianTime = sortedTimes.length % 2 === 0
      ? Math.round((sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2)
      : sortedTimes[Math.floor(sortedTimes.length / 2)];
    const minTime = sortedTimes[0];
    const maxTime = sortedTimes[sortedTimes.length - 1];

    // Create histogram bins
    // Determine bin size based on data range
    const range = maxTime - minTime;
    let binSize;
    if (range <= 60) {
      binSize = 10; // 10 second bins for short quizzes
    } else if (range <= 300) {
      binSize = 30; // 30 second bins
    } else if (range <= 600) {
      binSize = 60; // 1 minute bins
    } else {
      binSize = 120; // 2 minute bins for long quizzes
    }

    // Create bins
    const bins = {};
    const numBins = Math.ceil(range / binSize) || 1;
    
    for (let i = 0; i <= numBins; i++) {
      const binStart = minTime + (i * binSize);
      const binEnd = binStart + binSize;
      bins[`${binStart}-${binEnd}`] = 0;
    }

    // Distribute times into bins
    times.forEach(time => {
      const binIndex = Math.floor((time - minTime) / binSize);
      const binStart = minTime + (binIndex * binSize);
      const binEnd = binStart + binSize;
      const binKey = `${binStart}-${binEnd}`;
      if (bins[binKey] !== undefined) {
        bins[binKey]++;
      } else {
        // Handle edge case for max time
        const lastBinKey = Object.keys(bins)[Object.keys(bins).length - 1];
        bins[lastBinKey]++;
      }
    });

    // Convert bins to array format for chart
    const histogram = Object.entries(bins).map(([range, count]) => {
      const [start, end] = range.split('-').map(Number);
      // Format time range label
      const formatSeconds = (sec) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        if (mins > 0) {
          return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
      };
      
      return {
        range: `${formatSeconds(start)} - ${formatSeconds(end)}`,
        count,
        min: start,
        max: end,
      };
    }).filter(item => item.count > 0); // Remove empty bins

    res.json({
      histogram,
      stats: {
        averageTime,
        medianTime,
        minTime,
        maxTime,
        totalAttempts: results.length,
      },
    });
  } catch (error) {
    console.error('Error getting completion time analytics:', error);
    res.status(500).json({ message: 'Error fetching completion time analytics' });
  }
};

