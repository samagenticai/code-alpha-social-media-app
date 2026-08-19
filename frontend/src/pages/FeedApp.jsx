import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/navigation/Sidebar';
import { TopNavigation } from '../components/navigation/TopNavigation';
import { BottomNavigation } from '../components/navigation/BottomNavigation';
import { StoriesCarousel } from '../components/feed/StoriesCarousel';
import { StoryViewer } from '../components/story/StoryViewer';
import { CreateStoryModal } from '../components/story/CreateStoryModal';
import { CreatePost } from '../components/feed/CreatePost';
import { CreateMenu } from '../components/create/CreateMenu';
import { CreateReelModal } from '../components/reels/CreateReelModal';
import { ReelsViewer } from '../components/reels/ReelsViewer';
import { DirectMessagesView } from '../components/messages/DirectMessagesView';
import { PostCard } from '../components/feed/PostCard';
import { RightSidebar } from '../components/sidebar/RightSidebar';
import { Avatar } from '../components/ui/Avatar';
import { Badge, VerifiedBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AuthModal } from '../components/auth/AuthModal';
import { GuestReminderModal } from '../components/auth/GuestReminderModal';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { BrandIcon } from '../components/brand/Logo';
import { PostSkeleton, StoryCarouselSkeleton } from '../components/ui/Skeleton';
import { TrendingView } from '../components/trending/TrendingView';
import { IconMessage, IconSparkles, IconSearch, IconUsers, IconFlame } from '../components/ui/Icons';
import { currentUser as mockUser, stories } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { mergeFeedPosts, mergePostRecord, mergeFeedSync, appendFeedPosts } from '../utils/mergeFeedPosts';
import { BRAND } from '../config/brand';
import { userService } from '../services/userService';
import { messageService } from '../services/messageService';
import { useFeedInfiniteScroll } from '../hooks/useFeedInfiniteScroll';
import { NotificationsView } from '../components/notifications/NotificationsView';
import { SettingsView } from '../components/settings/SettingsView';
import { FollowRequestsView } from '../components/follow/FollowRequestsView';
import { useFollowRequestCountPolling } from '../hooks/useFollowRequestsPolling';
import { useNotificationsPolling } from '../hooks/useNotificationsPolling';
import { usePolling } from '../hooks/usePolling';

const FEED_PAGE_SIZE = 10;
const FEED_SKELETON_BATCH = 3;
const FEED_IDLE_PLACEHOLDERS = 2;
const FEED_FILTER_AUTOFILL_LIMIT = 4;

