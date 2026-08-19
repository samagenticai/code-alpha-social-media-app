const SupportTicket = require('../models/SupportTicket');
const { notifyNewSupportTicket } = require('../utils/adminNotifications');

exports.createTicket = async (req, res) => {
  try {
    const { subject, category, description, priority } = req.body;
    if (!subject?.trim() || !category || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Subject, category, and description are required.' });
    }
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject: subject.trim(),
      category,
      description: description.trim(),
      priority: priority === 'high' ? 'high' : 'normal',
      messages: [{
        sender: req.user._id,
        senderRole: 'user',
        message: description.trim(),
      }],
    });
    await notifyNewSupportTicket(ticket, req.user).catch((err) => {
      console.error('Admin notification for support ticket failed:', err);
    });
    res.status(201).json({ success: true, message: 'Support ticket created.', ticket });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to create support ticket.' });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .select('ticketNumber subject category status priority createdAt updatedAt messages');
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load support tickets.' });
  }
};

exports.getMyTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id })
      .populate('messages.sender', 'fullName username profileImage role');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load ticket.' });
  }
};

exports.replyToTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    const message = req.body.message?.trim();
    if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });
    ticket.messages.push({ sender: req.user._id, senderRole: 'user', message });
    if (ticket.status === 'waiting_for_user') ticket.status = 'in_progress';
    await ticket.save();
    res.json({ success: true, message: 'Reply sent.', ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send reply.' });
  }
};
