import express from 'express';
import verifyToken from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import Quiz from '../models/Quiz.js';
import Class from '../models/Class.js';

const router = express.Router();

router.use(verifyToken, roleGuard('teacher'));

// GET /api/quiz/:quizId/settings
router.get('/:quizId/settings', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    res.json(quiz);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/quiz/:quizId/settings
router.put('/:quizId/settings', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });

    if (req.body.title !== undefined) quiz.title = req.body.title;
    if (req.body.description !== undefined) quiz.description = req.body.description;
    if (req.body.settings) {
      Object.assign(quiz.settings, req.body.settings);
      quiz.markModified('settings');
    }
    await quiz.save();
    res.json(quiz);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/quiz/:quizId/toggle — activate/deactivate
router.put('/:quizId/toggle', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    quiz.isActive = !quiz.isActive;
    await quiz.save();
    res.json({ isActive: quiz.isActive, message: quiz.isActive ? 'Quiz activated.' : 'Quiz deactivated.' });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/quiz/:quizId/publish-results — publish/unpublish results for students
router.put('/:quizId/publish-results', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    quiz.resultsPublished = !quiz.resultsPublished;
    await quiz.save();
    res.json({ resultsPublished: quiz.resultsPublished });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

export default router;
