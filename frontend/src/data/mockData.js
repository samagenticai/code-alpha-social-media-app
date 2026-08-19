// Mock data for Synora Social Platform

export const currentUser = {
  id: 'usr_me',
  name: 'Alex Rivera',
  handle: '@alexrivera',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  job: 'Product Designer',
  city: 'Lahore, Pakistan',
  maritalStatus: 'Unmarried',
  dateOfBirth: '1998-05-15',
  school: 'St. Anthony High School',
  college: 'Forman Christian College',
  university: 'Lahore University of Management Sciences',
  education: {
    school: 'St. Anthony High School',
    college: 'Forman Christian College',
    university: 'Lahore University of Management Sciences',
  },
  bio: 'Creative Technologist & Spatial UI Architect building next-gen digital experiences.',
  verified: true,
  followers: '32.8K',
  following: '940',
  postsCount: '342'
};

export const stories = [
  {
    id: 'st_create',
    isCreate: true,
    user: currentUser,
  },
  {
    id: 'st_1',
    user: {
      name: 'Maya Lin',
      handle: '@mayadesign',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      verified: true
    },
    media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    type: 'image',
    hasUnseen: true,
    items: [
      {
        id: 'item_1_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        timestamp: '2h ago',
        caption: 'Sunset ocean vibes 🌊'
      },
      {
        id: 'item_1_2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
        timestamp: '1h ago',
        caption: 'Tropical paradise views 🌴'
      }
    ]
  },
  {
    id: 'st_2',
    user: {
      name: 'Liam Vance',
      handle: '@liamv',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      verified: true
    },
    media: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
    type: 'image',
    hasUnseen: true,
    items: [
      {
        id: 'item_2_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
        timestamp: '4h ago',
        caption: 'Metropolis sunset skyline 🌆'
      },
      {
        id: 'item_2_2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1477959858617-67f30ac4ce78?auto=format&fit=crop&w=800&q=80',
        timestamp: '2h ago',
        caption: 'City lights at midnight ✨'
      }
    ]
  },
  {
    id: 'st_3',
    user: {
      name: 'Zara Nova',
      handle: '@zaranova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      verified: false
    },
    media: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
    type: 'image',
    hasUnseen: false,
    items: [
      {
        id: 'item_3_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
        timestamp: '6h ago',
        caption: 'Mountain ridge trails 🏔️'
      },
      {
        id: 'item_3_2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
        timestamp: '3h ago',
        caption: 'Sunbeams through the forest 🌲'
      }
    ]
  },
  {
    id: 'st_4',
    user: {
      name: 'Devin Cole',
      handle: '@devin_c',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      verified: true
    },
    media: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    type: 'image',
    hasUnseen: false,
    items: [
      {
        id: 'item_4_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        timestamp: '8h ago',
        caption: 'Yosemite valley river reflection 🌿'
      }
    ]
  }
];

export const initialPosts = [
  {
    id: 'post_owner_1',
    user: {
      name: 'Alex Rivera',
      handle: '@alexrivera',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      verified: true,
      title: 'Professional'
    },
    timeAgo: '45m ago',
    content: 'Building next-gen spatial interfaces with fluid spring animations and real-time WebGL rendering. 🚀 Check out the new dark/light theme engine!',
    images: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80'
    ],
    likesCount: 542,
    commentsCount: 38,
    sharesCount: 76,
    savesCount: 120,
    isLiked: true,
    isSaved: false,
    comments: []
  },
  {
    id: 'post_1',
    user: {
      name: 'Elena Rostova',
      handle: '@elena_tech',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      verified: true,
      title: 'Senior AI Engineer @ Horizon Labs'
    },
    timeAgo: '14m ago',
    content: 'Just deployed our neural rendering engine core! 🚀 Reduced shading latency by 42% using custom WebGPU compute shaders. The future of 3D spatial interfaces on the web is here. What stack are you using for GPU computing this year? #WebGPU #FutureTech #ReactJS #Innovation',
    images: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1000&q=80'
    ],
    likesCount: 1420,
    commentsCount: 84,
    sharesCount: 129,
    savesCount: 310,
    isLiked: false,
    isSaved: false,
    comments: [
      {
        id: 'c1',
        user: {
          name: 'Marcus Chen',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        },
        text: 'This looks insane! Are you planning to open-source the shader benchmarks?',
        timeAgo: '8m ago',
        likes: 14
      }
    ]
  },
  {
    id: 'post_2',
    user: {
      name: 'Marcus Chen',
      handle: '@marcus_ui',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      verified: true,
      title: 'Principal Motion Designer'
    },
    timeAgo: '1h ago',
    content: 'Sneak peek at the spatial gesture UI prototype I crafted for mobile web apps. Smooth spring physics, liquid glass elevation, and haptic feedback make all the difference in modern UX. 🔊 Sound ON',
    images: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80'
    ],
    likesCount: 2890,
    commentsCount: 176,
    sharesCount: 340,
    savesCount: 890,
    isLiked: true,
    isSaved: true,
    comments: []
  },
  {
    id: 'post_3',
    user: {
      name: 'Sophia Thorne',
      handle: '@sophiathorne',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      verified: true,
      title: 'Architectural Photographer'
    },
    timeAgo: '3h ago',
    content: 'Neon reflections in Tokyo after midnight. Capturing cybernetic aesthetics in urban architecture. 🌌 Slide to see all frames from this set.',
    images: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1000&q=80'
    ],
    likesCount: 4520,
    commentsCount: 230,
    sharesCount: 610,
    savesCount: 1420,
    isLiked: false,
    isSaved: false,
    comments: []
  }
];

