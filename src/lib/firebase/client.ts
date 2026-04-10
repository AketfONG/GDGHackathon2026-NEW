"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const hasClientConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

export const firebaseApp = hasClientConfig ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const googleProvider = firebaseApp ? new GoogleAuthProvider() : null;

export async function initFirebaseAnalytics() {
  if (!firebaseApp || typeof window === "undefined") return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getAnalytics(firebaseApp);
}
