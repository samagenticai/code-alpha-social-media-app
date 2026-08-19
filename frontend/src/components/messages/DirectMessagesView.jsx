import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/Badge';
import {
  IconSend,
  IconSearch,
  IconCheck,
  IconSparkles,
  IconMessage,
  IconClose,
  IconPlus,
} from '../ui/Icons';
import { BRAND } from '../../config/brand';
import { messageService } from '../../services/messageService';
import { userService } from '../../services/userService';
import { ReportModal } from '../moderation/ReportModal';

const DEFAULT_CONVERSATIONS = [];

export const DirectMessagesView = ({
  currentUser,
  preselectedUser,
  initialStoryReply,
  onClearStoryReply,
  onActiveUserChange,
}) => {
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(preselectedUser || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStoryContext, setActiveStoryContext] = useState(initialStoryReply || null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const [reportModal, setReportModal] = useState({ open: false, type: 'user', id: null, label: '' });

  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    onActiveUserChange?.(activeUser);
  }, [activeUser, onActiveUserChange]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, activeUser]);

  // Sync initial story reply context if passed from FeedApp/StoryViewer
  useEffect(() => {
    if (initialStoryReply) {
      setActiveStoryContext(initialStoryReply);
    }
  }, [initialStoryReply]);

  // Sync preselected user
  useEffect(() => {
    if (preselectedUser) {
      handleSelectUser(preselectedUser);
    }
  }, [preselectedUser]);

  // Load conversations list
  const loadConversations = async () => {
    try {
      const res = await messageService.getConversations();
      if (res.success && res.conversations && res.conversations.length > 0) {
        setConversations(res.conversations);
      } else {
        const sugRes = await userService.getSuggestedUsers();
        const rawUsers = sugRes.users || sugRes.data || [];
        // Strictly filter to ONLY users that the current user IS FOLLOWING
        const followedUsers = rawUsers.filter((u) => u.isFollowing);
        if (followedUsers.length > 0) {
          const formattedSug = followedUsers.map((u) => ({
            user: {
              id: u.id || u._id,
              _id: u.id || u._id,
              name: u.fullName || u.username || u.name,
              handle: u.username ? `@${u.username}` : (u.handle || '@user'),
              avatar: u.profileImage || u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
              title: u.title || 'Creator',
              verified: u.verified || false,
            },
            lastMessage: {
              text: 'Tap to start a direct message...',
              createdAt: new Date().toISOString(),
              read: true,
            },
            unreadCount: 0,
          }));
          setConversations(formattedSug);
        } else {
          setConversations([]);
        }
      }
    } catch (err) {
      console.warn('Failed loading conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load active chat history
  const fetchChatMessages = async (targetId) => {
    if (!targetId) return;
    try {
      const res = await messageService.getMessagesWithUser(targetId);
      if (res.success && res.messages) {
        setMessages(res.messages);
      }
      setPartnerIsTyping(Boolean(res?.isTyping));
    } catch (err) {
      console.error('Failed fetching chat messages:', err);
    }
  };

  useEffect(() => {
    if (activeUser) {
      const targetId = activeUser.id || activeUser._id;
      setIsLoadingMessages(true);
      fetchChatMessages(targetId).finally(() => setIsLoadingMessages(false));
    }
  }, [activeUser]);

  // Poll messages every 2.5 seconds via REST API
  useEffect(() => {
    if (!activeUser) return;
    const targetId = activeUser.id || activeUser._id;
    const interval = setInterval(() => {
      fetchChatMessages(targetId);
      loadConversations();
    }, 2500);

    return () => clearInterval(interval);
  }, [activeUser]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (!activeUser) return;
    const targetId = activeUser.id || activeUser._id;
    if (!targetId) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000 && val.trim().length > 0) {
      lastTypingSentRef.current = now;
      messageService.sendTypingStatus(targetId, true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      messageService.sendTypingStatus(targetId, false);
    }, 2500);
  };

  // Handle user search in conversations
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await userService.searchUsers(searchQuery);
        if (res.success) {
          const followedOnly = (res.users || []).filter((u) => u.isFollowing);
          setSearchResults(followedOnly);
        }
      } catch (err) {
        console.error('Failed searching users for messages:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleSelectUser = (userObj) => {
    setActiveUser(userObj);
    setSearchQuery('');
    setSearchResults([]);

    // Check if conversation exists or add to top
    const userId = userObj.id || userObj._id;
    setConversations((prev) => {
      const exists = prev.some((c) => (c.user?.id || c.user?._id) === userId);
      if (exists) return prev;
      return [
        {
          user: userObj,
          lastMessage: { text: 'Started a conversation', createdAt: new Date().toISOString(), read: true },
          unreadCount: 0,
        },
        ...prev,
      ];
    });
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!activeUser) return;
    const textToSend = inputText.trim();
    if (!textToSend && !activeStoryContext) return;

    const targetId = activeUser.id || activeUser._id;
    const storyContextPayload = activeStoryContext
      ? {
        storyId: activeStoryContext.storyId || '',
        media: activeStoryContext.media || activeStoryContext.url || '',
        caption: activeStoryContext.caption || '',
        bgGradient: activeStoryContext.bgGradient || '',
        creatorName: activeStoryContext.creatorName || activeUser.name,
      }
      : null;

    // Local optimistic update for instant feedback
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      _id: tempId,
      senderId: currentUser?.id || 'usr_me',
      receiverId: targetId,
      text: textToSend,
      storyRef: storyContextPayload,
      read: false,
      createdAt: new Date().toISOString(),
      isSelf: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');
    const sentStoryContext = activeStoryContext;
    setActiveStoryContext(null);
    if (onClearStoryReply) onClearStoryReply();

    try {
      setErrorMsg('');
      const res = await messageService.sendMessage({
        receiverId: targetId,
        text: textToSend,
        storyRef: storyContextPayload,
      });

      if (res.success && res.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setErrorMsg(res.message || 'You must follow this creator to message them.');
      }
      fetchChatMessages(targetId);
      loadConversations();
    } catch (err) {
      console.error('Failed sending message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setErrorMsg(err.message || 'You must follow this creator to message them.');
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.user?.name || '').toLowerCase().includes(q) ||
      (c.user?.handle || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden flex flex-col md:flex-row select-none">
        {/* LEFT SIDEBAR: Conversations List & User Search */}
        <div className={`w-full md:w-64 lg:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 ${activeUser ? 'hidden md:flex' : 'flex'}`}>

          {/* Top Header */}
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <IconMessage className="w-5 h-5 text-brand-500" /> Direct Messages
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500/10 text-brand-600 dark:text-cyan-400 border border-brand-500/20">
                Live Sync
              </span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations or creators..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* User Search Results Dropdown overlay */}
          {searchQuery.trim() !== '' && (
            <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Creators ({searchResults.length})
              </p>
              {isSearching ? (
                <p className="text-xs text-slate-400 p-2 animate-pulse">Searching creators...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((u) => (
                  <div
                    key={u.id || u._id}
                    onClick={() => handleSelectUser(u)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <Avatar src={u.avatar || u.profileImage} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.fullName || u.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">@{u.username}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 p-2">No creators found.</p>
              )}
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/40 dark:divide-slate-800/40">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const partner = conv.user;
                const isSelected = activeUser && (activeUser.id || activeUser._id) === (partner.id || partner._id);

                return (
                  <div
                    key={partner.id || partner._id}
                    onClick={() => setActiveUser(partner)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all duration-200 ${isSelected
                        ? 'bg-brand-500/10 dark:bg-brand-500/15 border-l-4 border-brand-500'
                        : 'hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                      }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar src={partner.avatar || partner.profileImage} size="md" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                          {partner.name || partner.fullName}
                          {partner.verified && <VerifiedBadge className="w-3 h-3 text-cyan-400" />}
                        </h4>
                        {conv.lastMessage?.createdAt && (
                          <span className="text-[9px] text-slate-400">
                            {formatShortTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {conv.lastMessage?.text || 'No messages yet'}
                      </p>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white shadow-sm shadow-brand-500/30">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-400">
                <IconMessage className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No active conversations yet.</p>
              </div>
            )}
          </div>
        </div>

      {/* MAIN CHAT AREA */}
      {activeUser ? (
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-slate-900">

          {/* Active Chat Header — Fixed & Locked to Top */}
          <div className="flex-shrink-0 z-30 sticky top-0 px-3 py-2.5 sm:p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* iOS / Instagram Style Sleek Circular Back Button */}
              <button
                onClick={() => setActiveUser(null)}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center flex-shrink-0 active:scale-95 shadow-sm border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
                title="Back to Conversations"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* User Avatar & Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <Avatar src={activeUser.avatar || activeUser.profileImage} size="md" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-1">
                    {activeUser.name || activeUser.fullName}
                    {activeUser.verified && <VerifiedBadge className="w-3.5 h-3.5 text-cyan-400" />}
                  </h3>
                  {partnerIsTyping ? (
                    <p className="text-[10px] text-brand-600 dark:text-cyan-400 font-bold flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" /> typing...
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Now
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setReportModal({
                  open: true,
                  type: 'user',
                  id: activeUser.id || activeUser._id,
                  label: activeUser.name || activeUser.fullName,
                })}
                className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
              >
                Report
              </button>
            </div>
          </div>

          {/* Messages Bubble Scroll Stream */}
          <div ref={messagesContainerRef} className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-4 no-scrollbar bg-slate-50/30 dark:bg-slate-950/10 overscroll-contain">
              {isLoadingMessages ? (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-400 animate-pulse">Loading chat history...</p>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isSelf = msg.isSelf || msg.senderId === (currentUser?.id || 'usr_me');

                  return (
                    <div
                      key={msg.id || msg._id}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      {/* Story Reply Rich Context Card if attached */}
                      {msg.storyRef && (msg.storyRef.storyId || msg.storyRef.media) && (
                        <div
                          className={`mb-1.5 max-w-xs sm:max-w-sm rounded-2xl overflow-hidden border p-2 text-xs flex items-center gap-2.5 backdrop-blur-md shadow-md ${isSelf
                              ? 'bg-brand-900/30 border-brand-500/30 text-white'
                              : 'bg-slate-800/80 border-slate-700 text-slate-200'
                            }`}
                        >
                          <div className="w-10 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 relative">
                            {msg.storyRef.bgGradient ? (
                              <div className={`w-full h-full ${msg.storyRef.bgGradient}`} />
                            ) : (
                              <img src={msg.storyRef.media} alt="Story" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                              <IconSparkles className="w-3 h-3" /> Replied to Story
                            </span>
                            {msg.storyRef.caption && (
                              <p className="text-[11px] font-medium truncate italic mt-0.5 opacity-90">
                                "{msg.storyRef.caption}"
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Chat Text Bubble */}
                      {msg.text && (
                        <div
                          className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm break-words ${isSelf
                              ? 'bg-gradient-to-r from-brand-600 via-brand-purple to-brand-cyan text-white rounded-br-none shadow-brand-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                            }`}
                        >
                          {msg.text}
                        </div>
                      )}

                      {/* Timestamp & Read Indicator */}
                      <div className="flex items-center gap-1 mt-1 px-1 text-[9px] text-slate-400">
                        <span>{formatTime(msg.createdAt)}</span>
                        {isSelf && <IconCheck className="w-3 h-3 text-cyan-400" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <IconSparkles className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Say hello to {activeUser.name || activeUser.fullName}!
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Start a conversation directly in {BRAND.name}.</p>
                </div>
              )}
            </div>

            {/* Story Reply Attached Banner */}
            {activeStoryContext && (
              <div className="px-4 py-2 bg-brand-500/10 dark:bg-brand-500/20 border-t border-brand-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-8 rounded overflow-hidden bg-slate-900 flex-shrink-0">
                    {activeStoryContext.bgGradient ? (
                      <div className={`w-full h-full ${activeStoryContext.bgGradient}`} />
                    ) : (
                      <img src={activeStoryContext.media || activeStoryContext.url} alt="Story" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-cyan-400 uppercase">Replying to story</p>
                    <p className="text-[11px] text-slate-300 truncate">
                      {activeStoryContext.caption || 'Story preview'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveStoryContext(null);
                    if (onClearStoryReply) onClearStoryReply();
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-full"
                >
                  <IconClose className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bottom Chat Input Form — Sticky to Bottom */}
            <form onSubmit={handleSendMessage} className="flex-shrink-0 z-30 sticky bottom-0 px-3 py-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={`Message ${activeUser.name ? activeUser.name.split(' ')[0] : 'user'}...`}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 rounded-full border border-transparent focus:border-brand-500/50 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() && !activeStoryContext}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 via-brand-purple to-cyan-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer touch-manipulation flex-shrink-0"
                aria-label="Send message"
              >
                <IconSend className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-slate-950/20">
            <div>
              <IconMessage className="w-12 h-12 text-brand-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Direct Messages</h3>
              <p className="text-xs text-slate-400 mt-1">Select a conversation from the sidebar to chat.</p>
            </div>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={reportModal.open}
        onClose={() => setReportModal((prev) => ({ ...prev, open: false }))}
        targetType={reportModal.type}
        targetId={reportModal.id}
        targetLabel={reportModal.label}
      />
    </>
  );
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatShortTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}
