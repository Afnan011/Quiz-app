import express from 'express';
import verifyToken from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';
import ViolationLog from '../models/ViolationLog.js';
import multer from 'multer';
import xlsx from 'xlsx';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All teacher routes require auth + teacher role
router.use(verifyToken, roleGuard('teacher'));

// GET /api/teacher/dashboard - classes with stats
router.get('/dashboard', async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user.id })
      .populate('quizId', 'title isActive')
      .lean();
    
    const result = await Promise.all(classes.map(async (cls) => {
      const studentCount = cls.students.length;
      const attempts = cls.quizId
        ? await Attempt.find({ classId: cls._id, quizId: cls.quizId._id }).lean()
        : [];
      
      return {
        ...cls,
        studentCount,
        completedCount: attempts.filter(a => ['submitted', 'force_submitted'].includes(a.status)).length,
      };
    }));

    res.json(result);
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
