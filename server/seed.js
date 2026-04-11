/**
 * Quick seed script — creates a teacher + a sample class with a linked quiz.
 * Run once: node seed.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Class from './models/Class.js';
import Quiz from './models/Quiz.js';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Create teacher
  const existing = await User.findOne({ email: 'teacher@school.com' });
  if (existing) {
    console.log('Teacher already exists. Email: teacher@school.com / Password: teacher123');
    await mongoose.disconnect();
    return;
  }

  const teacher = await User.create({
    name: 'Demo Teacher',
    email: 'teacher@school.com',
    passwordHash: 'teacher123',   // pre-save hook will hash this
    role: 'teacher',
    isFirstLogin: false,
  });

  // Create a class
  const cls = await Class.create({
    name: 'Sample Class',
    teacherId: teacher._id,
    students: [],
  });

  // Create a quiz linked to the class
  const quiz = await Quiz.create({
    title: 'Sample Quiz',
    classId: cls._id,
    settings: {
      totalTimeLimit: 30,
      timeLimitPerQuestion: 0,
      shuffleQuestions: false,
      shuffleOptions: false,
      maxViolations: 3,
    },
    isActive: false,
  });

  cls.quizId = quiz._id;
  await cls.save();

  console.log('\n✅ Seed complete!');
  console.log('----------------------------');
  console.log('Teacher login:');
  console.log('  Email:    teacher@school.com');
  console.log('  Password: teacher123');
  console.log('  Role:     Teacher (select "Teacher" on login page)');
  console.log('----------------------------');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
