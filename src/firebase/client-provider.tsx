'use client';

import { ReactNode, useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

// This component ensures that Firebase is initialized only once on the client-side.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseInstances = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseInstances.firebaseApp}
      auth={firebaseInstances.auth}
      firestore={firebaseInstances.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
