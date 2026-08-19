import React from 'react';

/**
 * Ultra-crisp vector emoji icons with vibrant gradients.
 * Eliminates blurry/pixelated Windows OS system emoji glyphs.
 */

export const EmojiHeart = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff4b72" />
        <stop offset="50%" stopColor="#ff1744" />
        <stop offset="100%" stopColor="#d50000" />
      </linearGradient>
      <filter id="heartShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#ff1744" floodOpacity="0.3" />
      </filter>
    </defs>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="url(#heartGrad)"
      filter="url(#heartShadow)"
    />
    {/* Subtle gloss highlight */}
    <ellipse cx="7.5" cy="6.5" rx="2.5" ry="1.2" transform="rotate(-30 7.5 6.5)" fill="#ffffff" fillOpacity="0.45" />
  </svg>
);

export const EmojiFlame = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="flameOuter" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ff3d00" />
        <stop offset="60%" stopColor="#ff9100" />
        <stop offset="100%" stopColor="#ffea00" />
      </linearGradient>
      <linearGradient id="flameInner" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#ffab00" />
        <stop offset="100%" stopColor="#fff9c4" />
      </linearGradient>
    </defs>
    <path
      d="M13.5 2C13.5 2 14 5 12 7C10 9 7.5 9 6.5 12C5.5 15 6 18 8 20C10 22 13 22 15.5 21C18 20 20 17 20 13C20 9 17 6 16 4C15 2 13.5 2 13.5 2Z"
      fill="url(#flameOuter)"
    />
    <path
      d="M12 21C14 21 15.5 19.5 15.5 17C15.5 14.5 13.5 13 12 11C11 13 9.5 14.5 9.5 17C9.5 19.5 10.5 21 12 21Z"
      fill="url(#flameInner)"
    />
  </svg>
);

export const EmojiClap = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="clapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffb300" />
        <stop offset="100%" stopColor="#f57c00" />
      </linearGradient>
    </defs>
    {/* Left hand */}
    <path
      d="M10.5 5.5a1.5 1.5 0 0 1 2.12 0l4.24 4.24a1.5 1.5 0 0 1-2.12 2.12L10.5 7.62a1.5 1.5 0 0 1 0-2.12z"
      fill="url(#clapGrad)"
    />
    {/* Main clapping palm */}
    <path
      d="M4.2 13.8L8.4 9.6a1.5 1.5 0 0 1 2.1 0l3.9 3.9a1.5 1.5 0 0 1 0 2.1l-4.2 4.2a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2z"
      fill="url(#clapGrad)"
    />
    {/* Motion sparkles / applause lines */}
    <path d="M14 3l1 2M18 6l2 1M11 2l.5 2.5" stroke="#f57c00" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const EmojiCelebrate = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="partyGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7c4dff" />
        <stop offset="50%" stopColor="#00b0ff" />
        <stop offset="100%" stopColor="#00e676" />
      </linearGradient>
    </defs>
    {/* Party Popper Cone */}
    <path d="M2.5 21.5l6-15 9 9-15 6z" fill="url(#partyGrad)" />
    <path d="M4 17.5l4-10 6 6-10 4z" fill="#ffeb3b" fillOpacity="0.6" />
    {/* Confetti Bursts */}
    <circle cx="16" cy="5" r="1.5" fill="#ff1744" />
    <circle cx="21" cy="9" r="1.5" fill="#00e5ff" />
    <circle cx="19" cy="15" r="1.5" fill="#ffea00" />
    <path d="M14 8l3-3M17 12l4-2M12 4l1-2" stroke="#ff9100" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const EmojiSparkles = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffe57f" />
        <stop offset="50%" stopColor="#ffd700" />
        <stop offset="100%" stopColor="#ff9100" />
      </linearGradient>
    </defs>
    <path
      d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"
      fill="url(#sparkleGrad)"
    />
    <path
      d="M19 16l1.2 3.3L23.5 20.5l-3.3 1.2L19 25l-1.2-3.3-3.3-1.2 3.3-1.2L19 16z"
      fill="#00e5ff"
      transform="scale(0.8) translate(3, -2)"
    />
  </svg>
);

export const EmojiHeartEyes = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffea00" />
        <stop offset="100%" stopColor="#ff9800" />
      </linearGradient>
    </defs>
    {/* Yellow Face */}
    <circle cx="12" cy="12" r="10" fill="url(#faceGrad)" />
    {/* Heart Eyes */}
    <path
      d="M8.5 7.5c-.8 0-1.5.6-1.5 1.3 0 1.2 1.5 2.2 1.5 2.2s1.5-1 1.5-2.2c0-.7-.7-1.3-1.5-1.3z"
      fill="#e53935"
    />
    <path
      d="M15.5 7.5c-.8 0-1.5.6-1.5 1.3 0 1.2 1.5 2.2 1.5 2.2s1.5-1 1.5-2.2c0-.7-.7-1.3-1.5-1.3z"
      fill="#e53935"
    />
    {/* Open Smile */}
    <path
      d="M8 14.5c.8 2 2.3 3 4 3s3.2-1 4-3H8z"
      fill="#5d4037"
    />
  </svg>
);
