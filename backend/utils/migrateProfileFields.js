const User = require('../models/User');
const DEMO_USERS = require('../scripts/demoData');

/**
 * Automatically migrates existing demo/real users to ensure
 * all have valid city, maritalStatus, dateOfBirth, job, and education values.
 */
async function autoMigrateProfileFields() {
  try {
    const demoMap = new Map();
    DEMO_USERS.forEach((du) => {
      demoMap.set(du.username.toLowerCase(), du);
    });

    const allUsers = await User.find({});
    let migratedCount = 0;

    for (const u of allUsers) {
      let needsSave = false;
      const demoData = demoMap.get(u.username?.toLowerCase());

      // If it's a demo user, apply varied realistic demo values if missing or old
      if (demoData) {
        if (!u.job || u.job === 'Developer' || u.job === 'Graphic Designer' || u.job === 'Designer' || u.job === 'Creator') {
          u.job = demoData.job;
          needsSave = true;
        }
        if (!u.city) {
          u.city = demoData.city;
          needsSave = true;
        }
        if (!u.maritalStatus) {
          u.maritalStatus = demoData.maritalStatus;
          needsSave = true;
        }
        if (!u.dateOfBirth) {
          u.dateOfBirth = demoData.dateOfBirth;
          needsSave = true;
        }
        if (!u.school) {
          u.school = demoData.school;
          needsSave = true;
        }
        if (!u.college) {
          u.college = demoData.college;
          needsSave = true;
        }
        if (!u.university) {
          u.university = demoData.university;
          needsSave = true;
        }
      } else {
        // Real user: migrate old title/location if empty
        if (!u.job && u.title) {
          u.job = u.title;
          needsSave = true;
        }
        if (!u.city && u.location) {
          u.city = u.location;
          needsSave = true;
        }
      }

      if (needsSave) {
        await u.save({ validateBeforeSave: false });
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      console.log(`[Profile Migration] Updated profile fields for ${migratedCount} user(s).`);
    }
  } catch (err) {
    console.warn('[Profile Migration Warning]:', err.message);
  }
}

module.exports = { autoMigrateProfileFields };
