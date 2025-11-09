import mongoose from 'mongoose';

const bannedKeywordSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

const BannedKeyword = mongoose.model("BannedKeyword", bannedKeywordSchema);

export default BannedKeyword;