// 1. Creator / Community Spotlight
export const creatorSpotlight = [
  {
    id: 'cs1',
    name: 'Kaelen Vance',
    handle: '@kaelen_v',
    profession: '3D Shader Artist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    verified: true,
    followers: '45.2K',
    isFollowing: false
  },
  {
    id: 'cs2',
    name: 'Aria Sterling',
    handle: '@aria_music',
    profession: 'Generative Audio Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    verified: true,
    followers: '89.1K',
    isFollowing: false
  },
  {
    id: 'cs3',
    name: 'Nora Thorne',
    handle: '@norastyle',
    profession: 'Product Architect',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    verified: false,
    followers: '18.4K',
    isFollowing: false
  }
];

export const communitySpotlight = creatorSpotlight;

// 2. Daily Inspiration Card Data
export const dailyInspiration = {
  quote: "The future belongs to those who build it. Create with purpose and design without limits.",
  author: "Synora Vision Engine",
  tag: "DAILY INSPIRATION"
};

export const todaysInspiration = dailyInspiration;

// 3. Activity Summary Stats Data
export const activitySummary = [
  { id: 'as1', label: 'New Followers', value: '+1,240', change: '+18%', color: 'from-cyan-500 to-blue-600' },
  { id: 'as2', label: "Today's Posts", value: '+34', change: '+12%', color: 'from-purple-500 to-indigo-600' },
  { id: 'as3', label: 'Likes Received', value: '+4,890', change: '+24%', color: 'from-emerald-500 to-teal-600' },
  { id: 'as4', label: 'Videos Uploaded', value: '+12', change: '+8%', color: 'from-amber-500 to-rose-600' }
];

export const platformStats = activitySummary;

// 4. Quick Actions Data
export const quickActions = [
  { id: 'qa1', title: 'Create Post', action: 'create_post', iconName: 'plus', color: 'bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-500/30' },
  { id: 'qa2', title: 'Upload Video', action: 'upload_video', iconName: 'video', color: 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30' },
  { id: 'qa3', title: 'Saved Posts', action: 'saved_posts', iconName: 'bookmark', color: 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30' },
  { id: 'qa4', title: 'Edit Profile', action: 'edit_profile', iconName: 'user', color: 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' }
];

// 5. Recent Connections Data
export const recentConnections = [
  {
    id: 'rc1',
    name: 'Elena Rostova',
    handle: '@elena_tech',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    online: true,
    connectedAgo: '2h ago'
  },
  {
    id: 'rc2',
    name: 'Marcus Chen',
    handle: '@marcus_ui',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    online: true,
    connectedAgo: '5h ago'
  },
  {
    id: 'rc3',
    name: 'Sophia Thorne',
    handle: '@sophiathorne',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    online: false,
    connectedAgo: '1d ago'
  }
];

export const trendingTopics = [
  { id: 't1', category: 'Technology · Trending', tag: '#WebGPU', posts: '48.2K posts', badge: 'Hot' },
  { id: 't2', category: 'Design · Featured', tag: '#Glassmorphism', posts: '32.1K posts', badge: 'Popular' },
  { id: 't3', category: 'AI & Future', tag: '#SpatialUX', posts: '89.5K posts', badge: 'Rising' },
  { id: 't4', category: 'Development', tag: '#React19', posts: '112.4K posts' }
];
