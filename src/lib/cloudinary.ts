import { PRODUCTION_CLOUDINARY_CLOUD, PRODUCTION_CLOUDINARY_PRESET } from '../config/public';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || PRODUCTION_CLOUDINARY_CLOUD;
const PRESETS = [
  ...new Set(
    [
      process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      PRODUCTION_CLOUDINARY_PRESET,
      'keralasellers_preset',
    ].filter((preset): preset is string => Boolean(preset)),
  ),
];

export async function uploadImage(uri: string): Promise<string> {
  let lastError: unknown;
  for (const preset of PRESETS) {
    try {
      const body = new FormData();
      body.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      } as unknown as Blob);
      body.append('upload_preset', preset);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body,
      });
      const data = await response.json();
      if (data?.secure_url) return data.secure_url as string;
      lastError = data?.error?.message || 'Upload failed';
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(typeof lastError === 'string' ? lastError : 'Could not upload image');
}
