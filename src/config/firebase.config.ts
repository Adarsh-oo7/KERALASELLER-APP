// src/config/firebase.config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBexLK-lgbvEHsfeVr01xrEcgMVwNaOJGQ",
  authDomain: "keralasellers.firebaseapp.com",
  projectId: "keralasellers",
  storageBucket: "keralasellers.firebasestorage.app",
  messagingSenderId: "658585155781",
  appId: "1:658585155781:android:9cda1790f303cc4f0b18ac",
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);

export { app, auth };
export default app;
