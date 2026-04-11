import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = express.Router();

const issueTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role, name: user.name, classId: user.classId, registrationNumber: user.registrationNumber },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

const setCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password, registrationNumber } = req.body;
      const user = await User.findOne({ email });

      if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

      const match = await user.comparePassword(password);
      if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

      // Student needs registrationNumber to match
      if (user.role === 'student' && registrationNumber && user.registrationNumber !== registrationNumber) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const { accessToken, refreshToken } = issueTokens(user);
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      setCookies(res, accessToken, refreshToken);

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isFirstLogin: user.isFirstLogin,
          registrationNumber: user.registrationNumber,
        },
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// POST /api/auth/change-password
router.post(
  '/change-password',
  [body('newPassword').isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const token = req.cookies?.accessToken;
      if (!token) return res.status(401).json({ message: 'Not authenticated.' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'User not found.' });

      user.passwordHash = req.body.newPassword; // Will be hashed by pre-save hook
      user.isFirstLogin = false;
      await user.save();

      res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token.' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const { accessToken, refreshToken } = issueTokens(user);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    setCookies(res, accessToken, refreshToken);

    res.json({ message: 'Token refreshed.' });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET).catch(() => null);
      if (decoded) {
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      }
    }
  } catch (_) {}
  
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('accessToken', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'strict' });
  res.clearCookie('refreshToken', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'strict' });
  res.json({ message: 'Logged out.' });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ message: 'Not authenticated.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch {
    res.status(401).json({ message: 'Invalid token.' });
  }
});

export default router;
