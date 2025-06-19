import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: String,
  options: [String],
  correctOption: Number,
});

const quizSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the 'User' model
    required: true, // Ensure the creator is always present
  },
  questions: [questionSchema],
});

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;

// import mongoose from 'mongoose';


// const quizSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//     },
//     description: String,
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// const Quiz = mongoose.model('Quiz', quizSchema);
// export default Quiz;