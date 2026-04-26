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
  // version = user-visible (Play Store "1.0.0")
  // runtimeVersion = OTA update channel
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

  // ── Android (Play Store) ───────────────────────────────────────────────────
  android: {
    // google-services.json must be provided as an EAS Secret (GOOGLE_SERVICES_JSON)
    // or placed in the project root locally (do NOT commit it to git)
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',

    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#0F172A',
    },

    // Play Store package name — must match what you register in Play Console
    package: 'com.keralasellers.app',

    // versionCode is auto-incremented by EAS (autoIncrement: true in eas.json)
    // Do not set it manually here.

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
  plugins: [
    'expo-image',
    'expo-font',
    'expo-sharing',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    'expo-secure-store',
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
