import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  settings: {
    timeLimitPerQuestion: { type: Number, default: 0 }, // seconds, 0 = no limit
    totalTimeLimit: { type: Number, default: 0 }, // minutes, 0 = no limit
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    allowMultipleSelect: { type: Boolean, default: false },
    maxViolations: { type: Number, default: 3, min: 1, max: 10 },
  },
  isActive: { type: Boolean, default: false },
  resultsPublished: { type: Boolean, default: false },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Quiz', quizSchema);
