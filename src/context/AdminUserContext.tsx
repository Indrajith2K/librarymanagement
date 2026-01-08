
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
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
                    let userData = userDoc.data() as AdminUser;
                    setAdminUserDocId(userDoc.id);

                    // This is the critical fix. Ensure the main admin has the Super Admin role.
                    // If their role is not 'Super Admin', update it in the database.
                    if (userData.staffId === '23di21' && userData.role !== 'Super Admin') {
                        console.log("Correcting user 23di21 role to Super Admin...");
                        const userRef = doc(firestore, 'adminusers', userDoc.id);
                        await updateDoc(userRef, { role: 'Super Admin' });
                        userData.role = 'Super Admin'; // Update local state immediately
                    }
                     setAdminUser(userData);

                } else {
                    // This handles the very first time the 23di21 user logs in.
                    if (staffId === '23di21') {
                        console.log("First-time setup for Super Admin 23di21...");
                        const batch = writeBatch(firestore);
                        const newUserRef = doc(collection(firestore, 'adminusers'));
                        const newUserData = {
                            staffId: '23di21',
                            password: '12345', // As per original login logic
                            displayName: 'Main Admin',
                            role: 'Super Admin',
                        };
                        batch.set(newUserRef, newUserData);
                        await batch.commit();
                        setAdminUser(newUserData);
                        setAdminUserDocId(newUserRef.id);
                    } else {
                        setAdminUser(null);
                        setAdminUserDocId(null);
                    }
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
