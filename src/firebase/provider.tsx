'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  firebaseApp: null,
  auth: null,
  firestore: null,
  storage: null,
});

export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
  storage,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
}) {
  const value = useMemo(() => ({ firebaseApp, auth, firestore, storage }), [firebaseApp, auth, firestore, storage]);
  
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => useFirebase().firebaseApp;
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useStorage = () => useFirebase().storage;
