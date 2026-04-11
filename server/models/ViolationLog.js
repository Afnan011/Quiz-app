import mongoose from 'mongoose';

const violationLogSchema = new mongoose.Schema({
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['tab_switch', 'fullscreen_exit', 'right_click', 'copy_attempt', 'keyboard_shortcut'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  count: { type: Number, default: 1 },
});

export default mongoose.model('ViolationLog', violationLogSchema);
