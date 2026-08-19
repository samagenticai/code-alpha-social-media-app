import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { reportService } from '../../services/reportService';

export const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'abusive_behavior', label: 'Abusive behavior' },
  { value: 'spam', label: 'Spam' },
  { value: 'fake_account', label: 'Fake account' },
  { value: 'hate_inappropriate', label: 'Hate or inappropriate content' },
  { value: 'nudity_sexual', label: 'Nudity/sexual content' },
  { value: 'threats', label: 'Threats' },
  { value: 'copyright', label: 'Copyright' },
  { value: 'scam_fraud', label: 'Scam/Fraud' },
  { value: 'other', label: 'Other' },
];

const STATUS_LABELS = {
  pending: 'Pending',
  in_review: 'In Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const getReportStatusLabel = (status) => STATUS_LABELS[status] || status;

export const ReportModal = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetLabel,
  onSubmitted,
}) => {
  const [reason, setReason] = useState('harassment');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await reportService.createReport({
        targetType,
        targetId,
        reason,
        description: description.trim(),
      });
      setDescription('');
      setReason('harassment');
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Report" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {targetLabel && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Reporting: <span className="font-semibold text-slate-900 dark:text-slate-100">{targetLabel}</span>
          </p>
        )}

        <div>
          <label htmlFor="report-reason" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Reason
          </label>
          <select
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
            required
          >
            {REPORT_REASONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="report-description" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Description / Additional information
          </label>
          <textarea
            id="report-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide any details that may help review this report..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportModal;
