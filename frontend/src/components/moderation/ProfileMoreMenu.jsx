import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { IconDots } from '../ui/Icons';
import { ReportModal } from './ReportModal';
import { moderationService } from '../../services/moderationService';

export const ProfileMoreMenu = ({
  profile,
  onBlockChange,
  onRestrictChange,
  onRequireAuth,
  isGuest,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const menuRef = useRef(null);

  const userId = profile?.id || profile?._id;
  const displayName = profile?.name || profile?.fullName || 'User';
  const isBlockedByMe = Boolean(profile?.isBlockedByMe);
  const isRestrictedByMe = Boolean(profile?.isRestrictedByMe);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const runAuthAction = (action) => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    action();
  };

  const handleBlock = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      if (isBlockedByMe) {
        await moderationService.unblockUser(userId);
      } else {
        await moderationService.blockUser(userId);
      }
      setBlockConfirmOpen(false);
      setMenuOpen(false);
      onBlockChange?.(!isBlockedByMe);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestrict = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      if (isRestrictedByMe) {
        await moderationService.unrestrictUser(userId);
      } else {
        await moderationService.restrictUser(userId);
      }
      setMenuOpen(false);
      onRestrictChange?.(!isRestrictedByMe);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => runAuthAction(() => setMenuOpen((v) => !v))}
          className="!px-3"
          aria-label="More options"
        >
          <IconDots className="w-4 h-4" />
        </Button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 sm:w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-30 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                if (isBlockedByMe) {
                  runAuthAction(() => setBlockConfirmOpen(true));
                } else {
                  runAuthAction(() => setBlockConfirmOpen(true));
                }
              }}
              className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isBlockedByMe ? 'Unblock User' : 'Block User'}
            </button>
            {!isBlockedByMe && (
              <button
                type="button"
                onClick={() => runAuthAction(handleRestrict)}
                disabled={actionLoading}
                className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isRestrictedByMe ? 'Unrestrict User' : 'Restrict User'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                runAuthAction(() => setReportOpen(true));
              }}
              className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border-t border-slate-100 dark:border-slate-800"
            >
              Report User
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={blockConfirmOpen}
        onClose={() => !actionLoading && setBlockConfirmOpen(false)}
        title={isBlockedByMe ? 'Unblock User' : 'Block User'}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isBlockedByMe
              ? `Unblock ${displayName}? They will be able to interact with you again.`
              : 'Are you sure you want to block this user?'}
          </p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setBlockConfirmOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant={isBlockedByMe ? 'primary' : 'danger'}
              size="sm"
              onClick={handleBlock}
              disabled={actionLoading}
            >
              {actionLoading ? 'Please wait...' : isBlockedByMe ? 'Unblock' : 'Block'}
            </Button>
          </div>
        </div>
      </Modal>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="user"
        targetId={userId}
        targetLabel={displayName}
      />
    </>
  );
};

export default ProfileMoreMenu;
