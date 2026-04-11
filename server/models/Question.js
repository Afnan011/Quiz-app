import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  text: { type: String, required: true, trim: true },
  type: { type: String, enum: ['single', 'multiple'], default: 'single' },
  options: [
    {
      label: { type: String, required: true }, // A, B, C, D
      text: { type: String, required: true, trim: true },
    },
  ],
  correctOptions: [{ type: String }], // ['A'], ['A', 'C']
  marks: { type: Number, default: 1, min: 0 },
  order: { type: Number, default: 0 },
});

export default mongoose.model('Question', questionSchema);
