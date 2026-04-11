import express from 'express';
import verifyToken from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import Question from '../models/Question.js';
import Quiz from '../models/Quiz.js';

const router = express.Router({ mergeParams: true });

router.use(verifyToken, roleGuard('teacher'));

// GET /api/quiz/:quizId/questions
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find({ quizId: req.params.quizId }).sort('order').lean();
    res.json(questions);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/quiz/:quizId/questions — add single question
router.post('/', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });

    const count = await Question.countDocuments({ quizId: quiz._id });
    const question = new Question({
      quizId: quiz._id,
      text: req.body.text,
      type: req.body.type || 'single',
      options: req.body.options,
      correctOptions: req.body.correctOptions,
      marks: req.body.marks || 1,
      order: count,
    });
    await question.save();
    quiz.questions.push(question._id);
    await quiz.save();
    res.status(201).json(question);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/quiz/:quizId/questions/:questionId — edit question
router.put('/:questionId', async (req, res) => {
  try {
    const question = await Question.findOneAndUpdate(
      { _id: req.params.questionId, quizId: req.params.quizId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!question) return res.status(404).json({ message: 'Question not found.' });
    res.json(question);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// DELETE /api/quiz/:quizId/questions/:questionId
router.delete('/:questionId', async (req, res) => {
  try {
    const question = await Question.findOneAndDelete({ _id: req.params.questionId, quizId: req.params.quizId });
    if (!question) return res.status(404).json({ message: 'Question not found.' });

    await Quiz.findByIdAndUpdate(req.params.quizId, { $pull: { questions: question._id } });
    res.json({ message: 'Question deleted.' });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/quiz/:quizId/questions/bulk — bulk upload JSON
router.post('/bulk', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });

    const items = req.body; // array of question objects
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Expected an array of questions.' });
    }

    let count = await Question.countDocuments({ quizId: quiz._id });
    const created = [];
    for (const item of items) {
      const q = new Question({
        quizId: quiz._id,
        text: item.text,
        type: item.type || 'single',
        options: item.options,
        correctOptions: item.correctOptions,
        marks: item.marks || 1,
        order: count++,
      });
      await q.save();
      quiz.questions.push(q._id);
      created.push(q._id);
    }
    await quiz.save();
    res.status(201).json({ message: `${created.length} questions added.`, ids: created });
  } catch (err) { res.status(500).json({ message: 'Bulk upload failed.', error: err.message }); }
});

export default router;
