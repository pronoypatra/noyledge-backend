import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  participantsCount: {
    type: Number,
    default: 0,
  },
  attemptsCount: {
    type: Number,
    default: 0,
  },
  averageScore: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Index for efficient queries
analyticsSchema.index({ quizId: 1, date: -1 });

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;

