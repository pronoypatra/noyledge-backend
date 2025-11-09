import Badge from '../models/Badge.js';
import User from '../models/User.js';
import Result from '../models/Result.js';

/**
 * Check and award badges based on quiz completion
 */
export const checkAndAwardBadges = async (userId, quizId, score, total, timeTaken) => {
  try {
    const user = await User.findById(userId).populate('badges');
    if (!user) return [];

    const awardedBadges = [];

    // Get all badges
    const badges = await Badge.find({});
    
    // Get user's quiz history
    const userResults = await Result.find({ userId });
    const quizResults = userResults.filter(r => r.quizId.toString() === quizId.toString());
    const allResults = userResults;

    for (const badge of badges) {
      // Skip if user already has this badge
      if (user.badges.some(b => b._id.toString() === badge._id.toString())) {
        continue;
      }

      let shouldAward = false;

      switch (badge.criteria.type) {
        case 'first_quiz':
          // First quiz attempt
          if (allResults.length === 1) {
            shouldAward = true;
          }
          break;

        case 'perfect_score':
          // Perfect score (100%)
          if (score === total && total > 0) {
            shouldAward = true;
          }
          break;

        case 'quiz_master':
          // Completed 10+ quizzes
          const uniqueQuizzes = new Set(allResults.map(r => r.quizId.toString()));
          if (uniqueQuizzes.size >= (badge.criteria.value || 10)) {
            shouldAward = true;
          }
          break;

        case 'speed_demon':
          // Complete quiz in under 5 minutes (300 seconds)
          const maxTime = badge.criteria.value || 300;
          if (timeTaken > 0 && timeTaken <= maxTime) {
            shouldAward = true;
          }
          break;

        case 'category_expert':
          // Perfect score in specific category (would need quiz category info)
          // This is a placeholder - would need quiz category relationship
          break;

        case 'streak_master':
          // 7 days consecutive quiz attempts
          const streakDays = badge.criteria.value || 7;
          if (user.quizStreak >= streakDays) {
            shouldAward = true;
          }
          break;

        default:
          break;
      }

      if (shouldAward) {
        user.badges.push(badge._id);
        awardedBadges.push(badge);
      }
    }

    if (awardedBadges.length > 0) {
      await user.save();
    }

    return awardedBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
};

/**
 * Update quiz streak
 */
export const updateQuizStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!user.lastQuizDate) {
      // First quiz
      user.lastQuizDate = today;
      user.quizStreak = 1;
    } else {
      const lastDate = new Date(user.lastQuizDate);
      lastDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day, no change
        return;
      } else if (daysDiff === 1) {
        // Consecutive day
        user.quizStreak += 1;
        user.lastQuizDate = today;
      } else {
        // Streak broken
        user.quizStreak = 1;
        user.lastQuizDate = today;
      }
    }

    await user.save();
  } catch (error) {
    console.error('Error updating quiz streak:', error);
  }
};

/**
 * Initialize default badges
 */
export const initializeDefaultBadges = async () => {
  try {
    const defaultBadges = [
      {
        name: 'First Quiz',
        description: 'Complete your first quiz',
        icon: '🎯',
        criteria: { type: 'first_quiz', value: null },
      },
      {
        name: 'Perfect Score',
        description: 'Get 100% on any quiz',
        icon: '💯',
        criteria: { type: 'perfect_score', value: null },
      },
      {
        name: 'Quiz Master',
        description: 'Complete 10 quizzes',
        icon: '🏆',
        criteria: { type: 'quiz_master', value: 10 },
      },
      {
        name: 'Speed Demon',
        description: 'Complete a quiz in under 5 minutes',
        icon: '⚡',
        criteria: { type: 'speed_demon', value: 300 },
      },
      {
        name: 'Streak Master',
        description: 'Complete quizzes for 7 consecutive days',
        icon: '🔥',
        criteria: { type: 'streak_master', value: 7 },
      },
    ];

    for (const badgeData of defaultBadges) {
      await Badge.findOneAndUpdate(
        { name: badgeData.name },
        badgeData,
        { upsert: true, new: true }
      );
    }

    console.log('Default badges initialized');
  } catch (error) {
    console.error('Error initializing badges:', error);
  }
};

