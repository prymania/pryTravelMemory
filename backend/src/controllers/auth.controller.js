const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const { success } = require('../utils/response');
const { AppError } = require('../middleware/error');

function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  get secure() { return process.env.NODE_ENV === 'production'; },
};

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password required');

    const user = await userModel.findByEmail(email);
    if (!user) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const { accessToken, refreshToken } = generateTokens(user.id);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);

    success(res, {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url },
    });
  } catch (e) { next(e); }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError('No refresh token', 401);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const { accessToken, refreshToken } = generateTokens(decoded.userId);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);

    success(res, { accessToken });
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return next(new AppError('Invalid refresh token', 401));
    }
    next(e);
  }
}

async function logout(req, res) {
  res.clearCookie('refreshToken');
  success(res, null, 'Logged out');
}

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    success(res, user);
  } catch (e) { next(e); }
}

async function updateMe(req, res, next) {
  try {
    const user = await userModel.updateProfile(req.user.id, req.body);
    success(res, user);
  } catch (e) { next(e); }
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) throw new AppError('Both passwords required', 400);
    if (new_password.length < 8) throw new AppError('Password must be at least 8 characters', 400);

    const user = await userModel.findByEmail(req.user.email);
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) throw new AppError('Current password is incorrect', 401);

    const hash = await bcrypt.hash(new_password, 12);
    await require('../config/database').pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hash, req.user.id]
    );
    success(res, null, 'Password updated');
  } catch (e) { next(e); }
}

module.exports = { login, refresh, logout, me, updateMe, changePassword };
