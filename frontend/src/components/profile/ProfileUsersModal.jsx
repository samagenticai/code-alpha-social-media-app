import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { FollowButton } from './FollowButton';
import { userService } from '../../services/userService';
import { useTheme } from '../../context/ThemeContext';

export const ProfileUsersModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  loadUsers,
  currentUserId,
  isGuest,
  onRequireAuth,
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followState, setFollowState] = useState({});

  useEffect(() => {
    if (!isOpen || !loadUsers) return;

    let mounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await loadUsers();
        if (mounted) {
          const list = res.users || res.data || [];
          setUsers(list);
          const initial = {};
          list.forEach((u) => {
            initial[u.id] = u.isFollowing ?? false;
          });
          setFollowState(initial);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      mounted = false;
    };
  }, [isOpen, loadUsers]);

  const handleUserClick = (user) => {
    const uname = user.username || user.handle?.replace('@', '');
    if (uname) {
      onClose();
      navigate(`/profile/${uname}`);
    }
  };

  const handleToggleFollow = async (userId) => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    const isCur = Boolean(followState[userId]);
    setFollowState((prev) => ({ ...prev, [userId]: !isCur }));
    try {
      const res = await userService.toggleFollowUser(userId);
      setFollowState((prev) => ({ ...prev, [userId]: Boolean(res.isFollowing) }));
    } catch (err) {
      setFollowState((prev) => ({ ...prev, [userId]: isCur }));
      console.error('Follow toggle failed:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-3">
        {subtitle && (
          <p className="text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{subtitle}</p>
        )}

        <div className="max-h-80 overflow-y-auto no-scrollbar space-y-1.5">
          {loading && (
            <p className="text-xs text-center py-6" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Loading...</p>
          )}
          {!loading && users.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>No users to show yet.</p>
          )}
          {!loading &&
            users.map((user) => {
              const userId = user.id || user._id;
              const isSelf = currentUserId && userId?.toString() === currentUserId.toString();
              return (
                <div
                  key={userId}
                  className="flex items-center gap-3 p-2.5 rounded-xl transition-all border"
                  style={{
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleUserClick(user)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <Avatar
                      src={user.avatar || user.profileImage}
                      alt={user.fullName || user.name}
                      size="md"
                      className="!w-10 !h-10 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                        {user.fullName || user.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        @{user.username || 'user'}
                      </p>
                      {user.title && (
                        <p className="text-[11px] font-medium truncate mt-0.5" style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>
                          {user.title}
                        </p>
                      )}
                    </div>
                  </button>
                  {!isSelf && (
                    <FollowButton
                      isFollowing={Boolean(followState[userId])}
                      onToggleFollow={() => handleToggleFollow(userId)}
                      className="!px-3 !py-1.5 flex-shrink-0"
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </Modal>
  );
};
