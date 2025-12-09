'use client';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Provides a single, idempotent way to initialize Firebase.
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } else {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }
  return { firebaseApp, auth, firestore };
}

export { initializeFirebase };
export * from './provider';
export * from './auth/use-user';

    