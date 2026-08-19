import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const UserStats = ({ postsCount = 0, followersCount = 0, followingCount = 0, totalLikes = 0 }) => {
  const postsRef = useRef(null);
  const followersRef = useRef(null);
  const followingRef = useRef(null);
  const likesRef = useRef(null);

  // Format large numbers cleanly (e.g. 32.8k, 148.5k)
  const formatNumber = (num) => {
    if (typeof num === 'string') return num;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const parseStatNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).toUpperCase().trim();
    if (str.endsWith('M')) return parseFloat(str) * 1000000;
    if (str.endsWith('K')) return parseFloat(str) * 1000;
    return parseFloat(str) || 0;
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gsap) {
      const gsap = window.gsap;
      const targets = [
        { ref: postsRef, val: parseStatNumber(postsCount) },
        { ref: followersRef, val: parseStatNumber(followersCount) },
        { ref: followingRef, val: parseStatNumber(followingCount) },
        { ref: likesRef, val: parseStatNumber(totalLikes) },
      ];

      targets.forEach((target) => {
        if (target.ref.current) {
          const obj = { count: 0 };
          gsap.to(obj, {
            count: target.val,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => {
              if (target.ref.current) {
                target.ref.current.innerText = formatNumber(Math.floor(obj.count));
              }
            },
          });
        }
      });
    }
  }, [postsCount, followersCount, followingCount, totalLikes]);

  const stats = [
    { label: 'Posts', value: formatNumber(postsCount), ref: postsRef, color: 'from-brand-600 to-brand-purple', icon: '📝' },
    { label: 'Followers', value: formatNumber(followersCount), ref: followersRef, color: 'from-cyan-500 to-blue-600', icon: '👥' },
    { label: 'Following', value: formatNumber(followingCount), ref: followingRef, color: 'from-purple-500 to-pink-600', icon: '✨' },
    { label: 'Total Likes', value: formatNumber(totalLikes), ref: likesRef, color: 'from-rose-500 to-amber-500', icon: '❤️' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 my-6">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * idx, duration: 0.4 }}
          whileHover={{ y: -3, scale: 1.02 }}
          className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm sm:shadow-md hover:border-brand-500/30 transition-all text-center relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs sm:text-sm">{stat.icon}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Metric
            </span>
          </div>

          <span
            ref={stat.ref}
            className={`block text-xl sm:text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent font-mono`}
          >
            {stat.value}
          </span>

          <span className="block text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {stat.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
