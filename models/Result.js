import mongoose from 'mongoose';


const resultSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  username: String,
  score: Number,
  total: Number,
  attemptedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Result', resultSchema);

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

// module.exports = mongoose.model("Result", resultSchema);
