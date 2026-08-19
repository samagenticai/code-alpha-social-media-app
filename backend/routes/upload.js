const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');

/**
 * Signed params for direct browser → Cloudinary upload.
 * Required on Vercel: serverless request bodies are capped (~4.5MB), so videos
 * and large images must bypass the Express body and go straight to Cloudinary.
 */
router.post('/signature', protect, (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured on the server.',
      });
    }

    const folderType = String(req.body.folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const folder = `nexora/${folderType || 'general'}`;
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return res.status(200).json({
      success: true,
      data: {
        cloudName,
        apiKey,
        timestamp,
        signature,
        folder,
      },
    });
  } catch (error) {
    console.error('Upload signature error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create upload signature.',
    });
  }
});

// POST /api/upload/single - Upload a single media file to Cloudinary (via Express)
router.post('/single', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const folderType = req.body.folder || 'general';
    const isVideo = req.file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: `nexora/${folderType}`,
      resource_type: resourceType,
    });

    return res.status(200).json({
      success: true,
      message: 'Media uploaded successfully to Cloudinary.',
      data: {
        secure_url: uploadResult.secure_url,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        publicId: uploadResult.public_id,
        resource_type: uploadResult.resource_type,
        resourceType: uploadResult.resource_type,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      },
    });
  } catch (error) {
    console.error('Single file upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload media to Cloudinary.',
    });
  }
});

// POST /api/upload/multiple - Upload multiple media files to Cloudinary
router.post('/multiple', protect, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const folderType = req.body.folder || 'posts';

    const uploadPromises = req.files.map((file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';

      return uploadToCloudinary(file.buffer, {
        folder: `nexora/${folderType}`,
        resource_type: resourceType,
      });
    });

    const results = await Promise.all(uploadPromises);

    const uploadedMedia = results.map((result) => ({
      secure_url: result.secure_url,
      url: result.secure_url,
      public_id: result.public_id,
      publicId: result.public_id,
      resource_type: result.resource_type,
      resourceType: result.resource_type,
      format: result.format,
    }));

    return res.status(200).json({
      success: true,
      message: 'Media files uploaded successfully.',
      data: uploadedMedia,
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload media files to Cloudinary.',
    });
  }
});

// DELETE /api/upload - Delete asset from Cloudinary using publicId
router.delete('/', protect, async (req, res) => {
  try {
    const { publicId, resourceType } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'publicId is required.' });
    }

    const result = await deleteFromCloudinary(publicId, resourceType || 'image');
    return res.status(200).json({
      success: true,
      message: 'Cloudinary asset deleted successfully.',
      data: result,
    });
  } catch (error) {
    console.error('Delete media error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete media from Cloudinary.',
    });
  }
});

module.exports = router;
