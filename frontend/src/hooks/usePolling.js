import { useEffect, useRef } from 'react';

/**
 * Reusable polling hook with tab visibility optimization.
 * Fetches immediately on mount/enable, polls on interval while tab is visible,
 * pauses when hidden, and refetches when tab becomes visible again.
 */
export const usePolling = (callback, intervalMs, enabled = true) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return undefined;

    let intervalId = null;

    const tick = () => {
      callbackRef.current();
    };

    const start = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(tick, intervalMs);
    };

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        tick();
        start();
      }
    };

    tick();
    if (!document.hidden) {
      start();
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intervalMs, enabled]);
};

export default usePolling;
