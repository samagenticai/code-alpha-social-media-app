const AdminActivityLog = require('../models/AdminActivityLog');

const logAdminAction = async ({ adminId, action, targetType, targetId, description, metadata }) => {
  try {
    await AdminActivityLog.create({
      adminId,
      action,
      targetType: targetType || 'system',
      targetId: targetId || null,
      description: description || '',
      metadata: metadata || {},
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
};

module.exports = { logAdminAction };
