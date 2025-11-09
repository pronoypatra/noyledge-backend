import User from '../models/User.js';
import Result from '../models/Result.js';
import Quiz from '../models/Quiz.js';
import Category from '../models/Category.js';
import Badge from '../models/Badge.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user?.userId;

    const user = await User.findById(userId)
      .select('-password')
      .populate('badges', 'name description icon')
      .populate('followedCategories', 'name description')
      .populate('savedQuizzes', 'title description imageUrl')
      .populate('savedQuestions', 'questionText quiz');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's quiz attempts and scores
    const results = await Result.find({ userId })
      .populate('quizId', 'title tags difficulty')
      .sort({ attemptedAt: -1 });

    // Calculate stats
    const totalQuizzes = results.length;
    const averageScore = totalQuizzes > 0
      ? results.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / totalQuizzes
      : 0;

    // Check if current user is following this user
    const isFollowing = currentUserId ? user.followers.some(
      id => id.toString() === currentUserId.toString()
    ) : false;

    res.json({
      user: {
        ...user.toObject(),
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing: !!isFollowing,
      },
      stats: {
        totalQuizzes,
        averageScore: Math.round(averageScore * 100) / 100,
        badgesCount: user.badges.length,
        followersCount: user.followers.length,
        followingCount: user.following.length,
      },
      recentQuizzes: results.slice(0, 10),
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, bio, avatar } = req.body;

    // Check if user is updating their own profile
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    
    // Handle avatar upload
    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    } else if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const getUserQuizzes = async (req, res) => {
  try {
    const userId = req.params.userId;

    const results = await Result.find({ userId })
      .populate('quizId', 'title description tags difficulty imageUrl')
      .sort({ attemptedAt: -1 });

    res.json(results);
  } catch (error) {
    console.error('Error getting user quizzes:', error);
    res.status(500).json({ message: 'Error fetching user quizzes' });
  }
};

export const getUserBadges = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId).populate('badges');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.badges);
  } catch (error) {
    console.error('Error getting user badges:', error);
    res.status(500).json({ message: 'Error fetching badges' });
  }
};

export const followCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { categoryId } = req.body;

    const user = await User.findById(userId);
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const isFollowing = user.followedCategories.includes(categoryId);

    if (isFollowing) {
      // Unfollow
      user.followedCategories = user.followedCategories.filter(
        id => id.toString() !== categoryId.toString()
      );
      category.followers = category.followers.filter(
        id => id.toString() !== userId.toString()
      );
    } else {
      // Follow
      user.followedCategories.push(categoryId);
      category.followers.push(userId);
    }

    await user.save();
    await category.save();

    res.json({
      message: isFollowing ? 'Unfollowed category' : 'Followed category',
      followed: !isFollowing,
    });
  } catch (error) {
    console.error('Error following category:', error);
    res.status(500).json({ message: 'Error following category' });
  }
};

// Follow/Unfollow a user
export const followUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following (convert both to strings for comparison)
    const isFollowing = currentUser.following.some(
      id => id.toString() === targetUserId.toString()
    );

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUserId.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUserId.toString()
      );
    } else {
      // Follow - check if not already following
      const alreadyFollowing = currentUser.following.some(
        id => id.toString() === targetUserId.toString()
      );
      const alreadyFollower = targetUser.followers.some(
        id => id.toString() === currentUserId.toString()
      );
      
      if (!alreadyFollowing) {
        currentUser.following.push(targetUserId);
      }
      if (!alreadyFollower) {
        targetUser.followers.push(currentUserId);
      }
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: isFollowing ? 'Unfollowed user' : 'Followed user',
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Error following user' });
  }
};

// Get followers list
export const getFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user?.userId;

    const user = await User.findById(userId).populate('followers', 'name email avatar');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user can remove followers (only own profile)
    const canRemove = currentUserId === userId;

    res.json({
      followers: user.followers,
      canRemove,
    });
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({ message: 'Error fetching followers' });
  }
};

// Get following list
export const getFollowing = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user?.userId;

    const user = await User.findById(userId).populate('following', 'name email avatar');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user can unfollow (only own profile)
    const canUnfollow = currentUserId === userId;

    res.json({
      following: user.following,
      canUnfollow,
    });
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({ message: 'Error fetching following' });
  }
};

// Remove a follower (remove someone from your followers list)
export const discoverUsers = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { search, sortBy = 'followers', limit = 20 } = req.query;

    // Build query
    const query = {};
    
    // Exclude current user
    query._id = { $ne: currentUserId };

    // Search by name or email if provided
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Build sort criteria
    let sortCriteria = {};
    switch (sortBy) {
      case 'followers':
        // Sort by followers count (descending)
        sortCriteria = { followers: -1 };
        break;
      case 'name':
        sortCriteria = { name: 1 };
        break;
      case 'recent':
        sortCriteria = { createdAt: -1 };
        break;
      default:
        sortCriteria = { followers: -1 };
    }

    // Get current user to check who they're following
    const currentUser = await User.findById(currentUserId).select('following');
    const followingIds = new Set(currentUser.following.map(id => id.toString()));

    // Fetch users
    const users = await User.find(query)
      .select('-password')
      .populate('badges', 'name icon')
      .sort(sortCriteria)
      .limit(parseInt(limit));

    // Format response with follow status
    const formattedUsers = users.map(user => {
      const isFollowing = followingIds.has(user._id.toString());
      const mutualFollowers = user.followers.filter(id => 
        currentUser.following.some(fid => fid.toString() === id.toString())
      ).length;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        badgesCount: user.badges.length,
        badges: user.badges.slice(0, 3), // Show first 3 badges
        isFollowing,
        mutualFollowers,
        createdAt: user.createdAt,
      };
    });

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error discovering users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const removeFollower = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const followerId = req.params.followerId;

    const currentUser = await User.findById(currentUserId);
    const follower = await User.findById(followerId);

    if (!follower) {
      return res.status(404).json({ message: 'Follower not found' });
    }

    // Remove from current user's followers
    currentUser.followers = currentUser.followers.filter(
      id => id.toString() !== followerId.toString()
    );

    // Remove from follower's following
    follower.following = follower.following.filter(
      id => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await follower.save();

    res.json({
      message: 'Follower removed successfully',
      followersCount: currentUser.followers.length,
    });
  } catch (error) {
    console.error('Error removing follower:', error);
    res.status(500).json({ message: 'Error removing follower' });
  }
};

