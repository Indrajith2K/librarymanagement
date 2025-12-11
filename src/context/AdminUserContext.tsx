
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

interface AdminUser {
    uid?: string;
    email?: string;
    role?: string;
    displayName?: string;
    staffId?: string;
}

interface AdminUserContextType {
    adminUser: AdminUser | null;
    loading: boolean;
}

const AdminUserContext = createContext<AdminUserContextType | undefined>(undefined);

export function AdminUserProvider({ children }: { children: ReactNode }) {
    const firestore = useFirestore();
    const { user: authUser, loading: authLoading } = useUser();
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
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

                if (authUser) {
                    q = query(adminUsersRef, where('email', '==', authUser.email));
                } else {
                    const staffId = sessionStorage.getItem('admin_staff_id');
                    if (staffId) {
                        q = query(adminUsersRef, where('staffId', '==', staffId));
                    } else {
                        setAdminUser(null);
                        setLoading(false);
                        return;
                    }
                }

                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    setAdminUser(userDoc.data() as AdminUser);
                } else {
                    setAdminUser(null);
                }
            } catch (error) {
                console.error("Failed to fetch admin user data:", error);
                setAdminUser(null);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchAdminUser();
        }
    }, [firestore, authUser, authLoading]);

    const value = { adminUser, loading: authLoading || loading };

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
