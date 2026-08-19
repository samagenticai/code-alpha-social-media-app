import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';

export const LikersModal = ({ isOpen, onClose, likers, loading }) => {
  const navigate = useNavigate();

  const handleUserClick = (liker) => {
    const username = liker.username || liker.handle?.replace('@', '');
    if (username) {
      onClose();
      navigate(`/profile/${username}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="People who liked this">
      <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
        {loading && (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">Loading...</p>
        )}
        {!loading && likers.length === 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No likes yet.</p>
        )}
        {!loading &&
          likers.map((liker) => (
            <button
              key={liker.id || liker.username}
              type="button"
              onClick={() => handleUserClick(liker)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
            >
              <Avatar
                src={liker.avatar || liker.profileImage}
                alt={liker.name || liker.fullName}
                size="md"
                className="!w-10 !h-10"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {liker.fullName || liker.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  @{liker.username || 'user'}
                </p>
                {liker.title && (
                  <p className="text-[11px] text-brand-600 dark:text-cyan-400 truncate mt-0.5">{liker.title}</p>
                )}
              </div>
            </button>
          ))}
      </div>
    </Modal>
  );
};
