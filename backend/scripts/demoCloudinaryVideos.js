/**
 * Demo Cloudinary videos — assigned to existing fake users (no new users).
 *
 * PRIMARY_FEED: ordered reels shown first in the feed (feedOrder 1, 2, 3…).
 * LEGACY_FEED: older demo reels appended after the primary batch.
 *
 * Optional per entry:
 *   feedOrder        — exact position in feed (lower = earlier)
 *   assignToOrder    — demoSeedOrder (1–32) for the author
 *   assignToUsername — override author by username
 *   caption
 */

const PRIMARY_FEED = [
  {
    feedOrder: 1,
    assignToOrder: 1,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955580/WhatsApp_Video_2026-08-17_at_12.35.20_PM_1_a13qnl.mp4',
    caption: 'When the vision finally clicks ✨',
  },
  {
    feedOrder: 2,
    assignToOrder: 2,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955580/WhatsApp_Video_2026-08-17_at_12.35.20_PM_b7q9mz.mp4',
    caption: 'Late night studio sessions hit different',
  },
  {
    feedOrder: 3,
    assignToOrder: 3,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955580/WhatsApp_Video_2026-08-17_at_12.33.59_PM_1_wgjfb6.mp4',
    caption: 'This moment changed everything for me',
  },
  {
    feedOrder: 4,
    assignToOrder: 4,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955583/WhatsApp_Video_2026-08-17_at_12.35.17_PM_f12qqh.mp4',
    caption: 'POV: you found your new favorite scroll',
  },
  {
    feedOrder: 5,
    assignToOrder: 5,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955711/Facebook_1056971813425067_720P_HD_hc5539.mp4',
    caption: 'Still can\'t believe we pulled this off',
  },
  {
    feedOrder: 6,
    assignToOrder: 6,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955714/WhatsApp_Video_2026-08-17_at_12.34.00_PM_v6jvw8.mp4',
    caption: 'Raw, unfiltered, and exactly what I needed to share',
  },
  {
    feedOrder: 7,
    assignToOrder: 7,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955714/This_is_too_much_720P_HD_o9qm5n.mp4',
    caption: 'Watch till the end — trust me on this one',
  },
  {
    feedOrder: 8,
    assignToOrder: 8,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955715/Eyes_are_windows_to_the_soul._%EF%B8%8F_720P_HD_okjft4.mp4',
    caption: 'The energy in this clip is unmatched 🔥',
  },
  {
    feedOrder: 9,
    assignToOrder: 9,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955726/_fbreelsfyp%E3%82%B7%E3%82%9A__fby%E3%82%B7video__fbreelsvideo__fby%E3%82%B7__fbreels__fby%E3%82%B7reelsviral__fby%E3%82%B7viralreels__fby%E3%82%B7viralfb__fby__fbviral__fbviralpost__FBVIDEO__fbtrend_nhxbyz.mp4',
    caption: 'Sharing this before I overthink it',
  },
  {
    feedOrder: 10,
    assignToOrder: 10,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955726/Pure_Mard_Samajh_Me_Hahakar_720P_HD_qftc5p.mp4',
    caption: 'If you know, you know',
  },
  {
    // Note: #11 in the source list duplicates #9 URL — skipped at assignment (no duplicate records).
    feedOrder: 11,
    assignToOrder: 11,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955726/_fbreelsfyp%E3%82%B7%E3%82%9A__fby%E3%82%B7video__fbreelsvideo__fby%E3%82%B7__fbreels__fby%E3%82%B7reelsviral__fby%E3%82%B7viralreels__fby%E3%82%B7viralfb__fby__fbviral__fbviralpost__FBVIDEO__fbtrend_nhxbyz.mp4',
    caption: 'Built this with so much heart',
  },
  {
    feedOrder: 12,
    assignToOrder: 12,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955913/Dayaram_tau_ne_ki_mout_ki_Rajmistri_funny_animal_dubbing__Dayaramtau__Khachedu__ballu__Selly__Simfoly__jhaguni__GajodharsinghSI__fyp%E3%82%B7__fbreelsfyp_tkblsz.mp4',
    caption: 'Your daily dose of inspiration',
  },
  {
    feedOrder: 13,
    assignToOrder: 13,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955915/Sorry_Madam_720P_HD_ue9sgy.mp4',
    caption: 'This is what passion looks like in motion',
  },
  {
    feedOrder: 14,
    assignToOrder: 14,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955918/Akshay_s_Roasting_Skills_on_Next_Level__akshaykumar__roast__funny__comedy__viral_360P_ntaz5x.mp4',
    caption: 'No filter, just real moments',
  },
  {
    feedOrder: 15,
    assignToOrder: 15,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786955918/Facebook_1956845408338238_720P_HD_zdkfwf.mp4',
    caption: 'Caught this on camera and had to share',
  },
  {
    feedOrder: 16,
    assignToOrder: 16,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786956001/What_if_we_kept_going_away_from_Earth_720P_HD_re0otf.mp4',
    caption: 'What a way to end the scroll',
  },
];

const LEGACY_FEED = [
  {
    feedOrder: 201,
    assignToUsername: 'tyler_nguyen',
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786905381/WhatsApp_Video_2026-08-16_at_11.31.13_PM_cgv75j.mp4',
    caption: 'Behind the scenes from tonight — raw and unfiltered 🎬',
  },
  {
    feedOrder: 202,
    assignToOrder: 17,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786906057/WhatsApp_Video_2026-08-16_at_11.31.12_PM_2_bbbi9i.mp4',
    caption: 'Golden hour energy — had to capture this ✨',
  },
  {
    feedOrder: 203,
    assignToOrder: 18,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786906089/WhatsApp_Video_2026-08-16_at_11.31.12_PM_1_s8kn8g.mp4',
    caption: 'This clip hits different every time 🔥',
  },
  {
    feedOrder: 204,
    assignToOrder: 19,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786906114/WhatsApp_Video_2026-08-16_at_11.31.12_PM_bp5xfq.mp4',
    caption: 'POV: you found your new favorite scroll',
  },
  {
    feedOrder: 205,
    assignToOrder: 20,
    videoUrl:
      'https://res.cloudinary.com/magk3lju/video/upload/v1786906135/WhatsApp_Video_2026-08-16_at_11.31.11_PM_ghtn5i.mp4',
    caption: 'Sharing this before I overthink it',
  },
];

module.exports = [...PRIMARY_FEED, ...LEGACY_FEED];
