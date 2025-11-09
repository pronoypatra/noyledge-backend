import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: "🏆",
  },
  criteria: {
    type: {
      type: String,
      enum: ["first_quiz", "perfect_score", "quiz_master", "speed_demon", "category_expert", "streak_master"],
      required: true,
    },
    value: mongoose.Schema.Types.Mixed, // Can be number, string, etc.
  },
}, { timestamps: true });

const Badge = mongoose.model("Badge", badgeSchema);

export default Badge;

