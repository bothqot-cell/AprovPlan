const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../config/db');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.secret);
    const result = await query('SELECT id, email, full_name, company, role, tier, subscription_status, uploads_this_month, uploads_reset_at, is_active FROM users WHERE id = $1', [payload.sub]);

    if (!result.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!result.rows[0].is_active) {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireTier = (...allowedTiers) => (req, res, next) => {
  if (!allowedTiers.includes(req.user.tier)) {
    return res.status(403).json({
      error: 'Upgrade required',
      currentTier: req.user.tier,
      requiredTiers: allowedTiers,
    });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireTier };
