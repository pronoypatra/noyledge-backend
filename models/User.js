import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      // Not required if using OAuth
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    badges: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
    }],
    followedCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    }],
    savedQuizzes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    }],
    savedQuestions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    }],
    // OAuth fields
    googleId: {
      type: String,
      sparse: true,
    },
    casId: {
      type: String,
      sparse: true,
    },
    oauthProvider: {
      type: String,
      enum: ["local", "google", "cas"],
      default: "local",
    },
    // Track quiz streak
    lastQuizDate: Date,
    quizStreak: {
      type: Number,
      default: 0,
    },
    // Followers and Following
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;