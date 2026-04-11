import express from 'express';
import verifyToken from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';
import ViolationLog from '../models/ViolationLog.js';
import Class from '../models/Class.js';

const router = express.Router();

router.use(verifyToken, roleGuard('student'));

// Helper: shuffle array
const shuffleArray = (arr) => arr.sort(() => Math.random() - 0.5);

// GET /api/student/quiz — get quiz info for student's class
router.get('/quiz', async (req, res) => {
  try {
    const cls = await Class.findById(req.user.classId).populate('quizId');
    if (!cls || !cls.quizId) return res.status(404).json({ message: 'No quiz assigned to your class.' });
    if (!cls.quizId.isActive) return res.status(403).json({ message: 'Quiz is not active yet.' });

    // Always get the most authoritative status across all attempts
    const allAttempts = await Attempt.find({ studentId: req.user.id, quizId: cls.quizId._id });
    let attemptStatus = 'not_started';
    if (allAttempts.some(a => ['submitted', 'force_submitted'].includes(a.status))) {
      attemptStatus = 'submitted';
    } else if (allAttempts.some(a => a.status === 'in_progress')) {
      attemptStatus = 'in_progress';
    }

    const quiz = cls.quizId.toObject();
    const questionsCount = quiz.questions?.length || 0;
    delete quiz.questions; // Don't send question IDs

    res.json({ quiz, questionsCount, attemptStatus });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/student/quiz/start
router.post('/quiz/start', async (req, res) => {
  try {
    const cls = await Class.findById(req.user.classId);
    if (!cls || !cls.quizId) return res.status(404).json({ message: 'No quiz for your class.' });

    const quiz = await Quiz.findById(cls.quizId).populate('questions');
    if (!quiz || !quiz.isActive) return res.status(403).json({ message: 'Quiz is not active.' });

    // Check ALL attempts — block if ANY is submitted/force_submitted
    const allAttempts = await Attempt.find({ studentId: req.user.id, quizId: quiz._id }).sort({ createdAt: -1 });
    const submittedAttempt = allAttempts.find(a => ['submitted', 'force_submitted'].includes(a.status));
    if (submittedAttempt) {
      return res.status(409).json({ message: 'You have already submitted this exam.' });
    }

    const inProgressAttempt = allAttempts.find(a => a.status === 'in_progress');
    if (inProgressAttempt) {
      // Resume existing attempt
      let questions = await Question.find({ quizId: quiz._id }).select('-correctOptions').sort('order').lean();
      return res.json({ attempt: inProgressAttempt, questions, quiz: { title: quiz.title, settings: quiz.settings } });
    }

    // No active attempt — create fresh one
    const attempt = new Attempt({
      studentId: req.user.id,
      quizId: quiz._id,
      classId: cls._id,
      status: 'in_progress',
      startedAt: new Date(),
    });
    await attempt.save();

    let questions = await Question.find({ quizId: quiz._id }).select('-correctOptions').sort('order').lean();
    if (quiz.settings.shuffleQuestions) shuffleArray(questions);
    if (quiz.settings.shuffleOptions) {
      questions = questions.map(q => ({ ...q, options: shuffleArray([...q.options]) }));
    }

    res.json({ attempt, questions, quiz: { title: quiz.title, settings: quiz.settings } });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/student/quiz/submit
router.post('/quiz/submit', async (req, res) => {
  try {
    const { answers, force } = req.body; // answers: [{questionId, selectedOptions:[]}]
    const cls = await Class.findById(req.user.classId);
    if (!cls || !cls.quizId) return res.status(404).json({ message: 'No quiz.' });

    const attempt = await Attempt.findOne({
      studentId: req.user.id,
      quizId: cls.quizId,
      status: 'in_progress',
    });
    if (!attempt) return res.status(404).json({ message: 'No active attempt found.' });

    const questions = await Question.find({ quizId: cls.quizId }).lean();
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    let score = 0;
    let totalMarks = 0;
    const gradedAnswers = [];

    for (const q of questions) {
      totalMarks += q.marks;
      const answer = answers?.find(a => a.questionId === q._id.toString());
      const selected = answer?.selectedOptions || [];
      const correct = q.correctOptions;

      let isCorrect = false;
      if (q.type === 'single') {
        isCorrect = selected.length === 1 && selected[0] === correct[0];
      } else {
        // Multiple: all correct selected and no wrong ones
        isCorrect = correct.length === selected.length &&
          correct.every(c => selected.includes(c));
      }

      const marksAwarded = isCorrect ? q.marks : 0;
      score += marksAwarded;
      gradedAnswers.push({ questionId: q._id, selectedOptions: selected, isCorrect, marksAwarded });
    }

    attempt.answers = gradedAnswers;
    attempt.score = score;
    attempt.totalMarks = totalMarks;
    attempt.percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    attempt.status = force ? 'force_submitted' : 'submitted';
    attempt.submittedAt = new Date();
    await attempt.save();

    res.json({ message: 'Exam submitted.', score, totalMarks, percentage: attempt.percentage });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/student/quiz/violation
router.post('/quiz/violation', async (req, res) => {
  try {
    const { type } = req.body;
    const cls = await Class.findById(req.user.classId);
    if (!cls || !cls.quizId) return res.status(404).json({ message: 'No quiz.' });

    const attempt = await Attempt.findOne({ studentId: req.user.id, quizId: cls.quizId, status: 'in_progress' });
    if (!attempt) return res.status(404).json({ message: 'No active attempt.' });

    const quiz = await Quiz.findById(cls.quizId);
    attempt.violationCount += 1;
    await attempt.save();

    await ViolationLog.create({ attemptId: attempt._id, studentId: req.user.id, type, count: attempt.violationCount });

    const remaining = quiz.settings.maxViolations - attempt.violationCount;
    const autoSubmit = attempt.violationCount >= quiz.settings.maxViolations;

    res.json({
      violationCount: attempt.violationCount,
      remaining: Math.max(0, remaining),
      autoSubmit,
    });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/student/result
router.get('/result', async (req, res) => {
  try {
    const cls = await Class.findById(req.user.classId);
    if (!cls || !cls.quizId) return res.status(404).json({ message: 'No quiz.' });

    const attempt = await Attempt.findOne({
      studentId: req.user.id,
      quizId: cls.quizId,
      status: { $in: ['submitted', 'force_submitted'] },
    }).sort({ createdAt: -1 }).lean();
    if (!attempt) return res.status(404).json({ message: 'No completed attempt found.' });

    // Get all questions with correct answers for review
    const questions = await Question.find({ quizId: cls.quizId }).sort('order').lean();
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    const review = attempt.answers.map(a => ({
      question: questionMap[a.questionId.toString()],
      selectedOptions: a.selectedOptions,
      isCorrect: a.isCorrect,
      marksAwarded: a.marksAwarded,
    }));

    res.json({ attempt: { score: attempt.score, totalMarks: attempt.totalMarks, percentage: attempt.percentage, status: attempt.status }, review });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/student/class - get student's class info
router.get('/class', async (req, res) => {
  try {
    const cls = await Class.findById(req.user.classId).select('name');
    if (!cls) return res.status(404).json({ message: 'No class assigned.' });
    res.json(cls);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

export default router;
