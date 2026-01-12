import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_ENV === 'development' 
    ? "Kerala Sellers (Dev)" 
    : "Kerala Sellers",
  slug: "KeralaSellerApp",
  owner: "kerala_sellers",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  icon: "./assets/images/icon.png",
  splash: {
    image: "./assets/images/logo.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.keralasellers.app",
    infoPlist: {
      NSCameraUsageDescription: "This app requires camera access to upload product images.",
      NSPhotoLibraryUsageDescription: "This app requires photo library access to select product images."
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#0F172A"
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.keralasellers.app",
    versionCode: 1,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.RECORD_AUDIO",
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE"
    ]
  },
  web: {
    bundler: "metro",
    favicon: "./assets/images/icon.png"
  },
  plugins: [
    "expo-secure-store",
    [
      "expo-image-picker",
      {
        photosPermission: "Allow Kerala Sellers to access your photos to upload product images.",
        cameraPermission: "Allow Kerala Sellers to use your camera to take product photos."
      }
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/logo.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      }
    ]
  ],
  extra: {
    eas: {
      projectId: "2d856491-a9ec-48d1-9877-9559e79ca447"
    },
    API_URL: process.env.EXPO_PUBLIC_API_URL || "https://api.keralasellers.in",
    APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || "production",
  }
});
