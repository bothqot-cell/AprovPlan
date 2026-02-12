const config = require('../config');
const { query } = require('../config/db');

const checkUploadLimit = async (req, res, next) => {
  const user = req.user;
  const tierConfig = config.tiers[user.tier];

  if (!tierConfig) {
    return res.status(500).json({ error: 'Invalid subscription tier' });
  }

  // Reset monthly counter if needed
  const resetAt = new Date(user.uploads_reset_at);
  const now = new Date();
  if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
    await query('UPDATE users SET uploads_this_month = 0, uploads_reset_at = NOW() WHERE id = $1', [user.id]);
    user.uploads_this_month = 0;
  }

  // Check limit (-1 = unlimited)
  if (tierConfig.maxUploadsPerMonth !== -1 && user.uploads_this_month >= tierConfig.maxUploadsPerMonth) {
    return res.status(403).json({
      error: 'Monthly upload limit reached',
      limit: tierConfig.maxUploadsPerMonth,
      used: user.uploads_this_month,
      tier: user.tier,
    });
  }

  req.tierConfig = tierConfig;
  next();
};

const checkProjectLimit = async (req, res, next) => {
  const user = req.user;
  const tierConfig = config.tiers[user.tier];

  if (tierConfig.maxProjects === -1) {
    req.tierConfig = tierConfig;
    return next();
  }

  const result = await query(
    'SELECT COUNT(*) as count FROM projects WHERE user_id = $1 AND status != $2',
    [user.id, 'archived']
  );

  if (parseInt(result.rows[0].count, 10) >= tierConfig.maxProjects) {
    return res.status(403).json({
      error: 'Project limit reached',
      limit: tierConfig.maxProjects,
      tier: user.tier,
    });
  }

  req.tierConfig = tierConfig;
  next();
};

const checkFileSize = (req, res, next) => {
  const tierConfig = config.tiers[req.user.tier];
  const maxBytes = tierConfig.maxFileSizeMB * 1024 * 1024;

  if (req.file && req.file.size > maxBytes) {
    return res.status(413).json({
      error: 'File exceeds size limit for your tier',
      maxSizeMB: tierConfig.maxFileSizeMB,
      tier: req.user.tier,
    });
  }
  next();
};

module.exports = { checkUploadLimit, checkProjectLimit, checkFileSize };