export const FeedApp = () => {
  const {
    isAuthenticated,
    isGuest,
    isLoading,
    displayUser,
    requireAuth,
    openAuthModal,
    authModalOpen,
    closeAuthModal,
    authModalMode,
    logout,
    updateUserPostsCount,
  } = useAuth();

  const handleRequireAuthLogin = useCallback(() => openAuthModal('login'), [openAuthModal]);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') || 'home';
  const [activeTab, setActiveTab] = useState(urlTab);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedTotal, setFeedTotal] = useState(0);
  const [feedError, setFeedError] = useState('');
  const feedPageRef = React.useRef(1);
  const feedLoadingMoreRef = React.useRef(false);
  const feedRequestIdRef = React.useRef(0);
  const inFlightPagesRef = React.useRef(new Set());
  const filterAutoFillRef = React.useRef(0);
  const mainScrollRef = React.useRef(null);
  const feedInitializedRef = React.useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createReelOpen, setCreateReelOpen] = useState(false);
  const [createPostMediaType, setCreatePostMediaType] = useState(null);
  const [publishedReel, setPublishedReel] = useState(null);
  const [storiesList, setStoriesList] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [selectedConversationUser, setSelectedConversationUser] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [storyReplyContext, setStoryReplyContext] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedFilter, setFeedFilter] = useState('for-you');

  // Search creators tab states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [pendingFollowRequests, setPendingFollowRequests] = useState(0);
  const [settingsOpenReportId, setSettingsOpenReportId] = useState(null);

  const user = displayUser || mockUser;

  const tabTitles = {
    home: 'Home',
    explore: 'Trending',
    search: 'Search',
    videos: 'Reels',
    messages: 'Messages',
    notifications: 'Notifications',
    bookmarks: 'Saved',
    profile: 'Profile',
    followRequests: 'Follow Requests',
    settings: 'Settings',
  };
  usePageTitle(tabTitles[activeTab] || BRAND.name);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
    if (tab === 'messages') {
      const targetUserId = searchParams.get('userId');
      const targetUsername = searchParams.get('username') || searchParams.get('user');
      if (targetUserId || targetUsername) {
        if (targetUsername) {
          userService.getUserByUsername(targetUsername).then((res) => {
            if (res.success && res.data) {
              const u = res.data;
              setSelectedConversationUser({
                id: u.id || u._id || targetUserId,
                _id: u.id || u._id || targetUserId,
                name: u.fullName || u.name || u.username,
                handle: u.username ? `@${u.username}` : (u.handle || '@user'),
                avatar: u.profileImage || u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                verified: u.verified || false,
              });
            } else if (targetUserId) {
              setSelectedConversationUser({
                id: targetUserId,
                _id: targetUserId,
                name: targetUsername || 'Creator',
                handle: targetUsername ? `@${targetUsername}` : '@user',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
              });
            }
          }).catch(() => {
            if (targetUserId) {
              setSelectedConversationUser({
                id: targetUserId,
                _id: targetUserId,
                name: targetUsername || 'Creator',
                handle: targetUsername ? `@${targetUsername}` : '@user',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
              });
            }
          });
        } else if (targetUserId) {
          setSelectedConversationUser({
            id: targetUserId,
            _id: targetUserId,
            name: 'Creator',
            handle: '@user',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          });
        }
      }
    }
  }, [searchParams]);

  const loadMessagesCount = async () => {
    if (isGuest || !isAuthenticated) {
      setUnreadMessagesCount(0);
      return;
    }
    try {
      const res = await messageService.getConversations();
      if (res.success && Array.isArray(res.conversations)) {
        const total = res.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadMessagesCount(total);
      } else {
        setUnreadMessagesCount(0);
      }
    } catch {
      setUnreadMessagesCount(0);
    }
  };

  usePolling(loadMessagesCount, 3000, isAuthenticated && !isGuest);

  useFollowRequestCountPolling(
    setPendingFollowRequests,
    isAuthenticated && !isGuest && activeTab !== 'followRequests'
  );

  useNotificationsPolling({
    onSync: ({ unreadCount }) => {
      if (typeof unreadCount === 'number') {
        setUnreadNotificationsCount(unreadCount);
      }
    },
    enabled: isAuthenticated && !isGuest && activeTab !== 'notifications',
  });

  useEffect(() => {
    if (!isAuthenticated || isGuest) {
      setUnreadMessagesCount(0);
      setUnreadNotificationsCount(0);
      setPendingFollowRequests(0);
    }
  }, [isAuthenticated, isGuest]);

  const loadStories = async ({ silent = false } = {}) => {
    if (!silent) setStoriesLoading(true);
    try {
      const res = await userService.getStories();
      if (res.success && Array.isArray(res.stories)) {
        const processedStories = res.stories
          .map((st) => {
            const uId = st.user?.id || st.userId || st.user?._id;
            const isSelf = user
              ? user.id === uId || user._id === uId || user.handle === st.user?.handle || user.username === st.user?.username
              : false;
            return {
              ...st,
              isSelf: isSelf || st.isSelf || false,
              isFollowing: isSelf ? false : (st.isFollowing || false),
            };
          })
          .filter((st) => st.isSelf || st.isFollowing);

        processedStories.sort((a, b) => {
          if (a.isSelf && !b.isSelf) return -1;
          if (!a.isSelf && b.isSelf) return 1;
          return 0;
        });

        setStoriesList(processedStories);
      }
    } catch (err) {
      console.warn('Backend stories fetch failed:', err);
    } finally {
      setStoriesLoading(false);
    }
  };

  const loadFeed = async ({ silent = false } = {}) => {
    const requestId = ++feedRequestIdRef.current;
    // Pages beyond the first are already loaded — a page-1 refresh must only
    // refresh those posts, never truncate the feed back to ten items.
    const isReset = feedPageRef.current <= 1;
    const showSkeleton = !silent && !feedInitializedRef.current;

    if (showSkeleton) {
      setFeedLoading(true);
      setFeedError('');
    }

    try {
      const res = await userService.getFeedPosts({ page: 1, limit: FEED_PAGE_SIZE });
      if (requestId !== feedRequestIdRef.current) return;

      const incoming = res.posts || [];
      setPosts((prev) => {
        if (!prev.length) return incoming;
        return isReset ? mergeFeedPosts(prev, incoming) : mergeFeedSync(prev, incoming);
      });

      if (isReset) {
        setFeedHasMore(Boolean(res.pagination?.hasMore));
        setFeedTotal(res.pagination?.total || incoming.length);
        feedPageRef.current = 1;
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
      if (!feedInitializedRef.current) {
        setFeedError('Could not load posts. Please refresh the page.');
      }
    } finally {
      if (requestId === feedRequestIdRef.current) setFeedLoading(false);
      feedInitializedRef.current = true;
    }
  };

  const loadMoreFeed = React.useCallback(async () => {
    if (feedLoadingMoreRef.current || !feedHasMore || feedLoading) return;

    const nextPage = feedPageRef.current + 1;
    if (inFlightPagesRef.current.has(nextPage)) return;

    feedLoadingMoreRef.current = true;
    inFlightPagesRef.current.add(nextPage);
    setFeedLoadingMore(true);

    try {
      const res = await userService.getFeedPosts({ page: nextPage, limit: FEED_PAGE_SIZE });

      if (res.posts?.length) {
        setPosts((prev) => appendFeedPosts(prev, res.posts));
      }

      // Trust the backend for end-of-feed; never infer it from an empty render.
      setFeedHasMore(Boolean(res.pagination?.hasMore));
      if (res.pagination?.total) setFeedTotal(res.pagination.total);
      feedPageRef.current = Math.max(feedPageRef.current, nextPage);
    } catch (err) {
      console.warn('Failed to load more feed posts:', err);
    } finally {
      inFlightPagesRef.current.delete(nextPage);
      feedLoadingMoreRef.current = false;
      setFeedLoadingMore(false);
    }
  }, [feedHasMore, feedLoading]);

  const loadSavedPosts = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await userService.getSavedPosts();
      setSavedPosts(res.posts || []);
    } catch (err) {
      console.error('Failed to load saved posts:', err);
      setSavedPosts([]);
    }
  };

  const syncFeedPosts = React.useCallback(async () => {
    try {
      const res = await userService.getFeedPosts({ page: 1, limit: FEED_PAGE_SIZE });
      if (res.posts?.length) {
        setPosts((prev) => mergeFeedSync(prev, res.posts));
      }
    } catch {
      /* keep existing posts visible */
    }
  }, []);

  usePolling(syncFeedPosts, 5000, isAuthenticated && activeTab === 'home');
  usePolling(() => loadStories({ silent: true }), 10000, isAuthenticated && activeTab === 'home');

  useEffect(() => {
    if (!isLoading && (isAuthenticated || isGuest)) {
      loadFeed();
      loadStories();
    }
  }, [isLoading, isAuthenticated, isGuest]);

  useEffect(() => {
    if (activeTab === 'bookmarks' && isAuthenticated) {
      loadSavedPosts();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await userService.getSuggestedUsers();
        if (res.success) {
          setSuggestedUsers(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      }
    };
    if (activeTab === 'search') {
      fetchSuggestions();
    }
  }, [activeTab]);

  // Sync TopNav searchQuery with userSearchQuery
  useEffect(() => {
    if (searchQuery !== userSearchQuery) {
      setUserSearchQuery(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const q = (searchQuery || userSearchQuery || '').trim();
      if (!q) {
        setUserSearchResults([]);
        return;
      }
      setUserSearchLoading(true);
      try {
        const res = await userService.searchUsers(q);
        if (res.success) {
          setUserSearchResults(res.users || []);
        }
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, userSearchQuery]);

  const handleFollowToggle = async (targetUser) => {
    if (isGuest) {
      openAuthModal('login');
      return;
    }
    const targetId = targetUser.id || targetUser._id;
    try {
      const res = await userService.toggleFollowUser(targetId);
      if (res.success) {
        setUserSearchResults((prev) =>
          prev.map((u) => ((u.id || u._id) === targetId ? { ...u, isFollowing: res.isFollowing } : u))
        );
        setSuggestedUsers((prev) =>
          prev.map((u) => ((u.id || u._id) === targetId ? { ...u, isFollowing: res.isFollowing } : u))
        );
      }
    } catch (err) {
      console.error('Failed to follow/unfollow:', err);
    }
  };

  const handlePostUpdate = (postId, updatedPost) => {
    const idStr = String(postId);
    setPosts((prev) =>
      prev.map((p) =>
        String(p.id || p._id) === idStr ? mergePostRecord(p, { ...p, ...updatedPost }) : p
      )
    );
    setSavedPosts((prev) => {
      const updated = prev.map((p) =>
        String(p.id || p._id) === idStr ? mergePostRecord(p, { ...p, ...updatedPost }) : p
      );
      if (updatedPost.isSaved === false) {
        return updated.filter((p) => String(p.id || p._id) !== idStr);
      }
      if (updatedPost.isSaved && !prev.some((p) => String(p.id || p._id) === idStr)) {
        return [updatedPost, ...prev];
      }
      return updated;
    });
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
    const matches = (p) => String(p.id || p._id) === String(postId);
    setPosts((prev) => prev.filter((p) => !matches(p)));
    setSavedPosts((prev) => prev.filter((p) => !matches(p)));
    updateUserPostsCount?.(-1);
    try {
      await userService.deletePost(postId);
    } catch (err) {
      console.error('Failed to delete post:', err);
      loadFeed({ silent: true });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gsap) {
      const gsap = window.gsap;
      // Animating the large blurred orbs is far too expensive for mobile compositing.
      const allowAmbientMotion = window.matchMedia('(min-width: 768px)').matches;

      if (allowAmbientMotion && document.querySelector('.ambient-orb-1')) {
        gsap.to('.ambient-orb-1', {
          x: 60,
          y: 40,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
      if (allowAmbientMotion && document.querySelector('.ambient-orb-2')) {
        gsap.to('.ambient-orb-2', {
          x: -50,
          y: 50,
          duration: 10,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      const targets = ['.sidebar-nav', '.stories-carousel', '.create-post-card', '.right-sidebar'].filter(
        (sel) => document.querySelector(sel)
      );

      if (targets.length) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        targets.forEach((sel) => {
          tl.fromTo(sel, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.2');
        });
      }
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleTabChange = (tab) => {
    const protectedTabs = ['messages', 'bookmarks', 'profile', 'settings'];
    if (isGuest && protectedTabs.includes(tab)) {
      openAuthModal('login');
      return;
    }
    if (tab === 'profile') {
      const handleClean = user?.handle ? user.handle.replace('@', '').toLowerCase() : 'alexrivera';
      navigate(`/profile/${handleClean}`);
      return;
    }
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const handleNavigateToReport = (reportId) => {
    if (isGuest) {
      openAuthModal('login');
      return;
    }
    setSettingsOpenReportId(reportId);
    setActiveTab('settings');
    setSearchParams({ tab: 'settings' }, { replace: true });
  };

  const handleOpenCreateMenu = () => {
    requireAuth(() => setCreateMenuOpen(true));
  };

  const handleCreateMenuSelect = (action) => {
    setCreateMenuOpen(false);
    switch (action) {
      case 'post':
        setCreatePostMediaType(null);
        setIsModalOpen(true);
        break;
      case 'reel':
        setCreateReelOpen(true);
        break;
      case 'photo':
        setCreatePostMediaType('image');
        setIsModalOpen(true);
        break;
      case 'video':
        setCreatePostMediaType('video');
        setIsModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handleReelPublished = (reel) => {
    setPublishedReel(reel);
    setActiveTab('videos');
    setSearchParams({ tab: 'videos', reel: reel.id || reel._id }, { replace: true });
  };

  const handleOpenCreatePost = () => {
    handleOpenCreateMenu();
  };

  const handleOpenCreateStory = () => {
    requireAuth(() => setIsCreateStoryOpen(true));
  };

  const handleStoryCreated = async (storyPayload) => {
    try {
      const res = await userService.createStory(storyPayload);
      if (res.success) {
        await loadStories();
      }
    } catch (err) {
      console.error('Failed creating story on backend:', err);
    }
  };

  const handleDeleteStory = async (storyId) => {
    setStoriesList((prev) =>
      prev
        .map((s) => ({
          ...s,
          items: (s.items || []).filter((item) => item.id !== storyId),
        }))
        .filter((s) => s.items && s.items.length > 0)
    );
    await loadStories();
  };

  const handleStoryReplyData = (replyData) => {
    if (!replyData || !replyData.user) return;

    setSelectedConversationUser(replyData.user);
    setStoryReplyContext({
      storyId: replyData.storyId,
      media: replyData.media,
      caption: replyData.caption,
      bgGradient: replyData.bgGradient,
      creatorName: replyData.user.name,
      text: replyData.text,
    });

    setActiveStoryIndex(null);
    setActiveTab('messages');
    setSearchParams({ tab: 'messages' }, { replace: true });
  };

  const handlePostCreated = async (postPayload) => {
    try {
      const res = await userService.createPost(postPayload);
      const savedPost = res.post || res.data;
      if (savedPost) {
        setPosts((prev) => [savedPost, ...prev]);
        updateUserPostsCount?.(1);

        const vUrl = savedPost.videoUrl || savedPost.video?.url || postPayload.videoUrl || postPayload.video?.url;
        const vPublicId = savedPost.videoPublicId || savedPost.video?.publicId || postPayload.videoPublicId || postPayload.video?.publicId;

        if (vUrl) {
          try {
            const reelRes = await userService.createReel({
              videoUrl: vUrl,
              videoPublicId: vPublicId || 'post_video_' + Date.now(),
              thumbnailUrl: savedPost.video?.thumbnail || vUrl,
              caption: savedPost.content || postPayload.content || '',
            });
            if (reelRes.success && reelRes.reel) {
              setPublishedReel(reelRes.reel);
            }
          } catch (rErr) {
            console.warn('Reel auto-sync:', rErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed saving post to backend:', err);
    }
  };

  const handleQuickAction = (action) => {
    const protectedActions = ['create_post', 'upload_video', 'create_reel', 'create_story', 'edit_profile', 'saved_posts'];
    if (isGuest && protectedActions.includes(action)) {
      openAuthModal('login');
      return;
    }

    switch (action) {
      case 'create_post':
        setCreatePostMediaType(null);
        setIsModalOpen(true);
        break;
      case 'upload_video':
      case 'create_reel':
        setCreateReelOpen(true);
        break;
      case 'create_story':
        setIsCreateStoryOpen(true);
        break;
      case 'view_reels':
        handleTabChange('videos');
        break;
      case 'edit_profile': {
        const handleClean = user?.handle ? user.handle.replace('@', '') : 'user';
        navigate(`/profile/${handleClean}`);
        break;
      }
      case 'saved_posts':
        setActiveTab('bookmarks');
        break;
      default:
        break;
    }
  };

  const filteredPosts = React.useMemo(() => {
    let result = [...posts];

    // Filter or sort according to feedFilter tab (For You, Following, Latest)
    if (feedFilter === 'following') {
      result = result.filter((post) => {
        const author = post.user || post.author || {};
        const authorId = (author.id || author._id || '').toString();
        const myId = (user?.id || user?._id || '').toString();

        return (
          Boolean(author.isFollowing || post.isFollowing || post.user?.isFollowing) ||
          (Boolean(myId) && Boolean(authorId) && myId === authorId)
        );
      });
    } else if (feedFilter === 'latest') {
      const getPostTime = (p) => {
        const dateVal = p.createdAt || p.created_at || p.timestamp || p.date;
        if (dateVal) {
          const t = new Date(dateVal).getTime();
          if (!Number.isNaN(t)) return t;
        }
        return Number(p.id || p._id) || 0;
      };
      result.sort((a, b) => getPostTime(b) - getPostTime(a));
    }

    // Filter by searchQuery if entered
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((post) => {
        const content = post.content || post.caption || '';
        const name = post.user?.name || post.user?.fullName || '';
        const handle = post.user?.handle || post.user?.username || '';
        return (
          content.toLowerCase().includes(query) ||
          name.toLowerCase().includes(query) ||
          handle.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [posts, feedFilter, searchQuery, user]);

  const feedSentinelRef = useFeedInfiniteScroll({
    enabled: activeTab === 'home' && !feedLoading && feedHasMore && !feedError,
    hasMore: feedHasMore,
    loading: feedLoadingMore,
    onLoadMore: loadMoreFeed,
    scrollRootRef: mainScrollRef,
    rootMargin: '720px 0px',
    prefetchPx: 900,
  });

  // While fetching, reserve one skeleton per expected incoming post. While idle,
  // keep a couple reserved so a very fast scroll can never reach bare space.
  const pendingSkeletonCount = React.useMemo(() => {
    if (!feedHasMore) return 0;
    if (!feedLoadingMore) return FEED_IDLE_PLACEHOLDERS;
    const remaining = feedTotal ? Math.max(feedTotal - posts.length, 1) : FEED_PAGE_SIZE;
    return Math.min(remaining, FEED_PAGE_SIZE);
  }, [feedHasMore, feedLoadingMore, feedTotal, posts.length]);

  useEffect(() => {
    filterAutoFillRef.current = 0;
  }, [feedFilter, searchQuery]);

  // Client-side filters (Following / search) can leave very few visible posts, so
  // pull a few more pages. Capped so a narrow filter can't walk the whole feed.
  useEffect(() => {
    if (activeTab !== 'home' || feedLoading || feedLoadingMore || !feedHasMore) return;
    if (feedFilter === 'for-you' && !searchQuery.trim()) return;
    if (filteredPosts.length >= FEED_PAGE_SIZE / 2) return;
    if (filterAutoFillRef.current >= FEED_FILTER_AUTOFILL_LIMIT) return;
    filterAutoFillRef.current += 1;
    loadMoreFeed();
  }, [
    activeTab,
    feedLoading,
    feedLoadingMore,
    feedHasMore,
    filteredPosts.length,
    feedFilter,
    searchQuery,
    loadMoreFeed,
  ]);

  if (isLoading) {
    return (
      <div className="app-viewport flex items-center justify-center bg-[#f8fafc] dark:bg-[#070a12] transition-colors duration-300">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <BrandIcon size={48} />
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated && !isGuest) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative app-viewport overflow-hidden flex flex-col bg-[#f8fafc] dark:bg-[#070a12] text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="ambient-orb-1 absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/10 dark:bg-brand-600/15 blur-[140px]" />
        <div className="ambient-orb-2 absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[160px]" />
        <div className="ambient-orb-3 absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] rounded-full bg-purple-600/10 dark:bg-purple-600/15 blur-[150px]" />
      </div>

      {isGuest && (
        <div className="flex-shrink-0 z-50 w-full bg-gradient-to-r from-brand-600/20 via-brand-purple/15 to-brand-cyan/20 border-b border-brand-500/20 px-3 py-1.5 sm:px-4 sm:py-2 text-center">
          <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300">
            Browsing as guest.{' '}
            <button onClick={() => openAuthModal('login')} className="text-brand-600 dark:text-cyan-400 hover:underline font-bold">
              Log in
            </button>
            {' or '}
            <button onClick={() => openAuthModal('register')} className="text-brand-600 dark:text-cyan-400 hover:underline font-bold">
              sign up
            </button>
            {' to unlock all features.'}
          </p>
        </div>
      )}

      <div className={`flex-shrink-0 z-40 w-full ${activeTab === 'messages' && activeChatUser ? 'hidden md:block' : 'block'}`}>
        <TopNavigation
          onOpenCreatePost={handleOpenCreatePost}
          onOpenSearch={() => handleTabChange('search')}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNotifications={() => handleTabChange('notifications')}
          onOpenMessages={() => handleTabChange('messages')}
          onOpenProfile={() => handleTabChange('profile')}
          onOpenSettings={() => handleTabChange('settings')}
          onLogout={handleLogout}
          user={user}
          isGuest={isGuest}
          unreadMessagesCount={unreadMessagesCount}
          unreadNotificationsCount={unreadNotificationsCount}
        />
      </div>

      <div className="relative z-10 flex-1 min-h-0 h-full w-full max-w-7xl mx-auto flex justify-between px-0 sm:px-4 md:px-6 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          unreadMessages={unreadMessagesCount}
          unreadNotifications={unreadNotificationsCount}
          pendingFollowRequests={pendingFollowRequests}
          user={user}
          isGuest={isGuest}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
        />

        <main
          ref={mainScrollRef}
          className={`flex-1 min-w-0 h-full ${activeTab === 'messages'
          ? (activeChatUser ? 'overflow-hidden p-0 max-w-none w-full pb-0' : 'overflow-hidden p-0 sm:p-2 md:p-3 max-w-none w-full pb-16 md:pb-0')
          : activeTab === 'videos'
            ? 'overflow-y-auto overflow-x-hidden p-0 max-w-none w-full h-full min-h-0 pb-16 md:pb-0 bg-[#070a12]'
            : 'overflow-y-auto no-scrollbar py-3 sm:py-6 px-2.5 sm:px-4 pb-24 md:pb-12 mx-auto ' + (activeTab === 'search' || activeTab === 'settings' || activeTab === 'notifications' || activeTab === 'explore' || activeTab === 'followRequests' ? 'max-w-none w-full' : 'max-w-2xl')
          }`}>
          {activeTab === 'home' && (
            <>
              <div className="stories-carousel">
                {storiesLoading ? (
                  <StoryCarouselSkeleton />
                ) : (
                  <StoriesCarousel
                    stories={storiesList}
                    user={user}
                    onSelectStory={(index) => setActiveStoryIndex(index)}
                    onOpenCreateStory={handleOpenCreateStory}
                  />
                )}
              </div>

              <div className="flex items-center justify-between mb-3 sm:mb-5 bg-white dark:bg-slate-900 md:bg-white/80 md:dark:bg-slate-900/60 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800/80 md:backdrop-blur-xl shadow-sm sm:shadow-md dark:shadow-lg shadow-slate-200/50 dark:shadow-black/20">
                {[
                  { id: 'for-you', label: 'For You', icon: IconSparkles },
                  { id: 'following', label: 'Following', icon: IconUsers },
                  { id: 'latest', label: 'Latest', icon: IconFlame }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setFeedFilter(id)}
                    className={`flex-1 py-2 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 ${feedFilter === id
                      ? 'bg-gradient-to-r from-brand-600 via-brand-purple to-brand-cyan text-white shadow-sm sm:shadow-md shadow-brand-500/25'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="create-post-card">
                {activeTab === 'home' && (
                  <button
                    type="button"
                    onClick={() => requireAuth(() => setIsModalOpen(true))}
                    className="glass-panel w-full p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-2.5 text-left hover:border-brand-300 dark:hover:border-brand-500/40 transition-colors"
                  >
                    <Avatar src={user?.avatar || user?.profileImage} size="sm" />
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex-1">
                      What's on your mind?
                    </span>
                  </button>
                )}
              </div>

              <div className="space-y-3.5 sm:space-y-6">
                {feedLoading ? (
                  Array.from({ length: FEED_SKELETON_BATCH }, (_, i) => (
                    <PostSkeleton key={`feed-initial-${i}`} />
                  ))
                ) : feedError ? (
                  <div className="glass-panel p-6 sm:p-8 text-center rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-rose-500">{feedError}</p>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  <>
                    {filteredPosts.map((post) => (
                      <PostCard
                        key={post.id || post._id}
                        post={post}
                        user={user}
                        isGuest={isGuest}
                        onRequireAuth={handleRequireAuthLogin}
                        onEditPost={handleEditPost}
                        onDeletePost={handleDeletePost}
                        onPostUpdate={handlePostUpdate}
                      />
                    ))}

                    {feedHasMore ? (
                      <>
                        <div ref={feedSentinelRef} className="feed-scroll-sentinel" aria-hidden />
                        {Array.from({ length: pendingSkeletonCount }, (_, i) => (
                          <PostSkeleton key={`feed-next-${i}`} />
                        ))}
                      </>
                    ) : (
                      <div className="feed-end-notice glass-panel py-4 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                          You&apos;re all caught up
                        </p>
                      </div>
                    )}
                  </>
                ) : feedHasMore || feedLoadingMore ? (
                  <>
                    <div ref={feedSentinelRef} className="feed-scroll-sentinel" aria-hidden />
                    {Array.from({ length: FEED_PAGE_SIZE }, (_, i) => (
                      <PostSkeleton key={`feed-filter-pending-${i}`} />
                    ))}
                  </>
                ) : (
                  <div className="glass-panel p-6 sm:p-8 text-center rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800">
                    <IconSparkles className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-300">
                      {feedFilter === 'following'
                        ? 'No posts from creators you follow'
                        : feedFilter === 'latest'
                          ? 'No recent posts'
                          : 'No matching posts found'}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {feedFilter === 'following'
                        ? 'Follow more creators in Search or Explore to see their latest posts here!'
                        : feedFilter === 'latest'
                          ? 'Be the first to share an update with the community!'
                          : 'Try searching for other topics or creators'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'explore' && (
            <TrendingView
              user={user}
              isGuest={isGuest}
              onRequireAuth={requireAuth}
              onPostUpdate={handlePostUpdate}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onOpenReels={() => {
                setActiveTab('videos');
                setSearchParams({ tab: 'videos' });
              }}
            />
          )}

          {activeTab === 'search' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-1">Search Creators</h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Discover premium creators and connect with the community.</p>

                {/* Search input field */}
                <div className="relative mt-4">
                  <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by name or handle..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100/90 dark:bg-slate-900/90 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500 dark:focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Loader */}
              {userSearchLoading && (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">Searching creators...</p>
                </div>
              )}

              {/* Search Results */}
              {!userSearchLoading && userSearchQuery.trim() !== '' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    Search Results ({userSearchResults.length})
                  </h3>
                  {userSearchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {userSearchResults.map((searchedUser) => (
                        <div
                          key={searchedUser.id || searchedUser._id}
                          className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-brand-500/40 transition-all"
                        >
                          <div
                            onClick={() => navigate(`/profile/${(searchedUser.username || '').replace('@', '').toLowerCase()}`)}
                            className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                          >
                            <Avatar src={searchedUser.profileImage || searchedUser.avatar} alt={searchedUser.fullName} size="md" />
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate hover:underline">
                                {searchedUser.fullName}
                              </h4>
                              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                @{(searchedUser.username || '').replace('@', '')}
                              </p>
                              {searchedUser.title && (
                                <p className="text-[9px] sm:text-[10px] text-brand-600 dark:text-cyan-400 font-medium truncate mt-0.5">
                                  {searchedUser.title}
                                </p>
                              )}
                            </div>
                          </div>

                          <Button
                            variant={searchedUser.isFollowing ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleFollowToggle(searchedUser)}
                            className="!text-[10px] sm:!text-xs !py-1 sm:!py-1.5 !px-3 font-semibold flex-shrink-0"
                          >
                            {searchedUser.isFollowing ? 'Following' : 'Follow'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-panel p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400">No creators found matching "{userSearchQuery}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Creators */}
              {!userSearchLoading && userSearchQuery.trim() === '' && (
                <div className="space-y-3 animate-fadeIn">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    Recommended Creators
                  </h3>
                  {suggestedUsers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {suggestedUsers.map((sugUser) => (
                        <div
                          key={sugUser.id || sugUser._id}
                          className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-brand-500/40 transition-all"
                        >
                          <div
                            onClick={() => navigate(`/profile/${(sugUser.username || '').replace('@', '').toLowerCase()}`)}
                            className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                          >
                            <Avatar src={sugUser.profileImage || sugUser.avatar} alt={sugUser.fullName} size="md" />
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate hover:underline">
                                {sugUser.fullName}
                              </h4>
                              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                @{(sugUser.username || '').replace('@', '')}
                              </p>
                              {sugUser.title && (
                                <p className="text-[9px] sm:text-[10px] text-brand-600 dark:text-cyan-400 font-medium truncate mt-0.5">
                                  {sugUser.title}
                                </p>
                              )}
                            </div>
                          </div>

                          <Button
                            variant={sugUser.isFollowing ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleFollowToggle(sugUser)}
                            className="!text-[10px] sm:!text-xs !py-1 sm:!py-1.5 !px-3 font-semibold flex-shrink-0"
                          >
                            {sugUser.isFollowing ? 'Following' : 'Follow'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-panel p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Loading recommended creators...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'videos' && (
            <ReelsViewer
              currentUser={user}
              isGuest={isGuest}
              isAuthenticated={isAuthenticated}
              onRequireAuth={() => openAuthModal('login')}
              initialReelId={searchParams.get('reel')}
              publishedReel={publishedReel}
              onPublishedReelConsumed={() => setPublishedReel(null)}
              onOpenCreateReel={() => requireAuth(() => setCreateReelOpen(true))}
            />
          )}

          {activeTab === 'messages' && (
            <DirectMessagesView
              currentUser={user}
              preselectedUser={selectedConversationUser}
              initialStoryReply={storyReplyContext}
              onClearStoryReply={() => setStoryReplyContext(null)}
              onActiveUserChange={setActiveChatUser}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              user={user}
              isGuest={isGuest}
              onRefreshUnreadCount={setUnreadNotificationsCount}
              onNavigateToReport={handleNavigateToReport}
            />
          )}

          {activeTab === 'bookmarks' && isAuthenticated && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="glass-panel p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
                <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100">Saved Bookmarks</h2>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Posts saved for quick reference.</p>
              </div>
              {savedPosts.length > 0 ? (
                savedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    user={user}
                    isGuest={isGuest}
                    onRequireAuth={() => openAuthModal('login')}
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                    onPostUpdate={handlePostUpdate}
                  />
                ))
              ) : (
                <div className="glass-panel p-6 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">No saved posts yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && isAuthenticated && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="glass-panel rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="h-28 sm:h-40 bg-gradient-to-r from-brand-600 via-brand-purple to-brand-cyan relative">
                  <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover opacity-60" />
                </div>
                <div className="p-4 sm:p-6 relative pt-0">
                  <div className="flex justify-between items-end -mt-8 sm:-mt-12 mb-3 sm:mb-4">
                    <Avatar src={user.avatar} size="xl" storyRing={true} className="!w-16 !h-16 sm:!w-24 sm:!h-24" />
                    <Button variant="secondary" size="sm" className="!text-xs !py-1 sm:!py-1.5">Edit Profile</Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">{user.name}</h2>
                    {user.verified && <VerifiedBadge />}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">{user.handle}</p>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-2">{user.bio}</p>
                  <div className="flex gap-4 sm:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs">
                    <div><strong className="text-slate-900 dark:text-slate-100">{user.followers}</strong> <span className="text-slate-500 dark:text-slate-400">Followers</span></div>
                    <div><strong className="text-slate-900 dark:text-slate-100">{user.following}</strong> <span className="text-slate-500 dark:text-slate-400">Following</span></div>
                    <div><strong className="text-slate-900 dark:text-slate-100">{user.postsCount}</strong> <span className="text-slate-500 dark:text-slate-400">Posts</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'followRequests' && isAuthenticated && (
            <FollowRequestsView onCountChange={setPendingFollowRequests} />
          )}

          {activeTab === 'settings' && isAuthenticated && (
            <SettingsView
              user={user}
              isGuest={isGuest}
              onLogout={handleLogout}
              openReportId={settingsOpenReportId}
              onReportConversationClose={() => setSettingsOpenReportId(null)}
            />
          )}
        </main>

        {activeTab !== 'messages' && activeTab !== 'search' && activeTab !== 'settings' && activeTab !== 'followRequests' && (
          <RightSidebar
            onQuickAction={handleQuickAction}
            onSearchTag={(tag) => { setSearchQuery(tag); handleTabChange('home'); }}
            isGuest={isGuest}
            onRequireAuth={() => openAuthModal('login')}
            onOpenMessages={(targetUser) => {
              setSelectedConversationUser(targetUser);
              handleTabChange('messages');
            }}
            currentUser={user}
            onTabChange={handleTabChange}
          />
        )}
      </div>

      {!(activeTab === 'messages' && Boolean(activeChatUser)) && (
        <BottomNavigation
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          pendingFollowRequests={pendingFollowRequests}
        />
      )}

      {activeStoryIndex !== null && (
        <StoryViewer
          stories={storiesList}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onReplyToStory={handleStoryReplyData}
          onDeleteStory={handleDeleteStory}
        />
      )}

      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onStoryCreated={handleStoryCreated}
        user={user}
      />

      <CreateMenu
        isOpen={createMenuOpen}
        onClose={() => setCreateMenuOpen(false)}
        onSelect={handleCreateMenuSelect}
      />

      <CreateReelModal
        isOpen={createReelOpen}
        onClose={() => setCreateReelOpen(false)}
        onPublished={handleReelPublished}
        currentUser={user}
      />

      <CreatePost
        onPostCreated={handlePostCreated}
        isModalOpen={isModalOpen}
        setIsModalOpen={(open) => {
          setIsModalOpen(open);
          if (!open) setCreatePostMediaType(null);
        }}
        initialMediaType={createPostMediaType}
        user={user}
        isGuest={isGuest}
        onRequireAuth={() => openAuthModal('login')}
        showInlineBar={false}
      />

      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} initialMode={authModalMode} />
      <GuestReminderModal />

      <footer className="hidden md:block relative z-10 py-3 text-center border-t border-slate-200/80 dark:border-slate-800/60 bg-white/60 dark:bg-transparent transition-colors">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} <span className="font-semibold text-slate-600 dark:text-slate-400">{BRAND.name}</span> · {BRAND.tagline}
        </p>
      </footer>
    </div>
  );
};
