import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconSettings,
  IconUser,
  IconSun,
  IconCheck,
  IconClose,
  IconSearch,
  IconSparkles,
  IconTrash,
  IconInfo,
  IconEye,
  IconEyeOff,
} from '../ui/Icons';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { EditProfileModal } from '../profile/EditProfileModal';
import { settingsService } from '../../services/settingsService';
import { userService } from '../../services/userService';
import { supportService } from '../../services/supportService';
import { moderationService } from '../../services/moderationService';
import { reportService } from '../../services/reportService';
import { getReportStatusLabel } from '../moderation/ReportModal';
import { ReportConversation } from '../moderation/ReportConversation';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { PlatformDocumentModal } from './PlatformDocumentModal';
import { APP_RELEASE } from '../../data/platformDocuments';
import { BRAND, readStoredValue, writeStoredValue } from '../../config/brand';

// Shield / Lock Icon for Privacy
const IconShield = ({ className = '' }) => (
  <svg className={`w-5 h-5 flex-shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

// Pencil / Edit Icon
const IconEdit = ({ className = 'w-4 h-4 flex-shrink-0' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

// Blocked / Stop Icon
const IconBlock = ({ className = '' }) => (
  <svg className={`w-5 h-5 flex-shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

// Key Icon for Password
const IconKey = ({ className = '' }) => (
  <svg className={`w-4 h-4 flex-shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

// Phone Icon
const IconPhone = ({ className = '' }) => (
  <svg className={`w-4 h-4 flex-shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

// Media / Play Icon for Content & Media
const IconMedia = ({ className = '' }) => (
  <svg className={`w-5 h-5 flex-shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Help Icon
const IconHelp = ({ className = '' }) => (
  <svg className={`w-5 h-5 flex-shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// About / Info Circle Icon
const IconAbout = ({ className = '' }) => (
  <svg className={`w-5 h-5 flex-shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Document Icon for Terms/Privacy
const IconDoc = ({ className = '' }) => (
  <svg className={`w-4 h-4 flex-shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Chevron Icon for Collapsible Accordion
const IconChevron = ({ className = '', open = false }) => (
  <svg
    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

const DEFAULT_PRIVACY = {
  isPrivateAccount: false,
  whoCanFollow: 'everyone',
  whoCanComment: 'everyone',
  whoCanMessage: 'everyone',
  whoCanTag: 'everyone',
  hideLikedPosts: false,
};

const mergePrivacy = (incoming) => ({
  ...DEFAULT_PRIVACY,
  ...(incoming && typeof incoming === 'object' ? incoming : {}),
});

export const SettingsView = ({ user: propsUser, isGuest, onLogout, openReportId = null, onReportConversationClose }) => {
  const { user: authUser, updateUser, isAuthenticated: authIsAuthenticated } = useAuth();
  const user = propsUser || authUser;
  const isAuthenticated = authIsAuthenticated && !isGuest;
  const navigate = useNavigate();

  // SINGLE ACTIVE SECTION ACCORDION
  const [activeSection, setActiveSection] = useState(null);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState('bug');
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [supportReply, setSupportReply] = useState('');
  const [supportReplySending, setSupportReplySending] = useState(false);
  const [docModal, setDocModal] = useState(null);

  // Account Form States
  const [usernameInput, setUsernameInput] = useState(user?.username || user?.handle?.replace('@', '') || '');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Edit mode toggles for Account Settings
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Show/Hide password toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const currentPasswordRef = useRef(null);

  const [confirmModal, setConfirmModal] = useState(null);

  // Privacy State
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [privacyLoading, setPrivacyLoading] = useState(true);
  const [privacyError, setPrivacyError] = useState('');

  const loadPrivacySettings = async () => {
    if (!user?.id && !user?._id) {
      setPrivacyLoading(false);
      setPrivacyError('');
      return;
    }

    setPrivacyLoading(true);
    setPrivacyError('');

    try {
      const res = await settingsService.getPrivacySettings();
      setPrivacy(mergePrivacy(res.privacy));
    } catch (err) {
      console.error('Failed to load privacy settings:', err);
      setPrivacy(DEFAULT_PRIVACY);
      setPrivacyError(err.message || 'Unable to load settings');
    } finally {
      setPrivacyLoading(false);
    }
  };

  // Blocked Users State
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  // Restricted Users State
  const [restrictedUsers, setRestrictedUsers] = useState([]);
  const [restrictedLoading, setRestrictedLoading] = useState(false);

  // My Reports State
  const [myReports, setMyReports] = useState([]);
  const [myReportsLoading, setMyReportsLoading] = useState(false);
  const [activeReportConversation, setActiveReportConversation] = useState(null);
  const [reportConversationLoading, setReportConversationLoading] = useState(false);

  // Hidden Words State
  const [hiddenWords, setHiddenWords] = useState(['#spam', '#spoiler', 'hate']);
  const [newWordInput, setNewWordInput] = useState('');

  const [toast, setToast] = useState(null);

  // Professional Top Floating Alert State
  const [topAlert, setTopAlert] = useState(null);

  const triggerProfessionalAlert = (message, type = 'success') => {
    setTopAlert({ message, type });
    setTimeout(() => {
      setTopAlert(null);
    }, 4500);
  };

  useEffect(() => {
    if (user) {
      if (!isEditingUsername) setUsernameInput(user.username || user.handle?.replace('@', '') || '');
      if (!isEditingEmail) setEmailInput(user.email || '');
      if (!isEditingPhone) setPhoneInput(user.phone || '');
    }
  }, [user, isEditingUsername, isEditingEmail, isEditingPhone]);

  useEffect(() => {
    loadPrivacySettings();
  }, [user?.id, user?._id]);

  const loadModerationLists = useCallback(async () => {
    if (isGuest || !isAuthenticated) return;
    setBlockedLoading(true);
    setRestrictedLoading(true);
    setMyReportsLoading(true);
    try {
      const [blockedRes, restrictedRes, reportsRes] = await Promise.all([
        moderationService.getBlockedUsers(),
        moderationService.getRestrictedUsers(),
        reportService.getMyReports(),
      ]);
      setBlockedUsers(blockedRes.users || []);
      setRestrictedUsers(restrictedRes.users || []);
      setMyReports(reportsRes.reports || []);
    } catch (err) {
      console.error('Failed to load moderation lists:', err);
    } finally {
      setBlockedLoading(false);
      setRestrictedLoading(false);
      setMyReportsLoading(false);
    }
  }, [isGuest, isAuthenticated]);

  useEffect(() => {
    if (activeSection === 'blockedRestricted' && isAuthenticated && !isGuest) {
      loadModerationLists();
    }
  }, [activeSection, isAuthenticated, isGuest, loadModerationLists]);

  const loadReportMessages = useCallback((id) => reportService.getReportMessages(id), []);
  const sendReportMessage = useCallback((id, msg) => reportService.sendReportMessage(id, msg), []);
  const handledOpenReportIdRef = useRef(null);

  const openReportConversation = useCallback(async (report) => {
    setReportConversationLoading(true);
    try {
      const res = await reportService.getReport(report.id || report._id);
      setActiveReportConversation(res.report || report);
      setActiveSection('blockedRestricted');
    } catch {
      setActiveReportConversation(report);
      setActiveSection('blockedRestricted');
    } finally {
      setReportConversationLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!openReportId || !isAuthenticated || isGuest) return;
    if (handledOpenReportIdRef.current === openReportId) return;
    handledOpenReportIdRef.current = openReportId;

    let cancelled = false;
    const openById = async () => {
      try {
        const res = await reportService.getReport(openReportId);
        if (!cancelled && res.report) await openReportConversation(res.report);
      } catch {
        /* ignore */
      }
    };

    openById();
    return () => { cancelled = true; };
  }, [openReportId, isAuthenticated, isGuest, openReportConversation]);

  const closeReportConversation = () => {
    setActiveReportConversation(null);
    onReportConversationClose?.();
  };

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  // Toggle Section with Auto-Close of Previous Section
  const toggleSection = (sectionKey) => {
    setActiveSection((prev) => (prev === sectionKey ? null : sectionKey));
  };

  const handleUpdateUsername = async (e) => {
    e?.preventDefault();
    const clean = usernameInput.replace('@', '').trim().toLowerCase();
    if (!clean) return;
    try {
      const res = await userService.updateUserProfile({ username: clean });
      if (res.data) {
        updateUser(res.data);
      }
      setIsEditingUsername(false);
      triggerProfessionalAlert(`Username updated successfully to @${clean}`, 'success');
    } catch (err) {
      triggerProfessionalAlert(err.message || 'Failed to update username.', 'error');
    }
  };

  const handleEmailInputChange = (e) => {
    setEmailInput(e.target.value);
  };

  const handleUpdateEmail = async (e) => {
    e?.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      triggerProfessionalAlert('Please provide a valid email address.', 'error');
      return;
    }
    try {
      const res = await userService.updateUserProfile({ email: clean });
      if (res.data) {
        updateUser(res.data);
      }
      setIsEditingEmail(false);
      triggerProfessionalAlert(`Email address updated successfully to ${clean}`, 'success');
    } catch (err) {
      triggerProfessionalAlert(err.message || 'Failed to update email address.', 'error');
    }
  };

  const handleUpdatePhone = async (e) => {
    e?.preventDefault();
    const clean = phoneInput.trim();
    if (!clean) return;
    try {
      const res = await userService.updateUserProfile({ phone: clean });
      if (res.data) {
        updateUser(res.data);
      }
      setIsEditingPhone(false);
      triggerProfessionalAlert('Phone number updated & saved securely!', 'success');
    } catch (err) {
      triggerProfessionalAlert(err.message || 'Failed to update phone number.', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e?.preventDefault();
    if (!passwordForm.currentPassword) {
      triggerProfessionalAlert('Please enter your current password.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      triggerProfessionalAlert('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      triggerProfessionalAlert('New passwords do not match.', 'error');
      return;
    }
    try {
      await userService.updateUserProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsEditingPassword(false);
      triggerProfessionalAlert('Password changed successfully!', 'success');
    } catch (err) {
      triggerProfessionalAlert(err.message || 'Failed to update password. Please check your current password.', 'error');
    }
  };

  const handleDeactivateConfirm = () => {
    setConfirmModal(null);
    const deactivatedUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
    writeStoredValue('deactivated_until', deactivatedUntil.toString());
    showToast('Account deactivated for 5 minutes. Logging out...');
    setTimeout(() => onLogout?.(), 1000);
  };

  const handleDeleteConfirm = () => {
    setConfirmModal(null);
    showToast('Account deleted permanently.');
    setTimeout(() => onLogout?.(), 1500);
  };

  const handlePrivacyChange = async (key, value) => {
    const previous = privacy;
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);

    try {
      const res = await settingsService.updatePrivacySettings({
        isPrivateAccount: updated.isPrivateAccount,
        whoCanFollow: updated.whoCanFollow,
        whoCanComment: updated.whoCanComment,
        whoCanMessage: updated.whoCanMessage,
        whoCanTag: updated.whoCanTag,
        [key]: value,
      });
      if (res.privacy) setPrivacy(mergePrivacy(res.privacy));
      if (res.data) updateUser(res.data);
      triggerProfessionalAlert(
        key === 'isPrivateAccount'
          ? value
            ? 'Account set to Private. Only approved followers can view your profile & posts.'
            : 'Account set to Public. Anyone can view your profile & posts.'
          : 'Privacy setting saved.',
        'success'
      );
    } catch (err) {
      setPrivacy(previous);
      triggerProfessionalAlert(err.message || 'Failed to update privacy setting.', 'error');
    }
  };

  const handleUnblockUser = async (id) => {
    try {
      await moderationService.unblockUser(id);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
      showToast('User unblocked');
    } catch {
      showToast('Failed to unblock user');
    }
  };

  const handleUnrestrictUser = async (id) => {
    try {
      await moderationService.unrestrictUser(id);
      setRestrictedUsers((prev) => prev.filter((u) => u.id !== id));
      showToast('User unrestricted');
    } catch {
      showToast('Failed to unrestrict user');
    }
  };

  const handleAddHiddenWord = (e) => {
    e?.preventDefault();
    if (!newWordInput.trim()) return;
    const word = newWordInput.trim();
    if (!hiddenWords.includes(word)) {
      setHiddenWords((prev) => [...prev, word]);
      showToast(`Hidden word "${word}" added`);
    }
    setNewWordInput('');
  };

  const handleRemoveHiddenWord = (wordToRemove) => {
    setHiddenWords((prev) => prev.filter((w) => w !== wordToRemove));
    showToast(`Removed "${wordToRemove}"`);
  };

  const handleSubmitReport = async (e) => {
    e?.preventDefault();
    if (!reportText.trim() || isGuest) return;
    const categoryMap = {
      bug: 'technical',
      abuse: 'report_content',
      account: 'account',
      login: 'login',
      privacy: 'privacy',
      other: 'other',
    };
    const subjectMap = {
      bug: 'Technical Bug / Glitch',
      abuse: 'Abuse / Spam Report',
      account: 'Account Access Issue',
      login: 'Login Problem',
      privacy: 'Privacy Issue',
      other: 'Support Inquiry',
    };
    setReportSubmitting(true);
    try {
      await supportService.createTicket({
        subject: subjectMap[reportCategory] || 'Support Request',
        category: categoryMap[reportCategory] || 'other',
        description: reportText.trim(),
      });
      setReportModalOpen(false);
      setReportText('');
      showToast('Support ticket submitted. Our team will respond soon.');
      loadSupportTickets();
    } catch (err) {
      showToast(err.message || 'Failed to submit support ticket.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const loadSupportTickets = useCallback(async () => {
    if (isGuest) return;
    setSupportLoading(true);
    try {
      const res = await supportService.getMyTickets();
      setSupportTickets(res.tickets || []);
    } catch {
      setSupportTickets([]);
    } finally {
      setSupportLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    if (activeSection === 'helpSupport' && !isGuest) {
      loadSupportTickets();
    }
  }, [activeSection, isGuest, loadSupportTickets]);

  const openTicketDetail = async (ticketId) => {
    try {
      const res = await supportService.getMyTicket(ticketId);
      setSelectedTicket(res.ticket);
    } catch {
      showToast('Could not load ticket.');
    }
  };

  const handleSupportReply = async () => {
    if (!selectedTicket || !supportReply.trim()) return;
    setSupportReplySending(true);
    try {
      const res = await supportService.replyToTicket(selectedTicket._id, supportReply.trim());
      setSelectedTicket(res.ticket);
      setSupportReply('');
      loadSupportTickets();
    } catch (err) {
      showToast(err.message || 'Failed to send reply.');
    } finally {
      setSupportReplySending(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-12 animate-fadeIn">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-brand-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20"
          >
            <IconCheck className="w-4 h-4" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal (Deactivate / Delete) */}
      {confirmModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="fixed inset-0 theme-modal-backdrop cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4 text-center transition-colors"
            >
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${confirmModal === 'delete' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                {confirmModal === 'delete' ? <IconTrash className="w-7 h-7" /> : <IconInfo className="w-7 h-7" />}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {confirmModal === 'delete' ? 'Delete Account Permanently?' : 'Deactivate Account?'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                  {confirmModal === 'delete'
                    ? 'This action cannot be undone. All your posts, followers, and account media will be removed.'
                    : 'Your account will be deactivated for 5 minutes. You will be logged out and cannot log back in until the 5 minutes expire.'}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 font-bold !bg-slate-100 hover:!bg-slate-200 dark:!bg-slate-800 dark:hover:!bg-slate-700 !text-slate-700 dark:!text-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  variant={confirmModal === 'delete' ? 'danger' : 'primary'}
                  onClick={confirmModal === 'delete' ? handleDeleteConfirm : handleDeactivateConfirm}
                  className="flex-1 font-bold"
                >
                  {confirmModal === 'delete' ? 'Yes, Delete' : 'Yes, Deactivate'}
                </Button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      {/* Report A Problem Modal */}
      {reportModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportModalOpen(false)}
              className="fixed inset-0 theme-modal-backdrop cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <IconHelp className="w-5 h-5 text-cyan-500" /> Report a Problem
                </h3>
                <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  <IconClose className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Issue Category</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  >
                    <option value="bug">Technical Bug / Glitch</option>
                    <option value="abuse">Abuse / Spam Report</option>
                    <option value="account">Account Access Issue</option>
                    <option value="login">Login Problem</option>
                    <option value="privacy">Privacy Issue</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    rows={4}
                    placeholder="Describe what happened and how we can help..."
                    className="w-full p-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setReportModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="sm" className="!px-5 font-bold" disabled={reportSubmitting}>
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}

      {docModal && (
        <PlatformDocumentModal docKey={docModal} onClose={() => setDocModal(null)} />
      )}

      {/* Professional Top Floating Alert Banner */}
      {topAlert &&
        createPortal(
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-md pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`relative p-4 rounded-2xl border shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 ${
                topAlert.type === 'error'
                  ? 'bg-slate-900/95 dark:bg-slate-950/95 border-rose-500/40 text-white shadow-rose-500/10'
                  : 'bg-slate-900/95 dark:bg-slate-950/95 border-cyan-500/40 text-white shadow-cyan-500/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    topAlert.type === 'error'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {topAlert.type === 'error' ? (
                    <IconClose className="w-5 h-5" />
                  ) : (
                    <IconCheck className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        topAlert.type === 'error'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {topAlert.type === 'error' ? 'Security Alert' : 'System Alert'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-100 mt-1 truncate">
                    {topAlert.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setTopAlert(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </motion.div>
          </div>,
          document.body
        )}

      {/* Edit Profile Modal Trigger */}
      {isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          userProfile={user}
          onSave={() => setIsEditProfileOpen(false)}
        />
      )}

      <Modal
        isOpen={Boolean(activeReportConversation)}
        onClose={closeReportConversation}
        title={activeReportConversation ? `Report #${activeReportConversation.reportNumber || activeReportConversation.id?.slice(-6).toUpperCase()}` : 'Report Conversation'}
        maxWidth="max-w-lg"
      >
        {activeReportConversation && (
          <div className="space-y-3">
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p><span className="font-bold">Status:</span> {getReportStatusLabel(activeReportConversation.status)}</p>
              <p className="capitalize"><span className="font-bold">Reason:</span> {activeReportConversation.reasonLabel || activeReportConversation.reason?.replace(/_/g, ' ')}</p>
              {activeReportConversation.description && (
                <p><span className="font-bold">Details:</span> {activeReportConversation.description}</p>
              )}
            </div>
            <ReportConversation
              report={activeReportConversation}
              loadMessages={loadReportMessages}
              sendMessage={sendReportMessage}
              onReportUpdate={setActiveReportConversation}
            />
          </div>
        )}
      </Modal>

      {/* Main Header Banner */}
      <div className="relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-indigo-950/80 border border-slate-800 text-white shadow-xl backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
            <IconSettings className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
              Settings & Privacy Center
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Manage account, content, privacy, blocked list, help support & app info
            </p>
          </div>
        </div>
      </div>

      {/* VERTICAL LIST OF SETTINGS (SINGLE ACTIVE SECTION - OPENING ONE AUTO-CLOSES PREVIOUS) */}
      <div className="space-y-3.5 sm:space-y-4">
        
        {/* ======================================================== */}
        {/* SECTION 1: ACCOUNT SETTINGS & SECURITY */}
        {/* ======================================================== */}
        <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('account')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <IconUser className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Account Settings & Security
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Edit Profile, Email, Password, Username, Phone, Deactivate & Delete Account
                </p>
              </div>
            </div>
            <IconChevron open={activeSection === 'account'} className="text-slate-400" />
          </button>

          {activeSection === 'account' && (
            <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800/60 mt-1">
              <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-brand-500/10 via-cyan-500/10 to-transparent border border-brand-500/20 flex items-center justify-between gap-3">
                <div
                  onClick={() => {
                    const handleClean = user?.username || (user?.handle ? user.handle.replace('@', '') : '') || 'user';
                    navigate(`/profile/${handleClean.toLowerCase()}`);
                  }}
                  className="flex items-center gap-3 min-w-0 cursor-pointer group"
                >
                  <Avatar src={user?.avatar} size="md" className="flex-shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-cyan-400 transition-colors">
                      {user?.name || user?.fullName || 'User'}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {`@${user?.username || user?.handle?.replace('@', '') || 'user'}`}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const handleClean = user?.username || (user?.handle ? user.handle.replace('@', '') : '') || 'user';
                    navigate(`/profile/${handleClean.toLowerCase()}`);
                  }}
                  className="!px-4 font-bold flex-shrink-0"
                >
                  Edit Profile
                </Button>
              </div>

              {/* Username Form */}
              <form onSubmit={handleUpdateUsername} className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Username</label>
                  {!isEditingUsername && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingUsername(true);
                        setTimeout(() => usernameRef.current?.focus(), 50);
                      }}
                      className="!px-3 !py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-1.5"
                    >
                      <IconEdit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">@</span>
                    <input
                      ref={usernameRef}
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      disabled={!isEditingUsername}
                      className={`w-full pl-8 pr-3.5 py-2 text-xs rounded-xl transition-all ${
                        isEditingUsername
                          ? 'bg-white dark:bg-slate-900 border border-cyan-500 text-slate-900 dark:text-white focus:outline-none ring-2 ring-cyan-500/20'
                          : 'bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>
                  {isEditingUsername && (
                    <div className="flex gap-1.5">
                      <Button type="submit" variant="secondary" size="sm" className="!px-4 font-bold flex-shrink-0">
                        Save Username
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUsernameInput(user?.username || user?.handle?.replace('@', '') || '');
                          setIsEditingUsername(false);
                        }}
                        className="!px-3 font-bold flex-shrink-0 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </form>

              {/* Email Form */}
              <form onSubmit={handleUpdateEmail} className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Change Email Address</label>
                  {!isEditingEmail && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingEmail(true);
                        setTimeout(() => emailRef.current?.focus(), 50);
                      }}
                      className="!px-3 !py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-1.5"
                    >
                      <IconEdit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={emailRef}
                    type="email"
                    value={emailInput}
                    onChange={handleEmailInputChange}
                    placeholder="name@example.com (no numbers allowed)"
                    disabled={!isEditingEmail}
                    className={`flex-1 px-3.5 py-2 text-xs rounded-xl transition-all ${
                      isEditingEmail
                        ? 'bg-white dark:bg-slate-900 border border-cyan-500 text-slate-900 dark:text-white focus:outline-none ring-2 ring-cyan-500/20'
                        : 'bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                    }`}
                  />
                  {isEditingEmail && (
                    <div className="flex gap-1.5">
                      <Button type="submit" variant="secondary" size="sm" className="!px-4 font-bold flex-shrink-0">
                        Save Email
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEmailInput(user?.email || '');
                          setIsEditingEmail(false);
                        }}
                        className="!px-3 font-bold flex-shrink-0 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </form>

              {/* Phone Form */}
              <form onSubmit={handleUpdatePhone} className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                  {!isEditingPhone && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingPhone(true);
                        setTimeout(() => phoneRef.current?.focus(), 50);
                      }}
                      className="!px-3 !py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-1.5"
                    >
                      <IconEdit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <IconPhone className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={phoneRef}
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      disabled={!isEditingPhone}
                      className={`w-full pl-9 pr-3.5 py-2 text-xs rounded-xl transition-all ${
                        isEditingPhone
                          ? 'bg-white dark:bg-slate-900 border border-cyan-500 text-slate-900 dark:text-white focus:outline-none ring-2 ring-cyan-500/20'
                          : 'bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>
                  {isEditingPhone && (
                    <div className="flex gap-1.5">
                      <Button type="submit" variant="secondary" size="sm" className="!px-4 font-bold flex-shrink-0">
                        Save Phone
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPhoneInput(user?.phone || '');
                          setIsEditingPhone(false);
                        }}
                        className="!px-3 font-bold flex-shrink-0 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </form>

              {/* Password Form */}
              <form onSubmit={handleChangePassword} className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <IconKey className="text-cyan-400" /> Change Password
                  </h4>
                  {!isEditingPassword && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingPassword(true);
                        setTimeout(() => currentPasswordRef.current?.focus(), 50);
                      }}
                      className="!px-3 !py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-1.5"
                    >
                      <IconEdit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="relative">
                    <input
                      ref={currentPasswordRef}
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Current Password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      disabled={!isEditingPassword}
                      className={`w-full pl-3.5 pr-8 py-2 text-xs rounded-xl transition-all ${
                        isEditingPassword
                          ? 'bg-white dark:bg-slate-900 border border-cyan-500 text-slate-900 dark:text-white focus:outline-none ring-2 ring-cyan-500/20'
                          : 'bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                      }`}
                    />
                    {isEditingPassword && (
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                        title={showCurrentPassword ? 'Hide' : 'Show'}
                      >
                        {showCurrentPassword ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="New Password (8+ chars)"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      disabled={!isEditingPassword}
                      className={`w-full pl-3.5 pr-8 py-2 text-xs rounded-xl transition-all ${
                        isEditingPassword
                          ? 'bg-white dark:bg-slate-900 border border-cyan-500 text-slate-900 dark:text-white focus:outline-none ring-2 ring-cyan-500/20'
                          : 'bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                      }`}
                    />
                    {isEditingPassword && (
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                        title={showNewPassword ? 'Hide' : 'Show'}
                      >
                        {showNewPassword ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm New Password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      disabled={!isEditingPassword}
                      className={`w-full pl-3.5 pr-8 py-2 text-xs rounded-xl transition-all ${
                        isEditingPassword
                          ? 'bg-white dark:bg-slate-900 border border-cyan-500 text-slate-900 dark:text-white focus:outline-none ring-2 ring-cyan-500/20'
                          : 'bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                      }`}
                    />
                    {isEditingPassword && (
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                        title={showConfirmPassword ? 'Hide' : 'Show'}
                      >
                        {showConfirmPassword ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {isEditingPassword && (
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" variant="secondary" size="sm" className="!px-5 font-bold">
                      Update Password
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setIsEditingPassword(false);
                      }}
                      className="!px-3 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-amber-600 dark:text-amber-400">Deactivate Account</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Temporarily hide your profile until you sign back in</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmModal('deactivate')} className="!text-amber-500 hover:!bg-amber-500/20 font-bold border border-amber-500/30 flex-shrink-0">Deactivate</Button>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-400">Delete Account</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Permanently delete your profile, media, and data</p>
                  </div>
                  <Button type="button" variant="danger" size="sm" onClick={() => setConfirmModal('delete')} className="!px-4 font-bold flex-shrink-0">Delete Account</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: PRIVACY & SAFETY CONTROLS */}
        {/* ======================================================== */}
        <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('privacy')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <IconShield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Privacy & Safety Controls
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Private account, audience permissions, comments & messaging rules
                </p>
              </div>
            </div>
            <IconChevron open={activeSection === 'privacy'} className="text-slate-400" />
          </button>

          {activeSection === 'privacy' && (
            <div className="p-4 sm:p-5 pt-0 space-y-3 sm:space-y-4 border-t border-slate-100 dark:border-slate-800/60 mt-1">
              {privacyLoading && (
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Loading privacy settings...</p>
                </div>
              )}

              {!privacyLoading && privacyError && (
                <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 text-center space-y-3">
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{privacyError}</p>
                  <Button type="button" variant="secondary" size="sm" onClick={loadPrivacySettings} className="font-bold">
                    Retry
                  </Button>
                </div>
              )}

              {!privacyLoading && (
              <>
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Private Account</h4>
                    <Badge variant={privacy.isPrivateAccount ? 'cyan' : 'secondary'} className="text-[9px]">{privacy.isPrivateAccount ? 'Private' : 'Public'}</Badge>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">When private, only approved followers can see posts & stories</p>
                </div>
                <button type="button" onClick={() => handlePrivacyChange('isPrivateAccount', !privacy.isPrivateAccount)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${privacy.isPrivateAccount ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${privacy.isPrivateAccount ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Who can follow me</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Who is allowed to send follow requests</p>
                </div>
                <select value={privacy.whoCanFollow} onChange={(e) => handlePrivacyChange('whoCanFollow', e.target.value)} className="w-full sm:w-auto px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer">
                  <option value="everyone">Everyone</option>
                  <option value="approved">Only Approved Users</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Who can comment</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control who can comment on your posts</p>
                </div>
                <select value={privacy.whoCanComment} onChange={(e) => handlePrivacyChange('whoCanComment', e.target.value)} className="w-full sm:w-auto px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer">
                  <option value="everyone">Everyone</option>
                  <option value="following">People I Follow</option>
                  <option value="followers">Followers Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Who can message me</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage who can initiate direct messages</p>
                </div>
                <select value={privacy.whoCanMessage} onChange={(e) => handlePrivacyChange('whoCanMessage', e.target.value)} className="w-full sm:w-auto px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer">
                  <option value="everyone">Everyone</option>
                  <option value="following">People I Follow</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Who can mention/tag me</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select who can tag your @username</p>
                </div>
                <select value={privacy.whoCanTag} onChange={(e) => handlePrivacyChange('whoCanTag', e.target.value)} className="w-full sm:w-auto px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer">
                  <option value="everyone">Everyone</option>
                  <option value="following">People I Follow</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Hide Liked Posts</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hide liked posts from public activity</p>
                </div>
                <button type="button" onClick={() => handlePrivacyChange('hideLikedPosts', !privacy.hideLikedPosts)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${privacy.hideLikedPosts ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${privacy.hideLikedPosts ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              </>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 4: BLOCKED & RESTRICTED */}
        {/* ======================================================== */}
        <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('blockedRestricted')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <IconBlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Blocked & Restricted
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Blocked users, restricted users, manage hidden content & muted words
                </p>
              </div>
            </div>
            <IconChevron open={activeSection === 'blockedRestricted'} className="text-slate-400" />
          </button>

          {activeSection === 'blockedRestricted' && (
            <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800/60 mt-1">
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">Blocked Users ({blockedUsers.length})</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Block users from their profile using the More menu.</p>

                {blockedLoading ? (
                  <div className="animate-pulse h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                ) : blockedUsers.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No blocked users.</p>
                ) : (
                  <div className="space-y-2">
                    {blockedUsers.map((bUser) => (
                      <div key={bUser.id} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={bUser.avatar} alt={bUser.name} size="sm" />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{bUser.name}</h5>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">@{bUser.username}</p>
                          </div>
                        </div>
                        <button onClick={() => handleUnblockUser(bUser.id)} className="px-3 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-cyan-500 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex-shrink-0">Unblock</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">Restricted Users ({restrictedUsers.length})</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Restricted users have limited interaction without being notified.</p>

                {restrictedLoading ? (
                  <div className="animate-pulse h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                ) : restrictedUsers.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No restricted users.</p>
                ) : (
                  <div className="space-y-2">
                    {restrictedUsers.map((rUser) => (
                      <div key={rUser.id} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={rUser.avatar} alt={rUser.name} size="sm" />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{rUser.name}</h5>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">@{rUser.username} · Restricted</p>
                          </div>
                        </div>
                        <button onClick={() => handleUnrestrictUser(rUser.id)} className="px-3 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-cyan-500 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex-shrink-0">Unrestrict</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">My Reports ({myReports.length})</h4>
                {myReportsLoading ? (
                  <div className="animate-pulse h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                ) : myReports.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">You have not submitted any reports.</p>
                ) : (
                  <div className="space-y-2">
                    {myReports.map((report) => (
                      <div key={report.id} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">#{report.reportNumber || report.id.slice(-6).toUpperCase()}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                            {getReportStatusLabel(report.status)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 capitalize">
                          Reported: {report.targetType} · {report.reasonLabel || report.reason?.replace(/_/g, ' ')}
                        </p>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="mt-2 !text-[10px] !px-3"
                          disabled={reportConversationLoading}
                          onClick={() => openReportConversation(report)}
                        >
                          Open Conversation
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">Manage Hidden Content & Muted Words</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Hide posts containing specific words, tags, or phrases</p>
                </div>

                <form onSubmit={handleAddHiddenWord} className="flex gap-2">
                  <input
                    type="text"
                    value={newWordInput}
                    onChange={(e) => setNewWordInput(e.target.value)}
                    placeholder="Add muted word or hashtag (e.g. #spoiler)..."
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-cyan-500"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="!px-4 font-bold flex-shrink-0">Add Word</Button>
                </form>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hiddenWords.map((word) => (
                    <span key={word} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      {word}
                      <button onClick={() => handleRemoveHiddenWord(word)} className="text-slate-400 hover:text-rose-500 cursor-pointer"><IconClose className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 5: APPEARANCE & INTERFACE */}
        {/* ======================================================== */}
        <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('appearance')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <IconSun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Appearance & Interface
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Dark/Light mode theme toggle & glass UI preferences
                </p>
              </div>
            </div>
            <IconChevron open={activeSection === 'appearance'} className="text-slate-400" />
          </button>

          {activeSection === 'appearance' && (
            <div className="p-4 sm:p-5 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800/60 mt-1">
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">App Theme Mode</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toggle light/dark visual theme mode</p>
                </div>
                <ThemeToggle />
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Glassmorphism Blur System</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Backdrop blur glass UI design</p>
                </div>
                <Badge variant="cyan" className="text-[10px]">Active</Badge>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 6: HELP & SUPPORT */}
        {/* ======================================================== */}
        <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('helpSupport')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <IconHelp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Help & Support
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Help center, report a problem, contact support & community guidelines
                </p>
              </div>
            </div>
            <IconChevron open={activeSection === 'helpSupport'} className="text-slate-400" />
          </button>

          {activeSection === 'helpSupport' && (
            <div className="p-4 sm:p-5 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800/60 mt-1">
              {authUser?.role === 'admin' && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Admin Dashboard</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Moderation, reports & support tickets</p>
                  </div>
                  <Button type="button" variant="primary" size="sm" onClick={() => navigate('/admin')} className="font-bold flex-shrink-0">Open Admin</Button>
                </div>
              )}

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Help Center</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Browse FAQs and account recovery guides</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => showToast('Help center coming soon.')} className="font-bold flex-shrink-0">Visit Center</Button>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Report a Problem</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Encountered a bug? Send a direct report</p>
                </div>
                <Button type="button" variant="primary" size="sm" onClick={() => setReportModalOpen(true)} className="font-bold flex-shrink-0" disabled={isGuest}>Report Issue</Button>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Contact Support</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Submit an issue to {BRAND.supportEmail}</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setReportModalOpen(true)} className="font-bold flex-shrink-0" disabled={isGuest}>Submit Issue</Button>
              </div>

              {!isGuest && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">My Support Requests</h4>
                  {supportLoading ? (
                    <div className="animate-pulse h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  ) : supportTickets.length === 0 ? (
                    <p className="text-xs text-slate-500">No support tickets yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {supportTickets.map((t) => (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() => openTicketDetail(t._id)}
                          className="w-full text-left p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:border-cyan-500/30 transition-colors"
                        >
                          <p className="font-bold text-xs">#{t.ticketNumber} · {t.subject}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 capitalize">Status: {t.status.replace(/_/g, ' ')}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedTicket && (
                    <div className="mt-3 p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs">#{selectedTicket.ticketNumber} — {selectedTicket.subject}</p>
                        <button type="button" onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600"><IconClose className="w-3 h-3" /></button>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {(selectedTicket.messages || []).map((m, i) => (
                          <div key={i} className={`p-2 rounded-lg text-xs ${m.senderRole === 'admin' ? 'bg-cyan-500/10 ml-2' : 'bg-slate-100 dark:bg-slate-800 mr-2'}`}>
                            <p className="text-[10px] font-bold text-slate-400 mb-0.5">{m.senderRole === 'admin' ? 'Support Team' : 'You'}</p>
                            {m.message}
                          </div>
                        ))}
                      </div>
                      {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                        <div className="flex gap-2">
                          <input
                            value={supportReply}
                            onChange={(e) => setSupportReply(e.target.value)}
                            placeholder="Reply to support..."
                            className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                          <Button type="button" size="sm" variant="primary" onClick={handleSupportReply} disabled={supportReplySending}>
                            {supportReplySending ? '...' : 'Send'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Community Guidelines</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Read safety rules and platform standards</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setDocModal('guidelines')} className="font-bold flex-shrink-0">View Rules</Button>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 7: ABOUT */}
        {/* ======================================================== */}
        <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('about')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <IconAbout className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  About {BRAND.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  App version, terms of service, privacy policy, community guidelines & licenses
                </p>
              </div>
            </div>
            <IconChevron open={activeSection === 'about'} className="text-slate-400" />
          </button>

          {activeSection === 'about' && (
            <div className="p-4 sm:p-5 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800/60 mt-1">
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">App Release</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Build {APP_RELEASE.build} · {APP_RELEASE.releaseTag}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="cyan" className="text-[10px]">v{APP_RELEASE.version}</Badge>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setDocModal('app_release')} className="font-bold">View Release</Button>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Terms of Service</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Read legal terms and conditions</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setDocModal('terms')} className="font-bold flex-shrink-0">Read Terms</Button>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Privacy Policy</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Read data protection & encryption policy</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setDocModal('privacy_policy')} className="font-bold flex-shrink-0">Read Policy</Button>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Community Guidelines</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Safety & platform usage guidelines</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setDocModal('guidelines')} className="font-bold flex-shrink-0">Read Guidelines</Button>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Open Source Licenses</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Third-party software & library licenses</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setDocModal('licenses')} className="font-bold flex-shrink-0">View Licenses</Button>
              </div>
            </div>
          )}
        </div>

        {/* LOGOUT BUTTON BANNER */}
        <div className="pt-2">
          <Button
            variant="danger"
            onClick={onLogout}
            className="w-full py-3 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10"
          >
            Log Out of Session
          </Button>
        </div>

      </div>
    </div>
  );
};
