const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { checkProjectLimit } = require('../middleware/tierCheck');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// GET /api/projects
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM uploads u WHERE u.project_id = p.id) as upload_count,
              (SELECT COUNT(*) FROM analyses a WHERE a.project_id = p.id AND a.status = 'completed') as analysis_count
       FROM projects p
       WHERE p.user_id = $1
       ORDER BY p.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects
router.post(
  '/',
  authenticate,
  checkProjectLimit,
  [
    body('name').trim().notEmpty().isLength({ max: 255 }),
    body('description').optional().trim(),
    body('address').optional().trim(),
    body('projectType').optional().isIn(['residential', 'commercial', 'mixed_use', 'addition', 'remodel']),
    body('jurisdiction').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, address, projectType, jurisdiction } = req.body;
      const result = await query(
        `INSERT INTO projects (user_id, name, description, address, project_type, jurisdiction)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user.id, name, description || null, address || null, projectType || 'residential', jurisdiction || null]
      );

      await logAudit(req.user.id, 'project.create', 'project', result.rows[0].id, { name }, req.ip);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// GET /api/projects/:id
router.get('/:id', authenticate, param('id').isUUID(), async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*,
              json_agg(DISTINCT jsonb_build_object(
                'id', u.id, 'originalFilename', u.original_filename,
                'mimeType', u.mime_type, 'fileSizeBytes', u.file_size_bytes,
                'status', u.status, 'createdAt', u.created_at
              )) FILTER (WHERE u.id IS NOT NULL) as uploads
       FROM projects p
       LEFT JOIN uploads u ON u.project_id = p.id
       WHERE p.id = $1 AND p.user_id = $2
       GROUP BY p.id`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PATCH /api/projects/:id
router.patch(
  '/:id',
  authenticate,
  param('id').isUUID(),
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('address').optional().trim(),
    body('status').optional().isIn(['active', 'archived', 'completed']),
    body('jurisdiction').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const fields = [];
      const values = [];
      let idx = 1;

      for (const [key, val] of Object.entries(req.body)) {
        const col = key === 'projectType' ? 'project_type' : key;
        fields.push(`${col} = $${idx}`);
        values.push(val);
        idx++;
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(req.params.id, req.user.id);
      const result = await query(
        `UPDATE projects SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
        values
      );

      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// DELETE /api/projects/:id
router.delete('/:id', authenticate, param('id').isUUID(), async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await logAudit(req.user.id, 'project.delete', 'project', req.params.id, {}, req.ip);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
