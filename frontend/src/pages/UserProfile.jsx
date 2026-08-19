import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNavigation } from '../components/navigation/TopNavigation';
import { Sidebar } from '../components/navigation/Sidebar';
import { RightSidebar } from '../components/sidebar/RightSidebar';
import { BottomNavigation } from '../components/navigation/BottomNavigation';
import { CoverBanner } from '../components/profile/CoverBanner';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileInfoSection } from '../components/profile/ProfileInfoSection';
import { UserStats } from '../components/profile/UserStats';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { PostGrid } from '../components/profile/PostGrid';
import { SuggestedConnections } from '../components/profile/SuggestedConnections';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { CreatePost } from '../components/feed/CreatePost';
import { AuthModal } from '../components/auth/AuthModal';
import { GuestReminderModal } from '../components/auth/GuestReminderModal';
import { IconLock } from '../components/ui/Icons';
import { FollowButton } from '../components/profile/FollowButton';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { BrandIcon } from '../components/brand/Logo';
import { ProfileSkeleton } from '../components/ui/Skeleton';
import { usePolling } from '../hooks/usePolling';

export const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const {
    displayUser,
    isAuthenticated,
    isGuest,
    isLoading: authLoading,
    requireAuth,
    openAuthModal,
    authModalOpen,
    closeAuthModal,
    authModalMode,
    logout,
    updateUser,
    updateUserPostsCount,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('posts');
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalSection, setEditModalSection] = useState('general');
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState('profile');
  const postsSectionRef = useRef(null);

  // Determine if viewing own profile accurately
  const myUsername = (isAuthenticated && displayUser?.username)
    ? displayUser.username.toLowerCase()
    : (isAuthenticated && displayUser?.handle)
      ? displayUser.handle.replace('@', '').toLowerCase()
      : '';
  const targetUsername = username ? username.replace('@', '').toLowerCase() : (myUsername || 'alexrivera');
  const isOwner = Boolean(isAuthenticated && myUsername && targetUsername === myUsername);

  const scrollToPosts = useCallback(() => {
    setActiveTab('posts');
    setTimeout(() => {
      postsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const displayUserRef = useRef(displayUser);
  const isOwnerRef = useRef(isOwner);
  displayUserRef.current = displayUser;
  isOwnerRef.current = isOwner;

  const samePostId = useCallback((item, postId) => {
    const id = item?.id ?? item?._id;
    return String(id) === String(postId);
  }, []);

  const loadProfileData = useCallback(async (showLoading = false, { clearPosts = false } = {}) => {
    if (showLoading) setLoadingProfile(true);
    if (clearPosts || showLoading) {
      setPostsLoading(true);
      setPostsError(null);
    }

    try {
      const userRes = await userService.getUserByUsername(targetUsername);
      const postsRes = await userService.getUserPosts(targetUsername);
      const reelsRes = await userService.getUserReels(targetUsername);
      const creatorsRes = await userService.getSuggestedUsers();

      const ownerFallback = displayUserRef.current;

      if (userRes.success && userRes.data) {
        setProfile({
          ...userRes.data,
          isPrivate: Boolean(userRes.data.isPrivate || postsRes.isPrivate || postsRes.isLocked),
        });
      } else if (isOwnerRef.current && ownerFallback) {
        setProfile(ownerFallback);
      }

      if (postsRes.success) {
        setPosts(postsRes.posts || postsRes.data || []);
        setPostsError(null);
      } else {
        setPostsError(postsRes.message || 'Failed to load posts.');
      }

      if (reelsRes.success) {
        setReels(reelsRes.reels || []);
      }

      if (creatorsRes.success && creatorsRes.data) {
        setSuggestedCreators(creatorsRes.data);
      }
    } catch (err) {
      console.error('Failed loading profile data:', err);
      setPostsError(err?.message || 'Failed to load posts.');
    } finally {
      setPostsLoading(false);
      if (showLoading) setLoadingProfile(false);
    }
  }, [targetUsername]);

  const handleProfileUpdated = useCallback((updatedData) => {
    if (updatedData) {
      setProfile((prev) => ({
        ...(prev || {}),
        ...updatedData,
        job: updatedData.job !== undefined ? updatedData.job : (updatedData.title !== undefined ? updatedData.title : prev?.job),
        city: updatedData.city !== undefined ? updatedData.city : (updatedData.location !== undefined ? updatedData.location : prev?.city),
        maritalStatus: updatedData.maritalStatus !== undefined ? updatedData.maritalStatus : prev?.maritalStatus,
        dateOfBirth: updatedData.dateOfBirth !== undefined ? updatedData.dateOfBirth : prev?.dateOfBirth,
        school: updatedData.school !== undefined ? updatedData.school : prev?.school,
        college: updatedData.college !== undefined ? updatedData.college : prev?.college,
        university: updatedData.university !== undefined ? updatedData.university : prev?.university,
      }));
    }
  }, []);

  // Reload only when viewing a different profile username — never when postsCount/auth object identity changes
  useEffect(() => {
    setProfile(null);
    setPosts([]);
    setReels([]);
    setPostsLoading(true);
    setPostsError(null);
    loadProfileData(true, { clearPosts: true });
  }, [targetUsername, loadProfileData]);

  const reloadProfile = useCallback(async () => {
    // Background refresh — keep existing posts/header visible
    await loadProfileData(false, { clearPosts: false });
  }, [loadProfileData]);

  const syncProfileFollowState = useCallback(async () => {
    try {
      const userRes = await userService.getUserByUsername(targetUsername);
      if (userRes.success && userRes.data) {
        const nextIsFollowing = Boolean(userRes.data.isFollowing);

        setProfile((prev) => {
          const currentIsFollowing = prev?.isFollowing;

          if (currentIsFollowing === false && nextIsFollowing) {
            userService.getUserPosts(targetUsername).then((pRes) => {
              if (pRes.success) setPosts(pRes.posts || pRes.data || []);
            });
            userService.getUserReels(targetUsername).then((rRes) => {
              if (rRes.success) setReels(rRes.reels || []);
            });
          }

          return {
            ...(prev || {}),
            ...userRes.data,
            isPrivate: Boolean(userRes.data.isPrivate ?? prev?.isPrivate),
          };
        });
      }
    } catch (err) {
      console.warn('Failed to sync profile follow state:', err);
    }
  }, [targetUsername]);

  usePolling(
    syncProfileFollowState,
    3000,
    isAuthenticated && !isGuest && !loadingProfile && Boolean(profile)
  );

  // Soft entrance only — never leave content stuck at opacity:0 if GSAP is interrupted
  useEffect(() => {
    if (typeof window === 'undefined' || !window.gsap) return undefined;
    const gsap = window.gsap;
    const targets = ['.profile-banner-anim', '.profile-header-anim', '.profile-stats-anim', '.profile-content-anim'];
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.profile-banner-anim', { opacity: 0.01, y: -12 }, { opacity: 1, y: 0, duration: 0.45 })
      .fromTo('.profile-header-anim', { opacity: 0.01, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.25')
      .fromTo('.profile-stats-anim', { opacity: 0.01, y: 12 }, { opacity: 1, y: 0, duration: 0.35 }, '-=0.2')
      .fromTo('.profile-content-anim', { opacity: 0.01, y: 12 }, { opacity: 1, y: 0, duration: 0.35 }, '-=0.2');

    return () => {
      tl.kill();
      gsap.set(targets.join(', '), { clearProps: 'opacity,transform' });
    };
  }, [targetUsername]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleNavTabChange = (tab) => {
    if (tab === 'profile') {
      const handleClean = displayUser?.handle ? displayUser.handle.replace('@', '').toLowerCase() : 'alexrivera';
      navigate(`/profile/${handleClean}`);
      return;
    }
    navigate(`/feed?tab=${tab}`);
  };

  const handleSaveProfile = async (updatedData) => {
    const res = await userService.updateUserProfile(updatedData);
    if (res.success && res.data) {
      updateUser(res.data);
      setProfile(res.data);
      await reloadProfile();
    }
  };

  const handleToggleFollow = async () => {
    if (isGuest) {
      openAuthModal('login');
      return;
    }
    const targetId = profile?.id || profile?._id || targetUsername;

    try {
      const res = await userService.toggleFollowUser(targetId);
      const nextIsFollowing = Boolean(res.isFollowing);

      setProfile((prev) => ({
        ...prev,
        isFollowing: nextIsFollowing,
        followRequestPending: res.followRequestPending || false,
        followDisabled: res.followDisabled || false,
        followersCount: res.followersCount ?? prev?.followersCount,
        followers: res.followersCount ?? prev?.followers,
      }));

      if (nextIsFollowing) {
        const postsRes = await userService.getUserPosts(targetUsername);
        if (postsRes.success) {
          setPosts(postsRes.posts || postsRes.data || []);
        }
        const reelsRes = await userService.getUserReels(targetUsername);
        if (reelsRes.success) {
          setReels(reelsRes.reels || []);
        }
      } else {
        await reloadProfile();
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  // Post Handlers
  const handlePostCreated = async (postPayload) => {
    try {
      const res = await userService.createPost(postPayload);
      const savedPost = res.post || res.data;
      if (savedPost) {
        setPosts((prev) => [savedPost, ...prev]);
        setProfile((prev) => {
          if (!prev) return prev;
          const currentCount = typeof prev.postsCount === 'number' ? prev.postsCount : (parseInt(prev.postsCount) || 0);
          return { ...prev, postsCount: currentCount + 1 };
        });
        updateUserPostsCount?.(1);

        const vUrl = savedPost.videoUrl || savedPost.video?.url || postPayload.videoUrl || postPayload.video?.url;
        const vPublicId = savedPost.videoPublicId || savedPost.video?.publicId || postPayload.videoPublicId || postPayload.video?.publicId;

        if (vUrl) {
          try {
            await userService.createReel({
              videoUrl: vUrl,
              videoPublicId: vPublicId || 'post_video_' + Date.now(),
              thumbnailUrl: savedPost.video?.thumbnail || vUrl,
              caption: savedPost.content || postPayload.content || '',
            });
          } catch (rErr) {
            console.warn('Reel sync in profile:', rErr);
          }
        }
      }
    } catch (err) {
      console.error('Error creating post in UserProfile:', err);
    }
  };

  const handlePostUpdate = (postId, updatedPost) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...updatedPost } : p)));
  };

  const handleEditPost = async (postId, updatedData) => {
    try {
      const res = await userService.updatePost(postId, updatedData);
      if (res.post) {
        handlePostUpdate(postId, res.post);
      }
    } catch (err) {
      console.error('Failed to update post:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    const previousPosts = posts;
    const previousReels = reels;
    const previousCount = profile?.postsCount;

    setPosts((prev) => prev.filter((p) => !samePostId(p, postId)));
    setReels((prev) => prev.filter((r) => !samePostId(r, postId)));
    setProfile((prev) => {
      if (!prev) return prev;
      const currentCount = typeof prev.postsCount === 'number' ? prev.postsCount : (parseInt(prev.postsCount) || 0);
      return {
        ...prev,
        postsCount: Math.max(0, currentCount - 1),
      };
    });
    updateUserPostsCount?.(-1);

    try {
      await userService.deletePost(postId);
    } catch (err) {
      console.error('Error deleting post in UserProfile:', err);
      setPosts(previousPosts);
      setReels(previousReels);
      setProfile((prev) => (prev ? { ...prev, postsCount: previousCount ?? prev.postsCount } : prev));
      updateUserPostsCount?.(1);
    }
  };

  const openEditModalWithSection = (section = 'general') => {
    setEditModalSection(section);
    setEditModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="app-viewport flex items-center justify-center bg-[#f8fafc] dark:bg-[#070a12] transition-colors duration-300">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <BrandIcon size={48} />
        </motion.div>
      </div>
    );
  }

  const activeProfile = {
    name: 'User',
    handle: '@user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    bio: '',
    title: '',
    job: '',
    city: '',
    location: '',
    maritalStatus: '',
    dateOfBirth: '',
    school: '',
    college: '',
    university: '',
    followers: 0,
    following: 0,
    postsCount: 0,
    totalLikes: 0,
    ...(profile || {}),
    ...(isOwner ? displayUser : {}),
    isPrivate: profile?.isPrivate ?? (isOwner ? displayUser?.isPrivate : false) ?? false,
    postsCount: profile?.postsCount ?? posts.length,
    totalLikes: profile?.totalLikes ?? 0,
  };

  return (
    <div className="relative app-viewport overflow-hidden flex flex-col bg-[#f8fafc] dark:bg-[#070a12] text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white transition-colors duration-300">
      {/* Background Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="ambient-orb-1 absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/10 dark:bg-brand-600/15 blur-[140px]" />
        <div className="ambient-orb-2 absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[160px]" />
      </div>

      {/* Top Header */}
      <div className="flex-shrink-0 z-40 w-full">
        <TopNavigation
          onOpenCreatePost={() => setCreatePostModalOpen(true)}
          onOpenSearch={() => navigate('/feed?tab=search')}
          searchQuery=""
          setSearchQuery={(q) => {
            if (q.trim()) navigate(`/feed?tab=search`);
          }}
          onOpenNotifications={() => navigate('/feed?tab=notifications')}
          onOpenMessages={() => navigate('/feed?tab=messages')}
          onOpenProfile={() => navigate(`/profile/${myUsername}`)}
          onOpenSettings={() => navigate('/feed?tab=settings')}
          onLogout={handleLogout}
          user={displayUser}
          isGuest={isGuest}
        />
      </div>

      {/* Main Workspace Layout */}
      <div className="relative z-10 flex-1 min-h-0 w-full max-w-7xl mx-auto flex justify-between px-0 sm:px-4 md:px-6 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={isOwner ? 'profile' : ''}
          setActiveTab={handleNavTabChange}
          user={displayUser}
          isGuest={isGuest}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
        />

        {/* Central Profile Workspace */}
        <main className="flex-1 max-w-3xl min-w-0 h-full overflow-y-auto no-scrollbar py-3 sm:py-6 px-2.5 sm:px-4 pb-24 md:pb-12 mx-auto">
          {loadingProfile && !profile && !(isOwner && displayUser) ? (
            <ProfileSkeleton />
          ) : (
            <div className="space-y-4">
              {/* Cover + Profile Header — unified card with overlapping avatar */}
              <div className="profile-banner-anim glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-xl overflow-visible">
                <div className="rounded-t-3xl overflow-hidden">
                  <CoverBanner
                    coverImage={activeProfile.coverImage}
                    isOwner={isOwner}
                    onEditCover={() => openEditModalWithSection('photos')}
                    profileName={activeProfile.name || activeProfile.fullName}
                    profileHandle={activeProfile.handle || (activeProfile.username ? `@${activeProfile.username}` : '')}
                    embedded
                  />
                </div>
                <div className="profile-header-anim overflow-visible">
                  <ProfileHeader
                    profile={activeProfile}
                    isOwner={isOwner}
                    username={targetUsername}
                    currentUserId={displayUser?.id}
                    isGuest={isGuest}
                    onRequireAuth={() => openAuthModal('login')}
                    onEditProfile={() => openEditModalWithSection('general')}
                    onEditPicture={() => openEditModalWithSection('photos')}
                    onPostsClick={scrollToPosts}
                    onToggleFollow={handleToggleFollow}
                    onProfileUpdate={() => loadProfileData(false, { clearPosts: false })}
                  />
                </div>

                {/* Profile Information Section directly below Likes & Followers */}
                <ProfileInfoSection
                  profile={activeProfile}
                  isOwner={isOwner}
                  onProfileUpdated={handleProfileUpdated}
                />
              </div>

            {/* Private Account Lock View OR Profile Content */}
            <div className="profile-content-anim" ref={postsSectionRef}>
              {activeProfile.isPrivate && !isOwner && !activeProfile.isFollowing ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="glass-panel p-8 sm:p-12 rounded-3xl text-center flex flex-col items-center justify-center space-y-4 border border-slate-200/80 dark:border-slate-800/80 shadow-lg my-4"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                    <IconLock className="w-8 h-8 sm:w-10 sm:h-10 text-brand-600 dark:text-cyan-400" />
                  </div>
                  <div className="max-w-md space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      This Account is Private
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Follow <span className="font-bold text-slate-800 dark:text-slate-200">{activeProfile.handle || `@${targetUsername}`}</span> to see their photos, videos, and posts.
                    </p>
                  </div>
                  <div className="pt-2">
                    <FollowButton
                      isFollowing={activeProfile.isFollowing}
                      onToggleFollow={handleToggleFollow}
                      className="!px-8 !py-3 !text-sm !font-bold"
                    />
                  </div>
                </motion.div>
              ) : (
                <>
                  <ProfileTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isOwner={isOwner}
                  />

                  {/* Tab Content View */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25 }}
                    >
                      <PostGrid
                        posts={posts}
                        reels={reels}
                        activeTab={activeTab}
                        user={displayUser}
                        isGuest={isGuest}
                        isOwner={isOwner}
                        isLoading={postsLoading}
                        error={postsError}
                        onRequireAuth={() => openAuthModal('login')}
                        onEditPost={handleEditPost}
                        onDeletePost={handleDeletePost}
                        onPostUpdate={handlePostUpdate}
                        onCreatePost={() => setCreatePostModalOpen(true)}
                        onRetry={() => loadProfileData(false, { clearPosts: true })}
                      />
                    </motion.div>
                  </AnimatePresence>
                </>
              )} 

              {/* Suggested Creators & Connections */}
              <SuggestedConnections
                creators={suggestedCreators}
                onRequireAuth={() => openAuthModal('login')}
              />
            </div>
          </div>
        )}
      </main>

        {/* Right Sidebar */}
        <RightSidebar
          onQuickAction={(action) => {
            if (action === 'edit_profile') openEditModalWithSection('general');
            else if (action === 'create_post') setCreatePostModalOpen(true);
            else navigate('/feed');
          }}
          isGuest={isGuest}
          onRequireAuth={() => openAuthModal('login')}
        />
      </div>

      {/* Mobile Bottom Bar */}
      <BottomNavigation
        activeTab="profile"
        setActiveTab={handleNavTabChange}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        userProfile={activeProfile}
        onSave={handleSaveProfile}
        initialFocusSection={editModalSection}
      />

      {/* Create Post Modal */}
      <CreatePost
        showInlineBar={false}
        onPostCreated={handlePostCreated}
        isModalOpen={createPostModalOpen}
        setIsModalOpen={setCreatePostModalOpen}
        user={displayUser || activeProfile}
        isGuest={isGuest}
        onRequireAuth={() => openAuthModal('login')}
      />

      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} initialMode={authModalMode} />
      <GuestReminderModal />
    </div>
  );
};
