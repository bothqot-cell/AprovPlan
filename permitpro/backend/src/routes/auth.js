const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const config = require('../config');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { logAudit } = require('../utils/audit');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ sub: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').trim().notEmpty(),
    body('company').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, fullName, company } = req.body;

      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const result = await query(
        `INSERT INTO users (email, password_hash, full_name, company)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, full_name, company, role, tier`,
        [email, passwordHash, fullName, company || null]
      );

      const user = result.rows[0];
      const token = signToken(user.id);

      await logAudit(user.id, 'user.register', 'user', user.id, {}, req.ip);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          company: user.company,
          role: user.role,
          tier: user.tier,
        },
      });
    } catch (err) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const result = await query(
        'SELECT id, email, password_hash, full_name, company, role, tier, is_active FROM users WHERE email = $1',
        [email]
      );

      if (!result.rows[0]) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account deactivated' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = signToken(user.id);
      await logAudit(user.id, 'user.login', 'user', user.id, {}, req.ip);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          company: user.company,
          role: user.role,
          tier: user.tier,
        },
      });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const result = await query(
    `SELECT id, email, full_name, company, role, tier, subscription_status,
            subscription_period_end, uploads_this_month, created_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );
  const u = result.rows[0];
  res.json({
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    company: u.company,
    role: u.role,
    tier: u.tier,
    subscriptionStatus: u.subscription_status,
    subscriptionPeriodEnd: u.subscription_period_end,
    uploadsThisMonth: u.uploads_this_month,
    createdAt: u.created_at,
    tierLimits: config.tiers[u.tier],
  });
});

module.exports = router;
