import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';

/**
 * Public Firebase web config (same project as keralasellers.in).
 * Override with EXPO_PUBLIC_FIREBASE_* if the project keys rotate.
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyACMVvqqeaUPEp6KoGina_NBoyVWYgoNcg',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'keralasellers.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'keralasellers',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'keralasellers.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '658585155781',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    '1:658585155781:web:33559cbbf780e89e0b18ac',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  try {
    const { getReactNativePersistence } = require('firebase/auth') as typeof import('firebase/auth') & {
      getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
    };
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage) as never,
    });
  } catch {
    return getAuth(app);
  }
}

export const firebaseAuth = createAuth();
