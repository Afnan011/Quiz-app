import express from 'express';
import { body, validationResult } from 'express-validator';
import verifyToken from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';
import multer from 'multer';
import xlsx from 'xlsx';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken, roleGuard('teacher'));

// GET /api/classes — all classes for teacher
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user.id }).populate('quizId', 'title isActive').lean();
    res.json(classes);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/classes — create class
router.post('/', [body('name').notEmpty().trim()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    // Create class with an associated quiz placeholder
    const cls = new Class({ name: req.body.name, teacherId: req.user.id });
    const quiz = new Quiz({ classId: cls._id, title: `${req.body.name} Quiz` });
    await quiz.save();
    cls.quizId = quiz._id;
    await cls.save();
    res.status(201).json(cls);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/classes/:classId — class detail
router.get('/:classId', async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.classId, teacherId: req.user.id })
      .populate('quizId')
      .populate('students', 'name email registrationNumber isFirstLogin');
    if (!cls) return res.status(404).json({ message: 'Class not found.' });
    res.json(cls);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/classes/:classId — edit class
router.put('/:classId', async (req, res) => {
  try {
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.classId, teacherId: req.user.id },
      { name: req.body.name },
      { new: true }
    );
    if (!cls) return res.status(404).json({ message: 'Class not found.' });
    res.json(cls);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// DELETE /api/classes/:classId
router.delete('/:classId', async (req, res) => {
  try {
    const cls = await Class.findOneAndDelete({ _id: req.params.classId, teacherId: req.user.id });
    if (!cls) return res.status(404).json({ message: 'Class not found.' });
    res.json({ message: 'Class deleted.' });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/classes/:classId/students — student list with attempt status
router.get('/:classId/students', async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.classId, teacherId: req.user.id })
      .populate('students', 'name email registrationNumber isFirstLogin');
    if (!cls) return res.status(404).json({ message: 'Class not found.' });

    const attempts = cls.quizId
      ? await Attempt.find({ classId: cls._id, quizId: cls.quizId }).sort({ createdAt: 1 }).lean()
      : [];

    // Priority: submitted/force_submitted beats in_progress beats anything else
    const STATUS_PRIORITY = { submitted: 2, force_submitted: 2, in_progress: 1 };
    const attemptMap = {};
    attempts.forEach(a => {
      const existing = attemptMap[a.studentId.toString()];
      const newPriority = STATUS_PRIORITY[a.status] || 0;
      const existingPriority = existing ? (STATUS_PRIORITY[existing.status] || 0) : -1;
      if (newPriority >= existingPriority) attemptMap[a.studentId.toString()] = a;
    });

    const students = cls.students.map(s => ({
      ...s.toObject(),
      attempt: attemptMap[s._id.toString()] || null,
    }));

    res.json(students);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/classes/:classId/students — add single student
router.post('/:classId/students', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('registrationNumber').notEmpty().trim(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const cls = await Class.findOne({ _id: req.params.classId, teacherId: req.user.id });
    if (!cls) return res.status(404).json({ message: 'Class not found.' });

    const existing = await User.findOne({
      $or: [{ email: req.body.email }, { registrationNumber: req.body.registrationNumber }],
    });
    if (existing) return res.status(409).json({ message: 'Student with this email or registration number already exists.' });

    const student = new User({
      name: req.body.name,
      email: req.body.email,
      registrationNumber: req.body.registrationNumber,
      passwordHash: req.body.password,
      role: 'student',
      classId: cls._id,
      isFirstLogin: true,
    });
    await student.save();
    cls.students.push(student._id);
    await cls.save();

    res.status(201).json({ message: 'Student added.', student: { id: student._id, name: student.name, email: student.email } });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/classes/:classId/students/:studentId — edit student
router.put('/:classId/students/:studentId', async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.classId, teacherId: req.user.id });
    if (!cls) return res.status(404).json({ message: 'Class not found.' });
    const update = {};
    if (req.body.name) update.name = req.body.name;
    if (req.body.email) update.email = req.body.email;
    const student = await User.findByIdAndUpdate(req.params.studentId, update, { new: true }).select('-passwordHash');
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(student);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// DELETE /api/classes/:classId/students/:studentId
router.delete('/:classId/students/:studentId', async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.classId, teacherId: req.user.id });
    if (!cls) return res.status(404).json({ message: 'Class not found.' });
    cls.students = cls.students.filter(s => s.toString() !== req.params.studentId);
    await cls.save();
    await User.findByIdAndDelete(req.params.studentId);
    res.json({ message: 'Student removed.' });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/classes/:classId/students/import — bulk Excel import
router.post('/:classId/students/import', upload.single('file'), async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.classId, teacherId: req.user.id });
    if (!cls) return res.status(404).json({ message: 'Class not found.' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);  // [{Registration Number, Full Name, Email, Initial Password}]

    const results = { created: 0, skipped: 0, skippedEntries: [] };
    for (const row of rows) {
      const regNo = String(row['Registration Number'] || '').trim();
      const email = String(row['Email'] || '').trim().toLowerCase();
      if (!regNo || !email) { results.skipped++; results.skippedEntries.push(row); continue; }

      const existing = await User.findOne({ $or: [{ email }, { registrationNumber: regNo }] });
      if (existing) { results.skipped++; results.skippedEntries.push({ regNo, reason: 'duplicate' }); continue; }

      const student = new User({
        name: String(row['Full Name'] || '').trim(),
        email,
        registrationNumber: regNo,
        passwordHash: String(row['Initial Password'] || 'Password@123'),
        role: 'student',
        classId: cls._id,
        isFirstLogin: true,
      });
      await student.save();
      cls.students.push(student._id);
      results.created++;
    }
    await cls.save();
    res.json({ message: `Import complete.`, ...results });
  } catch (err) {
    res.status(500).json({ message: 'Import failed.', error: err.message });
  }
});

// GET /api/classes/:classId/students/export — export to Excel
router.get('/:classId/students/export', async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.classId, teacherId: req.user.id })
      .populate('students', 'name email registrationNumber');
    if (!cls) return res.status(404).json({ message: 'Class not found.' });

    const attempts = cls.quizId
      ? await Attempt.find({ classId: cls._id, quizId: cls.quizId }).sort({ createdAt: 1 }).lean()
      : [];
    // Priority: submitted/force_submitted beats in_progress beats anything else
    const STATUS_PRIORITY = { submitted: 2, force_submitted: 2, in_progress: 1 };
    const attemptMap = {};
    attempts.forEach(a => {
      const existing = attemptMap[a.studentId.toString()];
      const newPriority = STATUS_PRIORITY[a.status] || 0;
      const existingPriority = existing ? (STATUS_PRIORITY[existing.status] || 0) : -1;
      if (newPriority >= existingPriority) attemptMap[a.studentId.toString()] = a;
    });

    const rows = cls.students.map(s => {
      const attempt = attemptMap[s._id.toString()];
      return {
        'Registration Number': s.registrationNumber,
        'Name': s.name,
        'Email': s.email,
        'Status': attempt?.status || 'not_started',
        'Score': attempt?.score ?? '',
        'Total Marks': attempt?.totalMarks ?? '',
        'Percentage': attempt?.percentage ? `${attempt.percentage}%` : '',
      };
    });

    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Students');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="students-${cls.name}.xlsx"`);
    res.send(buffer);
  } catch { res.status(500).json({ message: 'Export failed.' }); }
});

// POST /api/classes/:classId/students/:studentId/reset-attempt
router.post('/:classId/students/:studentId/reset-attempt', async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.classId, teacherId: req.user.id });
    if (!cls) return res.status(404).json({ message: 'Class not found.' });

    // Hard delete all existing attempts for this student/quiz to ensure a completely clean slate
    await Attempt.deleteMany({
      studentId: req.params.studentId,
      classId: cls._id,
    });

    res.json({ message: 'Attempt reset successfully.' });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

export default router;
