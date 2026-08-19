import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';

import { readStoredValue, writeStoredValue, removeStoredValue, BRAND } from '../config/brand';

const GUEST_KEY = `${BRAND.storagePrefix}_guest`;
const GUEST_REMINDER_MS = 4 * 60 * 1000;

/** Preserve role exactly as returned by the API — never downgrade admin to user. */
const normalizeAuthUser = (apiUser) => {
  if (!apiUser || typeof apiUser !== 'object') return null;
  return {
    ...apiUser,
    role: apiUser.role === 'admin' ? 'admin' : (apiUser.role || 'user'),
  };
};

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [guestReminderOpen, setGuestReminderOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const guestTimerRef = useRef(null);

  const isAuthenticated = !!user;

  const clearGuestTimer = useCallback(() => {
    if (guestTimerRef.current) {
      clearTimeout(guestTimerRef.current);
      guestTimerRef.current = null;
    }
  }, []);

  const startGuestReminderTimer = useCallback(() => {
    clearGuestTimer();
    guestTimerRef.current = setTimeout(() => {
      setGuestReminderOpen(true);
    }, GUEST_REMINDER_MS);
  }, [clearGuestTimer]);

  const enterGuestMode = useCallback(() => {
    sessionStorage.setItem(GUEST_KEY, 'true');
    setIsGuest(true);
    setUser(null);
    startGuestReminderTimer();
  }, [startGuestReminderTimer]);

  const exitGuestMode = useCallback(() => {
    sessionStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    clearGuestTimer();
    setGuestReminderOpen(false);
  }, [clearGuestTimer]);

  const openAuthModal = useCallback((mode = 'login') => {
    setAuthModalMode(mode);
    setAuthError('');
    setAuthSuccess('');
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setAuthError('');
    setAuthSuccess('');
  }, []);

  const requireAuth = useCallback(
    (callback) => {
      if (isAuthenticated) {
        callback?.();
        return true;
      }
      openAuthModal('login');
      return false;
    },
    [isAuthenticated, openAuthModal]
  );

  const checkAuth = useCallback(async () => {
    const deactivatedUntil = readStoredValue('deactivated_until');
    if (deactivatedUntil) {
      const remainingMs = parseInt(deactivatedUntil, 10) - Date.now();
      if (remainingMs > 0) {
        localStorage.removeItem('token');
        setUser(null);
        return null;
      } else {
        removeStoredValue('deactivated_until');
      }
    }

    try {
      const { data } = await authService.getMe();
      const normalized = normalizeAuthUser(data.user);
      setUser(normalized);
      exitGuestMode();
      return normalized;
    } catch {
      setUser(null);
      return null;
    }
  }, [exitGuestMode]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const authenticatedUser = await checkAuth();

      if (!authenticatedUser) {
        const guestFlag = sessionStorage.getItem(GUEST_KEY) === 'true';
        setIsGuest(guestFlag);
        if (guestFlag) {
          startGuestReminderTimer();
        }
      }

      setIsLoading(false);
    };

    init();

    return () => clearGuestTimer();
  }, [checkAuth, clearGuestTimer, startGuestReminderTimer]);

  const register = async (formData) => {
    setAuthError('');
    setAuthSuccess('');
    try {
      const { data } = await authService.register(formData);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      const normalized = normalizeAuthUser(data.user);
      setUser(normalized);
      exitGuestMode();
      setAuthSuccess(data.message);
      closeAuthModal();
      return { success: true, user: normalized };
    } catch (error) {
      setAuthError(error.message);
      return { success: false, message: error.message };
    }
  };

  const login = async (formData) => {
    setAuthError('');
    setAuthSuccess('');

    const deactivatedUntil = readStoredValue('deactivated_until');
    if (deactivatedUntil) {
      const remainingMs = parseInt(deactivatedUntil, 10) - Date.now();
      if (remainingMs > 0) {
        const remainingMins = Math.floor(remainingMs / 60000);
        const remainingSecs = Math.ceil((remainingMs % 60000) / 1000);
        const timeStr = remainingMins > 0 
          ? `${remainingMins}m ${remainingSecs}s`
          : `${remainingSecs}s`;
        const errorMsg = `Account is deactivated for 5 minutes. Please wait ${timeStr} before logging in.`;
        setAuthError(errorMsg);
        return { success: false, message: errorMsg };
      } else {
        removeStoredValue('deactivated_until');
      }
    }

    try {
      const { data } = await authService.login(formData);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      const normalized = normalizeAuthUser(data.user);
      setUser(normalized);
      exitGuestMode();
      setAuthSuccess(data.message);
      closeAuthModal();
      setGuestReminderOpen(false);
      return { success: true, user: normalized };
    } catch (error) {
      setAuthError(error.message);
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Clear local state even if server call fails
    }
    localStorage.removeItem('token');
    setUser(null);
    sessionStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    clearGuestTimer();
  };

  const updateUser = useCallback((updatedData) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const newUsername = updatedData.username || (updatedData.handle ? updatedData.handle.replace('@', '') : prevUser.username);
      const newHandle = `@${newUsername}`;
      return {
        ...prevUser,
        fullName: updatedData.name || updatedData.fullName || prevUser.fullName,
        name: updatedData.name || updatedData.fullName || prevUser.name,
        username: newUsername,
        handle: newHandle,
        email: updatedData.email || prevUser.email,
        phone: updatedData.phone !== undefined ? updatedData.phone : prevUser.phone,
        isPrivate: updatedData.isPrivate !== undefined ? Boolean(updatedData.isPrivate) : Boolean(prevUser.isPrivate),
        bio: updatedData.bio !== undefined ? updatedData.bio : prevUser.bio,
        profileImage: updatedData.avatar || updatedData.profileImage || prevUser.profileImage,
        avatar: updatedData.avatar || updatedData.profileImage || prevUser.avatar,
        coverImage: updatedData.coverImage || prevUser.coverImage,
        title: updatedData.job !== undefined ? updatedData.job : (updatedData.title !== undefined ? updatedData.title : prevUser.title),
        job: updatedData.job !== undefined ? updatedData.job : (updatedData.title !== undefined ? updatedData.title : prevUser.job),
        location: updatedData.city !== undefined ? updatedData.city : (updatedData.location !== undefined ? updatedData.location : prevUser.location),
        city: updatedData.city !== undefined ? updatedData.city : (updatedData.location !== undefined ? updatedData.location : prevUser.city),
        maritalStatus: updatedData.maritalStatus !== undefined ? updatedData.maritalStatus : prevUser.maritalStatus,
        dateOfBirth: updatedData.dateOfBirth !== undefined ? updatedData.dateOfBirth : prevUser.dateOfBirth,
        school: updatedData.school !== undefined ? updatedData.school : prevUser.school,
        college: updatedData.college !== undefined ? updatedData.college : prevUser.college,
        university: updatedData.university !== undefined ? updatedData.university : prevUser.university,
        education: {
          school: updatedData.school || updatedData.education?.school || prevUser.school || '',
          college: updatedData.college || updatedData.education?.college || prevUser.college || '',
          university: updatedData.university || updatedData.education?.university || prevUser.university || '',
        },
        role: updatedData.role !== undefined ? updatedData.role : prevUser.role,
        privacy: updatedData.privacy !== undefined
          ? { ...(prevUser.privacy || {}), ...updatedData.privacy }
          : (prevUser.privacy || {
              whoCanFollow: 'everyone',
              whoCanComment: 'everyone',
              whoCanMessage: 'everyone',
              whoCanMention: 'everyone',
              hideLikedPosts: false,
            }),
      };
    });
  }, []);

  const updateUserPostsCount = useCallback((delta = 1) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      const currentCount = typeof prevUser.postsCount === 'number'
        ? prevUser.postsCount
        : (parseInt(prevUser.postsCount) || 0);
      const newCount = Math.max(0, currentCount + delta);
      return {
        ...prevUser,
        postsCount: newCount,
      };
    });
  }, []);

  const getDisplayUser = () => {
    if (user) {
      const followersCount = typeof user.followers === 'number'
        ? user.followers
        : Array.isArray(user.followers)
          ? user.followers.length
          : (user.followersCount ?? 0);

      const followingCount = typeof user.following === 'number'
        ? user.following
        : Array.isArray(user.following)
          ? user.following.length
          : (user.followingCount ?? 0);

      const avatarUrl = user.profileImage || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';
      const username = user.username || (user.handle ? user.handle.replace('@', '') : 'user');
      const handle = `@${username}`;

      const finalJob = user.job || user.title || '';
      const finalCity = user.city || user.location || '';

      return {
        id: user.id || user._id || 'usr_me',
        name: user.fullName || user.name || 'User',
        fullName: user.fullName || user.name || 'User',
        handle: handle,
        username: username,
        isPrivate: Boolean(user.isPrivate),
        avatar: avatarUrl,
        profileImage: avatarUrl,
        bio: user.bio || '',
        coverImage: user.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        verified: user.verified ?? false,
        followers: followersCount,
        followersCount: followersCount,
        following: followingCount,
        followingCount: followingCount,
        postsCount: user.postsCount || 0,
        totalLikes: user.totalLikes || 0,
        location: finalCity,
        city: finalCity,
        job: finalJob,
        maritalStatus: user.maritalStatus || '',
        dateOfBirth: user.dateOfBirth || '',
        school: user.school || '',
        college: user.college || '',
        university: user.university || '',
        education: {
          school: user.school || user.education?.school || '',
          college: user.college || user.education?.college || '',
          university: user.university || user.education?.university || '',
        },
        email: user.email || '',
        phone: user.phone || '',
        joinedDate: user.createdAt ? `Joined ${new Date(user.createdAt).getFullYear()}` : 'Joined 2024',
        title: finalJob,
        role: user.role || 'user',
        privacy: user.privacy || {
          whoCanFollow: 'everyone',
          whoCanComment: 'everyone',
          whoCanMessage: 'everyone',
          whoCanMention: 'everyone',
          hideLikedPosts: false,
        },
      };
    }
    return null;
  };

  const value = {
    user,
    displayUser: getDisplayUser(),
    isAdmin: user?.role === 'admin',
    isAuthenticated,
    isGuest,
    isLoading,
    authModalOpen,
    authModalMode,
    guestReminderOpen,
    authError,
    authSuccess,
    register,
    login,
    logout,
    updateUser,
    updateUserPostsCount,
    checkAuth,
    enterGuestMode,
    exitGuestMode,
    openAuthModal,
    closeAuthModal,
    setGuestReminderOpen,
    requireAuth,
    setAuthModalMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
