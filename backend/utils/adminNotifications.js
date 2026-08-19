const AdminNotification = require('../models/AdminNotification');
const User = require('../models/User');
const { REASON_LABELS } = require('../utils/reportConstants');

const MAX_ACTIVE_ADMIN_NOTIFICATIONS = 10;

const getAdminIds = async () => {
  const admins = await User.find({ role: 'admin' }).select('_id');
  return admins.map((a) => a._id);
};

const cleanupAdminNotifications = async (recipientId) => {
  let notifications = await AdminNotification.find({ recipient: recipientId })
    .sort({ createdAt: -1 })
    .select('_id isRead createdAt');

  while (notifications.length > MAX_ACTIVE_ADMIN_NOTIFICATIONS) {
    const oldestRead = [...notifications].reverse().find((n) => n.isRead);
    if (!oldestRead) break;
    await AdminNotification.deleteOne({ _id: oldestRead._id });
    notifications = notifications.filter((n) => n._id.toString() !== oldestRead._id.toString());
  }
};

const notifyAdmins = async ({ type, title, message, relatedType, relatedId, metadata = {} }) => {
  const adminIds = await getAdminIds();
  if (!adminIds.length) return [];

  const docs = await AdminNotification.insertMany(
    adminIds.map((recipient) => ({
      recipient,
      type,
      title,
      message,
      relatedType,
      relatedId: relatedId || null,
      metadata,
      isRead: false,
    }))
  );

  await Promise.all(adminIds.map((id) => cleanupAdminNotifications(id)));
  return docs;
};

const notifyNewReport = async (report, reporter) => {
  const reasonLabel = REASON_LABELS[report.reason] || report.reason;
  const reporterName = reporter?.username ? `@${reporter.username}` : 'A user';
  const title = report.priority === 'high' ? 'High Priority Report' : 'New Report';
  const message = `${reporterName} reported a ${report.targetType}. Reason: ${reasonLabel}`;
  return notifyAdmins({
    type: report.priority === 'high' ? 'moderation' : 'report',
    title,
    message,
    relatedType: 'report',
    relatedId: report._id,
    metadata: {
      targetType: report.targetType,
      targetId: report.targetId?.toString() || null,
      reason: report.reason,
      priority: report.priority,
      reporterId: reporter?._id?.toString() || report.reporter?.toString(),
      reporterUsername: reporter?.username || '',
    },
  });
};

const notifyUserReportReply = async (report, user) => {
  const username = user?.username ? `@${user.username}` : 'A user';
  return notifyAdmins({
    type: 'user_reply',
    title: 'User Reply on Report',
    message: `${username} replied on report #${report._id.toString().slice(-6).toUpperCase()}`,
    relatedType: 'report',
    relatedId: report._id,
    metadata: {
      reporterId: user?._id?.toString(),
      reporterUsername: user?.username || '',
    },
  });
};

const notifyNewSupportTicket = async (ticket, user) => {
  const username = user?.username ? `@${user.username}` : 'A user';
  return notifyAdmins({
    type: 'support',
    title: ticket.priority === 'high' ? 'High Priority Support Ticket' : 'New Support Ticket',
    message: `${username} submitted support ticket #${ticket.ticketNumber}: ${ticket.subject}`,
    relatedType: 'support',
    relatedId: ticket._id,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      category: ticket.category,
      userId: user?._id?.toString(),
    },
  });
};

const formatAdminNotification = (n) => ({
  id: n._id.toString(),
  type: n.type,
  title: n.title,
  message: n.message,
  relatedType: n.relatedType,
  relatedId: n.relatedId?.toString() || null,
  metadata: n.metadata || {},
  isRead: n.isRead,
  createdAt: n.createdAt,
});

module.exports = {
  MAX_ACTIVE_ADMIN_NOTIFICATIONS,
  cleanupAdminNotifications,
  notifyAdmins,
  notifyNewReport,
  notifyUserReportReply,
  notifyNewSupportTicket,
  formatAdminNotification,
};
