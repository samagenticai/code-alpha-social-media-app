const mongoose = require('mongoose');
const Report = require('../models/Report');
const ReportMessage = require('../models/ReportMessage');
const User = require('../models/User');
const { notifyNewReport, notifyUserReportReply } = require('../utils/adminNotifications');
const { createNotification } = require('./notificationsController');
const { REASON_LABELS } = require('../utils/reportConstants');
const { formatAdminReport } = require('../utils/reportTargetResolver');

const formatReportForUser = (report) => ({
  id: report._id.toString(),
  reportNumber: report._id.toString().slice(-6).toUpperCase(),
  targetType: report.targetType,
  targetId: report.targetId?.toString() || null,
  reason: report.reason,
  reasonLabel: REASON_LABELS[report.reason] || report.reason,
  description: report.description || '',
  status: report.status,
  priority: report.priority,
  createdAt: report.createdAt,
  resolvedAt: report.resolvedAt,
});

const formatReportMessage = (msg) => ({
  id: msg._id.toString(),
  reportId: msg.reportId.toString(),
  senderId: msg.senderId?._id?.toString() || msg.senderId?.toString(),
  senderRole: msg.senderRole,
  senderName: msg.senderId?.fullName || msg.senderId?.username || (msg.senderRole === 'admin' ? 'Admin' : 'User'),
  senderUsername: msg.senderId?.username || '',
  senderAvatar: msg.senderId?.profileImage || '',
  message: msg.message,
  isRead: msg.isRead,
  createdAt: msg.createdAt,
});

const loadUserReport = async (reportId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(reportId)) return null;
  return Report.findOne({ _id: reportId, reporter: userId });
};

exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, targetRef, reason, description, priority } = req.body;
    if (!targetType || !reason) {
      return res.status(400).json({ success: false, message: 'Target type and reason are required.' });
    }

    const duplicate = await Report.findOne({
      reporter: req.user._id,
      targetType,
      targetId: targetId || null,
      status: { $in: ['pending', 'in_review'] },
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'You already have an open report for this content.',
        report: formatReportForUser(duplicate),
      });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId: targetId || null,
      targetRef: targetRef || '',
      reason,
      description: description || '',
      priority: priority === 'high' ? 'high' : 'normal',
    });

    const initialText = description?.trim() || `Submitted report: ${REASON_LABELS[reason] || reason}`;
    await ReportMessage.create({
      reportId: report._id,
      senderId: req.user._id,
      senderRole: 'user',
      message: initialText,
      isRead: false,
    });

    await notifyNewReport(report, req.user).catch((err) => {
      console.error('Admin notification for report failed:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted.',
      report: formatReportForUser(report),
    });
  } catch (error) {
    console.error('Create report error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid report data.' });
    }
    res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({
      success: true,
      reports: reports.map(formatReportForUser),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load reports.' });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await loadUserReport(req.params.reportId, req.user._id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    const formatted = await formatAdminReport(report, null, false);
    res.json({ success: true, report: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load report.' });
  }
};

exports.getReportMessages = async (req, res) => {
  try {
    const report = await loadUserReport(req.params.reportId, req.user._id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const messages = await ReportMessage.find({ reportId: report._id })
      .populate('senderId', 'fullName username profileImage role')
      .sort({ createdAt: 1 });

    await ReportMessage.updateMany(
      { reportId: report._id, senderRole: 'admin', isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      report: formatReportForUser(report),
      messages: messages.map(formatReportMessage),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load messages.' });
  }
};

exports.postReportMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const report = await loadUserReport(req.params.reportId, req.user._id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    if (['resolved', 'rejected'].includes(report.status)) {
      return res.status(400).json({ success: false, message: 'This report is closed.' });
    }

    const msg = await ReportMessage.create({
      reportId: report._id,
      senderId: req.user._id,
      senderRole: 'user',
      message: message.trim(),
      isRead: false,
    });

    await notifyUserReportReply(report, req.user).catch(console.error);

    const populated = await ReportMessage.findById(msg._id).populate('senderId', 'fullName username profileImage role');
    res.status(201).json({ success: true, message: formatReportMessage(populated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

exports.formatReportForUser = formatReportForUser;
exports.REASON_LABELS = REASON_LABELS;
exports.formatReportMessage = formatReportMessage;

exports.resolveReportTarget = async (report) => {
  const { resolveReportTargetPreview } = require('../utils/reportTargetResolver');
  const { targetPreview } = await resolveReportTargetPreview(report);
  return targetPreview;
};

exports.notifyUserAboutReport = async ({ report, adminUser, type, text }) => {
  if (!report?.reporter || !adminUser?._id) return;
  await createNotification({
    recipient: report.reporter,
    sender: adminUser._id,
    type,
    report: report._id,
    text,
  });
};
