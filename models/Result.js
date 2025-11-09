import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: String,
  score: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  attemptedAt: {
    type: Date,
    default: Date.now,
  },
  // Time taken to complete quiz (in seconds)
  timeTaken: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const Result = mongoose.model('Result', resultSchema);
export default Result;

// import mongoose from 'mongoose';

// const resultSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   quiz: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Quiz",
//     required: true,
//   },
//   score: {
//     type: Number,
//     required: true,
//   },
//   total: {
//     type: Number,
//     required: true,
//   },
//   submittedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// const Result = mongoose.model('Result', resultSchema);
// export default Result;
