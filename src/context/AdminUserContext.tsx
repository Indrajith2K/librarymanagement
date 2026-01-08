
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

                    // This is the critical fix. Ensure the main admin has the Super Admin role and correct name.
                    if (userData.staffId === '23di21' && (userData.role !== 'Super Admin' || userData.displayName !== 'Indrajith')) {
                        console.log("Correcting user 23di21 details...");
                        const userRef = doc(firestore, 'adminusers', userDoc.id);
                        const updates: Partial<AdminUser> = {};
                        if (userData.role !== 'Super Admin') updates.role = 'Super Admin';
                        if (userData.displayName !== 'Indrajith') updates.displayName = 'Indrajith';
                        
                        await updateDoc(userRef, updates);
                        
                        userData = { ...userData, ...updates }; // Update local state immediately
                    }
                    setAdminUser(userData);

                } else {
                    // This handles the very first time the 23di21 user logs in.
                    if (staffId === '23di21') {
                        console.log("First-time setup for Super Admin 23di21...");
                        const newUserData: AdminUser = {
                            staffId: '23di21',
                            // password is intentionally not stored in the user object
                            displayName: 'Indrajith',
                            role: 'Super Admin',
                        };

                        // Use setDoc with a predictable ID if possible, but for now, we add and then find.
                        // A more robust solution might use a query for staffId to see if it exists first.
                        // For this context, assuming this else block only runs if it truly doesn't exist.
                        
                        const q = query(adminUsersRef, where("staffId", "==", staffId));
                        const existing = await getDocs(q);

                        if(existing.empty){
                             const newUserRef = doc(collection(firestore, 'adminusers'));
                             await setDoc(newUserRef, { ...newUserData, password: '12345' });
                             setAdminUser(newUserData);
                             setAdminUserDocId(newUserRef.id);
                        }
                       
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
