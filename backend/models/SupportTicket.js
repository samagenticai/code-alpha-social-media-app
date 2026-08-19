const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['user', 'admin'], default: 'user' },
    message: { type: String, required: true, maxlength: 5000 },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: Number, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    category: {
      type: String,
      enum: [
        'technical',
        'account',
        'report_user',
        'report_content',
        'login',
        'privacy',
        'other',
      ],
      required: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    priority: { type: String, enum: ['normal', 'high'], default: 'normal', index: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    messages: [ticketMessageSchema],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

supportTicketSchema.pre('save', async function assignTicketNumber() {
  if (this.isNew && !this.ticketNumber) {
    const last = await this.constructor.findOne().sort({ ticketNumber: -1 }).select('ticketNumber');
    this.ticketNumber = (last?.ticketNumber || 1000) + 1;
  }
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
