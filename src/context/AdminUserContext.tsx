
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
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

    useEffect(() => {
        const fetchAdminUser = async () => {
            if (!firestore) {
                setLoading(false);
                return;
            }
            
            setLoading(true);

            try {
                const adminUsersRef = collection(firestore, 'adminusers');
                let q;

                const staffId = sessionStorage.getItem('admin_staff_id');

                if (authUser) {
                    q = query(adminUsersRef, where('email', '==', authUser.email));
                } else if (staffId) {
                    q = query(adminUsersRef, where('staffId', '==', staffId));
                } else {
                    setAdminUser(null);
                    setAdminUserDocId(null);
                    setLoading(false);
                    return;
                }

                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userData = userDoc.data() as AdminUser;
                    
                    // This is the critical fix. Ensure the main admin has the Super Admin role.
                    if (userData.staffId === '23di21') {
                        userData.role = 'Super Admin';
                    }

                    setAdminUser(userData);
                    setAdminUserDocId(userDoc.id);
                } else {
                    setAdminUser(null);
                    setAdminUserDocId(null);
                }
            } catch (error) {
                console.error("Failed to fetch admin user data:", error);
                setAdminUser(null);
                setAdminUserDocId(null);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchAdminUser();
        }
    }, [firestore, authUser, authLoading]);
    
    const updateAdminUser = async (data: Partial<AdminUser>) => {
        if (!firestore || !adminUserDocId) {
            throw new Error("Firestore not available or user not found.");
        }
        const userDocRef = doc(firestore, 'adminusers', adminUserDocId);
        await updateDoc(userDocRef, data);
        setAdminUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
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
