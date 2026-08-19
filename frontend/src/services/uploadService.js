import api from './api';

/** Vercel serverless body limit is ~4.5MB — use direct Cloudinary above this. */
const DIRECT_UPLOAD_THRESHOLD = 3.5 * 1024 * 1024;

const shouldUseDirectUpload = (file) => {
  if (!file) return false;
  if (file.type?.startsWith('video/')) return true;
  return file.size > DIRECT_UPLOAD_THRESHOLD;
};

/**
 * Direct browser → Cloudinary upload using a short-lived signed payload from our API.
 * Avoids sending large binaries through the Vercel serverless function.
 */
const uploadDirectToCloudinary = async (file, folder, onProgress) => {
  const sigRes = await api.post('/upload/signature', { folder });
  const { cloudName, apiKey, timestamp, signature, folder: signedFolder } =
    sigRes.data?.data || {};

  if (!cloudName || !apiKey || !timestamp || !signature) {
    throw new Error('Invalid Cloudinary signature response from server.');
  }

  const resourceType = file.type?.startsWith('video/') ? 'video' : 'image';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', signedFolder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const response = await axiosUpload(cloudinaryUrl, formData, onProgress);
  const result = response.data;

  return {
    success: true,
    message: 'Media uploaded successfully to Cloudinary.',
    data: {
      secure_url: result.secure_url,
      url: result.secure_url,
      public_id: result.public_id,
      publicId: result.public_id,
      resource_type: result.resource_type,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
    },
  };
};

/** XHR upload with progress (Cloudinary CORS). */
const axiosUpload = (url, formData, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ data });
        } else {
          reject(new Error(data.error?.message || 'Cloudinary upload failed.'));
        }
      } catch {
        reject(new Error('Invalid Cloudinary response.'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error uploading to Cloudinary.'));
    xhr.send(formData);
  });

export const uploadService = {
  /**
   * Upload a single image or video to Cloudinary.
   * Small images may go through Express; videos/large files use signed direct upload.
   */
  async uploadSingle(file, folder = 'general', onProgress) {
    try {
      if (shouldUseDirectUpload(file)) {
        return await uploadDirectToCloudinary(file, folder, onProgress);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress?.(percentCompleted);
          }
        },
      });

      return response.data;
    } catch (error) {
      // If Express rejects a large body on Vercel, fall back to direct upload
      if (
        !shouldUseDirectUpload(file) &&
        (error.response?.status === 413 || /payload|entity too large/i.test(error.message || ''))
      ) {
        return uploadDirectToCloudinary(file, folder, onProgress);
      }
      console.error('File upload failed:', error);
      throw error;
    }
  },

  async deleteMedia(publicId, resourceType = 'image') {
    try {
      const response = await api.delete('/upload', {
        data: { publicId, resourceType },
      });
      return response.data;
    } catch (error) {
      console.error('Delete Cloudinary asset failed:', error);
      throw error;
    }
  },
};
