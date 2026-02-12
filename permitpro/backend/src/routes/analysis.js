const express = require('express');
const { param } = require('express-validator');
const PDFDocument = require('pdfkit');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// GET /api/analysis/:id
router.get('/:id', authenticate, param('id').isUUID(), async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, u.original_filename
       FROM analyses a
       JOIN uploads u ON u.id = a.upload_id
       WHERE a.id = $1 AND a.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis = result.rows[0];

    // Free tier gets limited report
    if (req.user.tier === 'free') {
      delete analysis.extracted_data;
      delete analysis.rule_results;
      delete analysis.llm_interpretation;
    }

    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// GET /api/analysis/upload/:uploadId
router.get('/upload/:uploadId', authenticate, param('uploadId').isUUID(), async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, u.original_filename
       FROM analyses a
       JOIN uploads u ON u.id = a.upload_id
       WHERE a.upload_id = $1 AND a.user_id = $2
       ORDER BY a.created_at DESC LIMIT 1`,
      [req.params.uploadId, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// GET /api/analysis/project/:projectId
router.get('/project/:projectId', authenticate, param('projectId').isUUID(), async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, u.original_filename
       FROM analyses a
       JOIN uploads u ON u.id = a.upload_id
       WHERE a.project_id = $1 AND a.user_id = $2
       ORDER BY a.created_at DESC`,
      [req.params.projectId, req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// GET /api/analysis/:id/report/json
router.get('/:id/report/json', authenticate, param('id').isUUID(), async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, u.original_filename, p.name as project_name, p.address as project_address
       FROM analyses a
       JOIN uploads u ON u.id = a.upload_id
       JOIN projects p ON p.id = a.project_id
       WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'completed'`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Completed analysis not found' });
    }

    if (req.user.tier === 'free') {
      return res.status(403).json({ error: 'Report download requires a paid plan' });
    }

    const a = result.rows[0];
    const report = {
      reportVersion: '1.0',
      generatedAt: new Date().toISOString(),
      project: { name: a.project_name, address: a.project_address },
      file: a.original_filename,
      summary: {
        approvalReadinessScore: a.approval_readiness_score,
        riskLevel: a.risk_level,
        processingTimeMs: a.processing_time_ms,
      },
      complianceFlags: a.compliance_flags,
      missingInformation: a.missing_information,
      rejectionRisks: a.rejection_risks,
      recommendations: a.recommendations,
      ruleResults: a.rule_results,
      interpretation: a.llm_interpretation,
    };

    res.setHeader('Content-Disposition', `attachment; filename="permitpro-report-${a.id}.json"`);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/analysis/:id/report/pdf
router.get('/:id/report/pdf', authenticate, param('id').isUUID(), async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, u.original_filename, p.name as project_name, p.address as project_address
       FROM analyses a
       JOIN uploads u ON u.id = a.upload_id
       JOIN projects p ON p.id = a.project_id
       WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'completed'`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Completed analysis not found' });
    }

    if (req.user.tier === 'free') {
      return res.status(403).json({ error: 'Report download requires a paid plan' });
    }

    const a = result.rows[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="permitpro-report-${a.id}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(22).text('PermitPro AI Plan Review Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown(1);

    // Project Info
    doc.fontSize(14).fillColor('#000').text('Project Information');
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc');
    doc.moveDown(0.3);
    doc.fontSize(10);
    doc.text(`Project: ${a.project_name}`);
    if (a.project_address) doc.text(`Address: ${a.project_address}`);
    doc.text(`File: ${a.original_filename}`);
    doc.moveDown(1);

    // Score
    doc.fontSize(14).text('Approval Readiness Score');
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc');
    doc.moveDown(0.3);
    const scoreColor = a.approval_readiness_score >= 80 ? '#22c55e' : a.approval_readiness_score >= 60 ? '#eab308' : '#ef4444';
    doc.fontSize(28).fillColor(scoreColor).text(`${a.approval_readiness_score}/100`, { align: 'center' });
    doc.fontSize(12).fillColor('#666').text(`Risk Level: ${a.risk_level.toUpperCase()}`, { align: 'center' });
    doc.moveDown(1);

    // Compliance Flags
    doc.fillColor('#000').fontSize(14).text('Compliance Flags');
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc');
    doc.moveDown(0.3);
    doc.fontSize(9);
    const flags = a.compliance_flags || [];
    if (flags.length === 0) {
      doc.fillColor('#22c55e').text('No compliance violations detected');
    } else {
      for (const flag of flags) {
        const sevColor = flag.severity === 'critical' ? '#ef4444' : flag.severity === 'high' ? '#f97316' : '#eab308';
        doc.fillColor(sevColor).text(`[${flag.severity.toUpperCase()}] ${flag.code} — ${flag.description}`);
        for (const v of flag.violations) {
          doc.fillColor('#333').text(`  • ${v}`);
        }
        doc.moveDown(0.2);
      }
    }
    doc.moveDown(0.5);

    // Missing Information
    doc.fillColor('#000').fontSize(14).text('Missing Information');
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc');
    doc.moveDown(0.3);
    doc.fontSize(9);
    const missing = a.missing_information || [];
    if (missing.length === 0) {
      doc.fillColor('#22c55e').text('No missing information detected');
    } else {
      for (const m of missing) {
        doc.fillColor('#333').text(`• ${m.item} (${m.severity}) — ${m.reason}`);
      }
    }
    doc.moveDown(0.5);

    // Recommendations
    doc.fillColor('#000').fontSize(14).text('Recommendations');
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc');
    doc.moveDown(0.3);
    doc.fontSize(9);
    for (const rec of (a.recommendations || [])) {
      doc.fillColor('#333').text(`[${rec.priority.toUpperCase()}] ${rec.text}`);
      doc.moveDown(0.2);
    }
    doc.moveDown(0.5);

    // Interpretation
    if (a.llm_interpretation) {
      doc.fillColor('#000').fontSize(14).text('AI Interpretation');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc');
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#333').text(a.llm_interpretation);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999').text(
      'This report is generated by PermitPro AI and is intended for pre-submission review purposes only. It does not constitute an official permit review or approval.',
      { align: 'center' }
    );

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

module.exports = router;
