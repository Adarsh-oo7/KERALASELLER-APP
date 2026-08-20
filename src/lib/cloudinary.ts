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

export type CloudinaryAsset = {
  url: string;
  public_id?: string;
};

export async function uploadImageAsset(uri: string): Promise<CloudinaryAsset> {
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
      if (data?.secure_url) {
        return {
          url: data.secure_url as string,
          public_id: typeof data.public_id === 'string' ? data.public_id : undefined,
        };
      }
      lastError = data?.error?.message || 'Upload failed';
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(typeof lastError === 'string' ? lastError : 'Could not upload image');
}

export async function uploadImage(uri: string): Promise<string> {
  const uploaded = await uploadImageAsset(uri);
  return uploaded.url;
}
