import { useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { usePolling } from './usePolling';

const NOTIFICATIONS_INTERVAL_MS = 5000;

export const useNotificationsPolling = ({
  onSync,
  enabled = true,
}) => {
  const poll = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications();
      onSync?.({
        notifications: res.notifications || [],
        unreadCount: typeof res.unreadCount === 'number' ? res.unreadCount : 0,
        error: null,
      });
    } catch (err) {
      onSync?.({
        error: err.message || 'Failed to load notifications.',
      });
    }
  }, [onSync]);

  usePolling(poll, NOTIFICATIONS_INTERVAL_MS, enabled);
};

export default useNotificationsPolling;
