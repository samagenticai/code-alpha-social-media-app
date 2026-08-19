const crypto = require('crypto');

const getAdminEmail = () => (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

const getAdminPassword = () => process.env.ADMIN_PASSWORD || '';

const isAdminCredentialsConfigured = () => Boolean(getAdminEmail() && getAdminPassword());

const isAdminEmail = (email) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail || !email) return false;
  return email.trim().toLowerCase() === adminEmail;
};

const verifyAdminPassword = (password) => {
  const expected = getAdminPassword();
  if (!expected || password == null) return false;

  const provided = Buffer.from(String(password));
  const expectedBuf = Buffer.from(String(expected));

  if (provided.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(provided, expectedBuf);
};

const ensureAdminUser = async (User) => {
  const email = getAdminEmail();
  const password = getAdminPassword();
  const username = (process.env.ADMIN_USERNAME || email.split('@')[0] || 'admin').toLowerCase();
  const fullName = (process.env.ADMIN_NAME || 'Administrator').trim();

  let user = await User.findOne({ email }).select('+password');

  if (user) {
    user.role = 'admin';
    user.accountStatus = 'active';
    user.password = password;
    await user.save();
    return User.findById(user._id);
  }

  const existingUsername = await User.findOne({ username });
  const finalUsername = existingUsername ? `${username}_admin` : username;

  user = await User.create({
    fullName,
    username: finalUsername,
    email,
    password,
    role: 'admin',
    accountStatus: 'active',
    title: 'Platform Administrator',
  });

  return user;
};

module.exports = {
  getAdminEmail,
  isAdminCredentialsConfigured,
  isAdminEmail,
  verifyAdminPassword,
  ensureAdminUser,
};
