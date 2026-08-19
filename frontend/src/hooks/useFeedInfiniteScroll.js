import { useEffect, useRef, useCallback } from 'react';

/**
 * Prefetches the next feed page before the sentinel reaches the viewport.
 *
 * Uses two triggers on purpose: an IntersectionObserver for the normal case, and
 * a passive scroll measurement as a fallback. During very fast flings the browser
 * can deliver observer callbacks late (or coalesce them), which is how the user
 * ends up scrolled past the last loaded post before any fetch started.
 */
export function useFeedInfiniteScroll({
  enabled = true,
  hasMore = false,
  loading = false,
  onLoadMore,
  scrollRootRef,
  rootMargin = '600px 0px',
  prefetchPx = 800,
}) {
  const sentinelRef = useRef(null);

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const maybeLoadMore = useCallback(() => {
    if (!enabledRef.current || !hasMoreRef.current || loadingRef.current) return;
    onLoadMore?.();
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!enabled || !hasMore || !sentinel) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) maybeLoadMore();
      },
      { root: scrollRootRef?.current || null, rootMargin, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, hasMore, maybeLoadMore, scrollRootRef, rootMargin]);

  useEffect(() => {
    if (!enabled || !hasMore) return undefined;

    const root = scrollRootRef?.current;
    const target = root || window;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const sentinel = sentinelRef.current;
      if (!sentinel) return;

      const sentinelTop = sentinel.getBoundingClientRect().top;
      const viewportBottom = root ? root.getBoundingClientRect().bottom : window.innerHeight;

      if (sentinelTop - viewportBottom < prefetchPx) maybeLoadMore();
    };

    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    target.addEventListener('scroll', handleScroll, { passive: true });
    // Re-measuring when a fetch settles keeps filling while the sentinel is still
    // close. Server-side visibility filtering can return a short (or empty) page,
    // and without this the loop would stall and leave the user at bare space.
    measure();

    return () => {
      target.removeEventListener('scroll', handleScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled, hasMore, loading, maybeLoadMore, scrollRootRef, prefetchPx]);

  return sentinelRef;
}

export default useFeedInfiniteScroll;
