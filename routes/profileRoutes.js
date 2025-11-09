import express from "express";
import {
  getProfile,
  updateProfile,
  getUserQuizzes,
  getUserBadges,
  followCategory,
  followUser,
  getFollowers,
  getFollowing,
  removeFollower,
  discoverUsers,
} from "../controllers/profileController.js";
import protect from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../middleware/uploadMiddleware.js";

const router = express.Router();

import jwt from "jsonwebtoken";

// Optional auth for viewing profiles (public profiles)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid, continue without user
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

// User discovery route (must come before :userId routes)
router.get("/discover", protect, discoverUsers);

router.get("/:userId", optionalAuth, getProfile);
router.put("/:userId", protect, uploadAvatar, updateProfile);
router.get("/:userId/quizzes", protect, getUserQuizzes);
router.get("/:userId/badges", protect, getUserBadges);
router.post("/:userId/follow-category", protect, followCategory);

// Follow/Unfollow user routes
router.post("/:userId/follow", protect, followUser);
router.get("/:userId/followers", protect, getFollowers);
router.get("/:userId/following", protect, getFollowing);
router.delete("/:userId/followers/:followerId", protect, removeFollower);

export default router;

