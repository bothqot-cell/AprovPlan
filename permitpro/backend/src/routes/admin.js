const express = require('express');
const { param, query: validateQuery } = require('express-validator');
const { query } = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [users, projects, uploads, analyses] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL \'30 days\') as recent FROM users'),
      query('SELECT COUNT(*) as total FROM projects'),
      query('SELECT COUNT(*) as total, COALESCE(SUM(file_size_bytes), 0) as total_bytes FROM uploads'),
      query(`SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'completed') as completed,
             COUNT(*) FILTER (WHERE status = 'failed') as failed,
             ROUND(AVG(approval_readiness_score)::numeric, 1) as avg_score
             FROM analyses`),
    ]);

    const tierBreakdown = await query(
      'SELECT tier, COUNT(*) as count FROM users GROUP BY tier'
    );

    res.json({
      users: { total: parseInt(users.rows[0].total), recentSignups: parseInt(users.rows[0].recent) },
      projects: { total: parseInt(projects.rows[0].total) },
      uploads: { total: parseInt(uploads.rows[0].total), totalBytes: parseInt(uploads.rows[0].total_bytes) },
      analyses: {
        total: parseInt(analyses.rows[0].total),
        completed: parseInt(analyses.rows[0].completed),
        failed: parseInt(analyses.rows[0].failed),
        avgScore: parseFloat(analyses.rows[0].avg_score) || 0,
      },
      tierBreakdown: tierBreakdown.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, email, full_name, company, role, tier, subscription_status,
              uploads_this_month, is_active, created_at
       FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM users');

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', param('id').isUUID(), async (req, res) => {
  try {
    const allowed = ['is_active', 'role', 'tier'];
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, val] of Object.entries(req.body)) {
      if (allowed.includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, role, tier, is_active`,
      values
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/admin/feature-flags
router.get('/feature-flags', async (req, res) => {
  try {
    const result = await query('SELECT * FROM feature_flags ORDER BY key');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

// PATCH /api/admin/feature-flags/:id
router.patch('/feature-flags/:id', param('id').isUUID(), async (req, res) => {
  try {
    const { enabled, metadata } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    if (typeof enabled === 'boolean') {
      fields.push(`enabled = $${idx}`);
      values.push(enabled);
      idx++;
    }
    if (metadata) {
      fields.push(`metadata = $${idx}`);
      values.push(JSON.stringify(metadata));
      idx++;
    }

    if (fields.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    values.push(req.params.id);
    const result = await query(
      `UPDATE feature_flags SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update feature flag' });
  }
});

// GET /api/admin/audit-log
router.get('/audit-log', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT al.*, u.email as user_email
       FROM audit_log al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

module.exports = router;
