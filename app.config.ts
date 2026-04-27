import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.EXPO_PUBLIC_APP_ENV === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  // ── Identity ──────────────────────────────────────────────────────────────
  name: IS_DEV ? 'Kerala Sellers (Dev)' : 'Kerala Sellers',
  slug: 'kerala-sellers-app',
  owner: 'adarsh-090',
  scheme: 'keralasellers',

  // ── Versioning ─────────────────────────────────────────────────────────────
  version: '1.0.0',
  runtimeVersion: {
    policy: 'appVersion',
  },

  // ── Display ────────────────────────────────────────────────────────────────
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/images/icon.png',

  splash: {
    image: './assets/images/logo.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },

  // ── iOS ────────────────────────────────────────────────────────────────────
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.keralasellers.app',
    infoPlist: {
      NSCameraUsageDescription:
        'Kerala Sellers needs camera access to upload product images.',
      NSPhotoLibraryUsageDescription:
        'Kerala Sellers needs photo library access to select product images.',
    },
  },

  // ── Android ────────────────────────────────────────────────────────────────
  android: {
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',

    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#0F172A',
    },

    package: 'com.keralasellers.app',

    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,

    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
    ],
  },

  // ── Web ───────────────────────────────────────────────────────────────────
  web: {
    bundler: 'metro',
    favicon: './assets/images/icon.png',
  },

  // ── Plugins ───────────────────────────────────────────────────────────────
  // NOTE: Only packages with an actual config plugin (app.plugin.js) go here.
  // expo-image, expo-font, expo-sharing, expo-secure-store do NOT have config
  // plugins — they are used via import only, not listed here.
  plugins: [
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow Kerala Sellers to access your photos to upload product images.',
        cameraPermission:
          'Allow Kerala Sellers to use your camera to take product photos.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/logo.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
  ],

  // ── Extra / EAS ───────────────────────────────────────────────────────────
  extra: {
    ...config.extra,
    eas: {
      projectId: '2d41715a-92fc-4294-8705-33739189f1fd',
    },
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.keralasellers.in',
    APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'production',
  },
});
