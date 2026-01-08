'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
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

    const fetchAdminUser = useCallback(async () => {
        if (!firestore) return;

        setLoading(true);
        const staffId = sessionStorage.getItem('admin_staff_id');
        
        try {
            if (staffId) {
                // Handle password-based login
                const adminUsersRef = collection(firestore, 'adminusers');
                const q = query(adminUsersRef, where('staffId', '==', staffId));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    let userData = userDoc.data() as AdminUser;
                    
                    // Definitive fix for the Super Admin account
                    if (staffId === '23di21') {
                        const correctData = { displayName: 'Indrajith', role: 'Super Admin' };
                        if (userData.displayName !== correctData.displayName || userData.role !== correctData.role) {
                            await updateDoc(userDoc.ref, correctData);
                            userData = { ...userData, ...correctData };
                        }
                    }
                    
                    setAdminUser(userData);
                    setAdminUserDocId(userDoc.id);

                } else if (staffId === '23di21') {
                    // This is the first-time login for the Super Admin, create the user
                    const superAdminData: AdminUser & { password?: string } = {
                        staffId: '23di21',
                        displayName: 'Indrajith',
                        role: 'Super Admin',
                        password: '12345',
                    };
                    // Use `setDoc` with a predictable ID to prevent duplicates
                    const newDocRef = doc(firestore, 'adminusers', 'super_admin_23di21');
                    await setDoc(newDocRef, superAdminData);
                    setAdminUser(superAdminData);
                    setAdminUserDocId(newDocRef.id);
                }

            } else if (authUser) {
                // Handle Google Auth login
                const adminUsersRef = collection(firestore, 'adminusers');
                const q = query(adminUsersRef, where('email', '==', authUser.email));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    setAdminUser(userDoc.data() as AdminUser);
                    setAdminUserDocId(userDoc.id);
                } else {
                    setAdminUser(null);
                    setAdminUserDocId(null);
                }
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
    }, [firestore, authUser]);

    useEffect(() => {
        // Run only when firestore or authUser changes.
        fetchAdminUser();
    }, [fetchAdminUser]);
    
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
