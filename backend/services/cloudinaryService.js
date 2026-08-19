const cloudinary = require('../config/cloudinary');

/**
 * Uploads buffer stream to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from Multer
 * @param {Object} options - Upload options (folder, resource_type, format)
 * @returns {Promise<Object>} Upload result containing secure_url & public_id
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'nexora_media',
      resource_type: options.resource_type || 'auto',
      transformation: options.transformation || [
        { quality: 'auto', fetch_format: 'auto' }
      ],
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          resource_type: result.resource_type,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes media asset from Cloudinary using its public_id
 * @param {String} publicId - Cloudinary public_id
 * @param {String} resourceType - 'image', 'video', or 'raw'
 * @returns {Promise<Object>} Destroy result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return { result: 'not_provided' };

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    console.log(`Cloudinary asset deleted [${publicId}]:`, result);
    return result;
  } catch (error) {
    console.error(`Failed to delete Cloudinary asset [${publicId}]:`, error);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
