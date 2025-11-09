import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "ignored", "fixed", "deleted"],
    default: "pending",
  },
  resolvedAt: Date,
  expiresAt: {
    type: Date,
    // Auto-expire after 10 days
    default: function() {
      return new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    },
  },
}, { timestamps: true });

// Index for efficient queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ expiresAt: 1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;

