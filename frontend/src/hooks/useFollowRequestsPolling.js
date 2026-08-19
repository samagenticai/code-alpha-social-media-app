import { useCallback } from 'react';
import { followRequestService } from '../services/followRequestService';
import { usePolling } from './usePolling';

const FOLLOW_REQUESTS_INTERVAL_MS = 3000;

export const useFollowRequestCountPolling = (onCountChange, enabled = true) => {
  const poll = useCallback(async () => {
    try {
      const res = await followRequestService.getFollowRequestCount();
      onCountChange?.(res.count || 0);
    } catch {
      onCountChange?.(0);
    }
  }, [onCountChange]);

  usePolling(poll, FOLLOW_REQUESTS_INTERVAL_MS, enabled);
};

export const useFollowRequestsPolling = ({
  onSync,
  enabled = true,
}) => {
  const poll = useCallback(async () => {
    try {
      const res = await followRequestService.getFollowRequests();
      onSync?.({
        requests: res.requests || [],
        count: res.count || 0,
        error: null,
      });
    } catch (err) {
      onSync?.({
        error: err.message || 'Failed to load follow requests.',
      });
    }
  }, [onSync]);

  usePolling(poll, FOLLOW_REQUESTS_INTERVAL_MS, enabled);
};

export default useFollowRequestsPolling;
