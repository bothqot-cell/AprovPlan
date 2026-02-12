const { query } = require('../config/db');
const logger = require('./logger');

const logAudit = async (userId, action, resourceType, resourceId, details = {}, ipAddress = null) => {
  try {
    await query(
      `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, resourceType, resourceId, JSON.stringify(details), ipAddress]
    );
  } catch (err) {
    logger.error('Audit log write failed', { err: err.message, action, resourceType });
  }
};

module.exports = { logAudit };
