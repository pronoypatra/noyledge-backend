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
  // Store original text before banned keyword filtering
  originalText: {
    type: String,
  },
  // Track if question has been reported
  reportCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });


const Question = mongoose.model("Question", questionSchema);
export default Question;