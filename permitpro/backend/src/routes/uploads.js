const express = require('express');
const { param, validationResult } = require('express-validator');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { checkUploadLimit, checkFileSize } = require('../middleware/tierCheck');
const upload = require('../middleware/upload');
const { logAudit } = require('../utils/audit');
const analysisService = require('../services/ai/analysisService');

const router = express.Router();

// POST /api/projects/:projectId/uploads
router.post(
  '/:projectId',
  authenticate,
  checkUploadLimit,
  upload.single('file'),
  checkFileSize,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      // Verify project ownership
      const project = await query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [projectId, req.user.id]
      );
      if (!project.rows[0]) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Create upload record
      const result = await query(
        `INSERT INTO uploads (project_id, user_id, original_filename, stored_filename, mime_type, file_size_bytes, file_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          projectId,
          req.user.id,
          req.file.originalname,
          req.file.filename,
          req.file.mimetype,
          req.file.size,
          req.file.path,
        ]
      );

      // Increment user upload counter
      await query(
        'UPDATE users SET uploads_this_month = uploads_this_month + 1 WHERE id = $1',
        [req.user.id]
      );

      const uploadRecord = result.rows[0];
      await logAudit(req.user.id, 'upload.create', 'upload', uploadRecord.id, {
        filename: req.file.originalname,
        size: req.file.size,
      }, req.ip);

      // Trigger analysis asynchronously
      analysisService.runAnalysis(uploadRecord, req.user).catch(() => {});

      res.status(201).json(uploadRecord);
    } catch (err) {
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// GET /api/uploads/:id
router.get('/:id', authenticate, param('id').isUUID(), async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, a.id as analysis_id, a.status as analysis_status,
              a.approval_readiness_score, a.risk_level
       FROM uploads u
       LEFT JOIN analyses a ON a.upload_id = u.id
       WHERE u.id = $1 AND u.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch upload' });
  }
});

module.exports = router;
