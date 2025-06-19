import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  options: [
    {
      optionText: { type: String },
      isCorrect: { type: Boolean, default: false },
    },
  ],
});

module.exports = mongoose.model("Question", questionSchema);
