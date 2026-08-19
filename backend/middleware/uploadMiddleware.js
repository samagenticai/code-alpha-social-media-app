const multer = require('multer');

// Store files in memory buffer before streaming to Cloudinary
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'video/mp4',
  'video/quicktime',
  'video/webm',
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed formats: JPG, JPEG, PNG, WEBP, MP4, MOV, WEBM.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max limit
  },
});

module.exports = upload;
