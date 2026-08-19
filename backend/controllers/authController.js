const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const {
  isAdminCredentialsConfigured,
  isAdminEmail,
  verifyAdminPassword,
  ensureAdminUser,
} = require('../utils/adminCredentials');

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role || 'user',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

/**
 * Cookie options for JWT.
 * - Same-origin monorepo on Vercel: sameSite=lax + secure (default in production)
 * - Separate frontend/backend Vercel projects: set COOKIE_CROSS_SITE=true → sameSite=none
 * Frontend also sends Authorization: Bearer from localStorage, so API auth works
 * even when cookies are blocked cross-site.
 */
const getAuthCookieOptions = (overrides = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const crossSite = String(process.env.COOKIE_CROSS_SITE || '').toLowerCase() === 'true';
  return {
    httpOnly: true,
    secure: isProduction || crossSite,
    sameSite: crossSite ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    ...overrides,
  };
};

const sendTokenCookie = (res, token) => {
  res.cookie('token', token, getAuthCookieOptions());
};

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
    return false;
  }
  return true;
};

const handleMongooseValidationError = (error, res) => {
  const messages = Object.values(error.errors).map((err) => err.message);
  return res.status(400).json({
    success: false,
    message: messages[0] || 'Validation failed.',
    errors: messages,
  });
};

exports.register = async (req, res) => {
  if (!handleValidation(req, res)) return;

  try {
    const { fullName, username, email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    if (isAdminEmail(normalizedEmail)) {
      return res.status(403).json({ success: false, message: 'This email is reserved and cannot be used for registration.' });
    }

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'This username is already taken.' });
    }

    const user = await User.create({
      fullName: fullName.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password,
    });

    const token = generateToken(user);
    sendTokenCookie(res, token);

    console.log(`Registration successful: ${user.email} (${user.username})`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Register error:', error);

    if (error.name === 'ValidationError') {
      return handleMongooseValidationError(error, res);
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: field === 'email' ? 'An account with this email already exists.' : 'This username is already taken.',
      });
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(500).json({ success: false, message: 'Failed to generate authentication token.' });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

exports.login = async (req, res) => {
  if (!handleValidation(req, res)) return;

  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (isAdminEmail(normalizedEmail)) {
      if (!isAdminCredentialsConfigured()) {
        return res.status(503).json({ success: false, message: 'Admin login is not configured on the server.' });
      }
      if (!verifyAdminPassword(password)) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const user = await ensureAdminUser(User);
      const token = generateToken(user);
      sendTokenCookie(res, token);

      console.log(`Admin login successful: ${user.email} (role=${user.role})`);

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: {
          ...user.toPublicJSON(),
          role: user.role || 'admin',
        },
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.role === 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.accountStatus === 'blocked') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact support.' });
    }
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account is suspended. Contact support.' });
    }

    const token = generateToken(user);
    sendTokenCookie(res, token);

    console.log(`Login successful: ${user.email} (role=${user.role || 'user'})`);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    let user = req.user;

    if (isAdminEmail(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      user.accountStatus = 'active';
      await user.save();
    }

    const postsCount = await Post.countDocuments({ user: user._id });
    const userJson = user.toPublicJSON();

    res.status(200).json({
      success: true,
      user: {
        ...userJson,
        role: user.role || userJson.role || 'user',
        postsCount,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile.',
    });
  }
};

exports.logout = (req, res) => {
  res.cookie(
    'token',
    '',
    getAuthCookieOptions({ expires: new Date(0), maxAge: 0 })
  );
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
