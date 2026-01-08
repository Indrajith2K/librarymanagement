
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, addDoc } from 'firebase/firestore';
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
        if (!firestore || authLoading) {
            return;
        }

        setLoading(true);
        
        try {
            const adminUsersRef = collection(firestore, 'adminusers');
            const staffId = sessionStorage.getItem('admin_staff_id');

            let userDocSnapshot;
            let querySource: 'google' | 'staff' | 'none' = 'none';

            // Give priority to staffId login, then check for Google auth user
            if (staffId) {
                const q = query(adminUsersRef, where('staffId', '==', staffId));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    userDocSnapshot = querySnapshot.docs[0];
                    querySource = 'staff';
                }
            } else if (authUser) {
                const q = query(adminUsersRef, where('email', '==', authUser.email));
                const querySnapshot = await getDocs(q);
                 if (!querySnapshot.empty) {
                    userDocSnapshot = querySnapshot.docs[0];
                    querySource = 'google';
                }
            }

            // If a document was found, process it
            if (userDocSnapshot) {
                let userData = userDocSnapshot.data() as AdminUser;
                const userDocId = userDocSnapshot.id;

                // **CRITICAL FIX**: If the staffId is '23di21', force-set the correct details.
                if (userData.staffId === '23di21') {
                    const correctData: Partial<AdminUser> = {
                        displayName: 'Indrajith',
                        role: 'Super Admin',
                    };

                    // If the data in the database is incorrect, update it.
                    if (userData.displayName !== correctData.displayName || userData.role !== correctData.role) {
                        const userRef = doc(firestore, 'adminusers', userDocId);
                        await updateDoc(userRef, correctData);
                        userData = { ...userData, ...correctData }; // Use corrected data immediately
                    }
                }
                
                setAdminUser(userData);
                setAdminUserDocId(userDocId);

            } else {
                // If NO document was found, check if it's the special '23di21' first-time login
                if (staffId === '23di21') {
                    const newUserData: AdminUser = {
                        staffId: '23di21',
                        displayName: 'Indrajith',
                        role: 'Super Admin',
                    };
                    
                    // Create the user with the correct details
                    const newUserRef = await addDoc(collection(firestore, 'adminusers'), { ...newUserData, password: '12345' });
                    setAdminUser(newUserData);
                    setAdminUserDocId(newUserRef.id);
                } else {
                    // No user found, clear context
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
    }, [firestore, authUser, authLoading]);

    useEffect(() => {
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
