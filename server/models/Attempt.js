import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted', 'force_submitted'],
    default: 'not_started',
  },
  startedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: null },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      selectedOptions: [{ type: String }],
      isCorrect: { type: Boolean, default: false },
      marksAwarded: { type: Number, default: 0 },
    },
  ],
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  violationCount: { type: Number, default: 0 },
  resetBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resetAt: { type: Date, default: null },
});

export default mongoose.model('Attempt', attemptSchema);
