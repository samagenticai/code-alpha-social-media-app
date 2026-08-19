import React from 'react';
import { stories as defaultMockStories, currentUser } from '../../data/mockData';
import { Avatar } from '../ui/Avatar';
import { IconPlus } from '../ui/Icons';

export const StoriesCarousel = ({ stories = [], onSelectStory, onOpenCreateStory, user }) => {
  const userAvatar = user?.avatar || currentUser.avatar;
  const displayStories = stories || [];

  // Ensure user's own story is always first after "Add Story" card
  const sortedStories = [...displayStories.filter((s) => !s.isCreate)].sort((a, b) => {
    if (a.isSelf && !b.isSelf) return -1;
    if (!a.isSelf && b.isSelf) return 1;
    return 0;
  });

  const fullStoriesList = [
    { id: 'st_create', isCreate: true },
    ...sortedStories,
  ];

  return (
    <div className="w-full mb-3.5 sm:mb-6 select-none">
      {/* Horizontal Story Rail */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 sm:py-2 px-0.5">
        {fullStoriesList.map((story, index) => {
          if (story.isCreate) {
            return (
              <div
                key={story.id}
                onClick={onOpenCreateStory}
                className="flex-shrink-0 w-20 h-32 sm:w-28 sm:h-44 rounded-xl sm:rounded-2xl relative overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer group hover:border-brand-500/80 transition-all duration-300 shadow-sm sm:shadow-md hover:shadow-lg hover:shadow-brand-500/20 hover:-translate-y-0.5"
              >
                <img
                  src={userAvatar}
                  alt="Your Profile"
                  className="w-full h-20 sm:h-28 object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 dark:opacity-100" />
                <div className="absolute bottom-2 sm:bottom-3 inset-x-0 flex flex-col items-center justify-center text-center px-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-brand-600 via-brand-purple to-brand-cyan flex items-center justify-center -mt-4 sm:-mt-6 border-2 border-white dark:border-[#070a12] text-white shadow-md shadow-brand-500/40 group-hover:scale-110 transition-transform">
                    <IconPlus className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5 sm:mt-1 leading-tight">
                    Add Story
                  </span>
                </div>
              </div>
            );
          }

          const firstItem = story.items?.[0] || {};
          const storyBgGradient = firstItem.bgGradient || story.bgGradient;

          return (
            <div
              key={story.id}
              onClick={() => onSelectStory && onSelectStory(index - 1)}
              className="flex-shrink-0 w-20 h-32 sm:w-28 sm:h-44 rounded-xl sm:rounded-2xl relative overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800/80 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/20"
            >
              {/* Media Thumbnail or Gradient */}
              {storyBgGradient ? (
                <div className={`w-full h-full ${storyBgGradient} flex items-center justify-center p-2 text-center`}>
                  {firstItem.caption && (
                    <p className="text-[9px] sm:text-xs font-bold text-white line-clamp-3 drop-shadow">
                      {firstItem.caption}
                    </p>
                  )}
                </div>
              ) : (
                <img
                  src={story.media || firstItem.url}
                  alt={story.user?.name || 'Story'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}

              {/* Gradient Overlay for Readable Text */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

              {/* Top Header: Avatar & Status Badge (Flex row prevents overlapping) */}
              <div className="absolute top-1.5 inset-x-1.5 sm:top-2 sm:inset-x-2 flex items-center justify-between gap-1 pointer-events-none z-10">
                <div
                  className={`p-0.5 rounded-full shadow-md flex-shrink-0 ${
                    story.isSelf
                      ? 'bg-gradient-to-tr from-brand-600 via-brand-purple to-brand-cyan'
                      : 'bg-gradient-to-tr from-brand-600 via-rose-500 to-amber-400'
                  }`}
                >
                  <Avatar
                    src={story.user?.avatar}
                    alt={story.user?.name}
                    size="xs"
                    className="!w-5 !h-5 sm:!w-6.5 sm:!h-6.5 border border-white dark:border-slate-900"
                  />
                </div>

                {story.isSelf && (
                  <span className="px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[8.5px] font-extrabold bg-black/70 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                    You
                  </span>
                )}
              </div>

              {/* Story User Name */}
              <div className="absolute bottom-2 left-2 right-2 sm:bottom-2.5 sm:left-2.5 sm:right-2.5">
                <p className="text-[10px] sm:text-xs font-semibold text-white truncate drop-shadow-md">
                  {story.user?.name ? story.user.name.split(' ')[0] : 'User'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
