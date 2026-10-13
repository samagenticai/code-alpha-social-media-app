/**
 * Navigation utilities for safe in-app profile routing.
 * Prevents unauthorized manual address-bar URL manipulation.
 */

let authorizedProfileAccess = null;

export const navigateToUserProfile = (navigate, rawUsername) => {
  if (!rawUsername || !navigate) return;
  const username = String(rawUsername).replace('@', '').trim().toLowerCase();

  authorizedProfileAccess = {
    username,
    timestamp: Date.now(),
  };

  navigate(`/profile/${username}`, {
    state: {
      fromApp: true,
      targetUser: username,
      ts: Date.now(),
    },
  });
};

export const verifyInAppProfileAccess = (targetUsername, locationState) => {
  if (!targetUsername) return false;
  const cleanTarget = String(targetUsername).replace('@', '').trim().toLowerCase();

  // 1. Check router state (passed during in-app navigation)
  if (locationState?.fromApp && locationState?.targetUser === cleanTarget) {
    return true;
  }

  // 2. Check in-memory navigation token (valid for recent click)
  if (
    authorizedProfileAccess &&
    authorizedProfileAccess.username === cleanTarget &&
    Date.now() - authorizedProfileAccess.timestamp < 15000
  ) {
    return true;
  }

  return false;
};
