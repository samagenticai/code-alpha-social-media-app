/**
 * Merge incoming feed posts with existing ones, preserving object references
 * when media/content is unchanged — prevents video remounts during polling sync.
 */
export function mergeFeedPosts(prevPosts, nextPosts) {
  if (!Array.isArray(nextPosts) || nextPosts.length === 0) {
    return prevPosts.length ? prevPosts : nextPosts;
  }
  if (!Array.isArray(prevPosts) || prevPosts.length === 0) {
    return nextPosts;
  }

  const prevById = new Map(
    prevPosts.map((p) => [String(p.id || p._id), p])
  );

  return nextPosts.map((next) => mergePostRecord(prevById.get(String(next.id || next._id)), next));
}

/** Sync poll — update matching posts only; never drop paginated items */
export function mergeFeedSync(prevPosts, syncedPosts) {
  if (!Array.isArray(prevPosts) || prevPosts.length === 0) {
    return syncedPosts || [];
  }
  if (!Array.isArray(syncedPosts) || syncedPosts.length === 0) {
    return prevPosts;
  }

  const syncedById = new Map(
    syncedPosts.map((p) => [String(p.id || p._id), p])
  );

  return prevPosts.map((prev) => {
    const id = String(prev.id || prev._id);
    const next = syncedById.get(id);
    return next ? mergePostRecord(prev, next) : prev;
  });
}

/** Append next page — skip duplicates by post id */
export function appendFeedPosts(prevPosts, nextPosts) {
  if (!Array.isArray(nextPosts) || nextPosts.length === 0) {
    return prevPosts;
  }
  if (!Array.isArray(prevPosts) || prevPosts.length === 0) {
    return nextPosts;
  }

  const existingIds = new Set(prevPosts.map((p) => String(p.id || p._id)));
  const toAdd = nextPosts.filter((p) => !existingIds.has(String(p.id || p._id)));
  return toAdd.length ? [...prevPosts, ...toAdd] : prevPosts;
}

/** Merge one post update while preserving media object refs when unchanged */
export function mergePostRecord(prev, next) {
  if (!prev) return next;
  if (!next) return prev;

  const mediaUnchanged =
    prev.videoUrl === next.videoUrl &&
    prev.content === next.content &&
    prev.thumbnailUrl === next.thumbnailUrl &&
    JSON.stringify(prev.images || []) === JSON.stringify(next.images || []) &&
    JSON.stringify(prev.video || null) === JSON.stringify(next.video || null) &&
    JSON.stringify(prev.media || null) === JSON.stringify(next.media || null);

  if (mediaUnchanged) {
    return {
      ...prev,
      likesCount: next.likesCount ?? prev.likesCount,
      commentsCount: next.commentsCount ?? prev.commentsCount,
      sharesCount: next.sharesCount ?? prev.sharesCount,
      savesCount: next.savesCount ?? prev.savesCount,
      isLiked: next.isLiked ?? prev.isLiked,
      isSaved: next.isSaved ?? prev.isSaved,
      isFollowing: next.isFollowing ?? prev.isFollowing,
      user: next.user ? { ...prev.user, ...next.user } : prev.user,
      comments:
        (next.comments?.length ?? 0) !== (prev.comments?.length ?? 0)
          ? next.comments
          : prev.comments,
    };
  }

  return { ...prev, ...next };
}

export default mergeFeedPosts;
