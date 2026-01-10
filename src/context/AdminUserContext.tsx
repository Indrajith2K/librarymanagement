
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, query, where, doc, onSnapshot, setDoc, getDocs } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

interface AdminUser {
    uid?: string;
    email?: string;
    role?: string;
    displayName?: string;
    staffId?: string;
    photoURL?: string;
}

interface AdminUserContextType {
    adminUser: AdminUser | null;
    adminUserDocId: string | null;
    loading: boolean;
    updateAdminUser: (data: Partial<AdminUser>) => Promise<void>;
}

const AdminUserContext = createContext<AdminUserContextType | undefined>(undefined);

export function AdminUserProvider({ children }: { children: ReactNode }) {
    const firestore = useFirestore();
    const { user: authUser, loading: authLoading } = useUser();
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [adminUserDocId, setAdminUserDocId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const handleSuperAdminSetup = useCallback(async (db: any) => {
        if (!db) return;
        const q = query(collection(db, 'adminusers'), where('staffId', '==', '23di21'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            const superAdminDocRef = doc(db, 'adminusers', 'super_admin_23di21');
            const correctData = {
                staffId: '23di21',
                displayName: 'Indrajith',
                role: 'Super Admin',
                password: '12345',
            };
            try {
                await setDoc(superAdminDocRef, correctData);
            } catch (e) {
                console.error("Failed to set up Super Admin:", e);
            }
        }
    }, []);

    useEffect(() => {
        if (authLoading || !firestore) {
            return;
        }

        setLoading(true);
        let unsubscribe: (() => void) | null = null;

        const fetchUser = async () => {
            const adminDocIdFromSession = sessionStorage.getItem('admin_doc_id');

            if (adminDocIdFromSession) {
                if (adminDocIdFromSession.includes('super_admin')) {
                    await handleSuperAdminSetup(firestore);
                }
                const docRef = doc(firestore, 'adminusers', adminDocIdFromSession);
                unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setAdminUser(docSnap.data() as AdminUser);
                        setAdminUserDocId(docSnap.id);
                    } else {
                        setAdminUser(null);
                        setAdminUserDocId(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Firestore snapshot error for password user:", error);
                    setLoading(false);
                });
            } else if (authUser) {
                const q = query(collection(firestore, 'adminusers'), where('email', '==', authUser.email));
                unsubscribe = onSnapshot(q, (querySnapshot) => {
                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0];
                        setAdminUser(userDoc.data() as AdminUser);
                        setAdminUserDocId(userDoc.id);
                    } else {
                        setAdminUser(null);
                        setAdminUserDocId(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Firestore snapshot error for auth user:", error);
                    setLoading(false);
                });
            } else {
                setAdminUser(null);
                setAdminUserDocId(null);
                setLoading(false);
            }
        };

        fetchUser();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [firestore, authUser, authLoading, handleSuperAdminSetup]);
    
    const updateAdminUser = async (data: Partial<AdminUser>) => {
        if (!firestore || !adminUserDocId) {
            throw new Error("Firestore not available or user not found.");
        }
        const userDocRef = doc(firestore, 'adminusers', adminUserDocId);
        await setDoc(userDocRef, data, { merge: true });
    };

    const value = { adminUser, adminUserDocId, loading: authLoading || loading, updateAdminUser };

    return (
        <AdminUserContext.Provider value={value}>
            {children}
        </AdminUserContext.Provider>
    );
}

export function useAdminUser() {
    const context = useContext(AdminUserContext);
    if (context === undefined) {
        throw new Error('useAdminUser must be used within an AdminUserProvider');
    }
    return context;
}
