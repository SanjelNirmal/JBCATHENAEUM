import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported, type Analytics } from "firebase/analytics";
import { getMessaging, isSupported as messagingSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error("firebase_web_configuration_missing");
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined" || !(await messagingSupported())) return null;
  return getMessaging(getFirebaseApp());
}

export async function initializeFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined" || !firebaseConfig.measurementId) return null;
  try {
    return (await analyticsSupported()) ? getAnalytics(getFirebaseApp()) : null;
  } catch {
    return null;
  }
}
