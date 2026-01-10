
'use client';

import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Search, UserPlus, Trash2 } from 'lucide-react';
import { AdminUserProvider, useAdminUser } from '@/context/AdminUserContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, serverTimestamp, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface AdminUser {
  id: string;
  displayName: string;
  email?: string;
  role: 'Super Admin' | 'Librarian' | 'Assistant' | 'Logger';
  staffId?: string;
  photoURL?: string;
}

const adminUserSchema = z.object({
    displayName: z.string().min(1, "Display Name is required"),
    staffId: z.string().min(1, "Staff ID is required"),
    password: z.string().min(5, "Password must be at least 5 characters"),
    role: z.enum(['Super Admin', 'Librarian', 'Assistant', 'Logger']),
});

type AdminUserFormData = z.infer<typeof adminUserSchema>;

function AddUserForm({ onFinished }: { onFinished: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { adminUser } = useAdminUser();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<AdminUserFormData>({
        resolver: zodResolver(adminUserSchema),
        defaultValues: {
            displayName: '',
            staffId: '',
            password: '',
            role: 'Logger',
        },
    });

    async function onSubmit(values: AdminUserFormData) {
        if (!firestore || !adminUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available or you are not authorized.' });
            return;
        }
        setIsSubmitting(true);
        try {
            // Use staffId for the document ID for new users for consistency
            const userDocRef = doc(firestore, 'adminusers', values.staffId);
            
            await setDoc(userDocRef, {
                ...values,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast({ title: 'Success', description: 'New user has been created.' });
            onFinished();
            form.reset();
        } catch (error: any) {
            console.error("Error adding user: ", error);
            toast({ variant: 'destructive', title: 'Error Creating User', description: error.message || 'An error occurred.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. John Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="staffId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Staff ID</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 99xy98" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="*****" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Librarian">Librarian</SelectItem>
                                    <SelectItem value="Assistant">Assistant</SelectItem>
                                    <SelectItem value="Logger">Logger (Read-Only)</SelectItem>
                                     <SelectItem value="Super Admin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create User'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function UsersPageContent() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAddUserOpen, setAddUserOpen] = useState(false);
  const { adminUser, loading: adminLoading } = useAdminUser();

  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'adminusers'));
  }, [firestore]);

  const { data: users, loading: usersLoading, error } = useCollection<AdminUser>(usersQuery);
  
  const handleDeleteUser = async (userId: string) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
        return;
    }
    try {
        await deleteDoc(doc(firestore, 'adminusers', userId));
        toast({ title: 'Success', description: 'User has been deleted.' });
    } catch (error: any) {
        console.error("Error deleting user: ", error);
        toast({ variant: 'destructive', title: 'Error deleting user', description: error.message });
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  
  const loading = usersLoading || adminLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage administrator and staff accounts.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>User List</CardTitle>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search users..." className="pl-8" />
                    </div>
                     <Dialog open={isAddUserOpen} onOpenChange={setAddUserOpen}>
                        <DialogTrigger asChild>
                           <Button disabled={loading}><UserPlus className="mr-2 h-4 w-4" /> Add New User</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below to create a new admin or staff account.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                               <AddUserForm onFinished={() => setAddUserOpen(false)} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-6 w-32" /></div></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {!loading && users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={user.photoURL} />
                                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.displayName}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' 
                            : user.role === 'Librarian' ? 'bg-blue-100 text-blue-800' 
                            : user.role === 'Logger' ? 'bg-gray-100 text-gray-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                            {user.role}
                        </span>
                    </TableCell>
                    <TableCell>{user.staffId || 'N/A'}</TableCell>
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {adminUser?.staffId !== user.staffId && (
                       <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={loading}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                           <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user account.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {error && <p className="text-red-500 text-center p-4">Error loading users: {error.message}</p>}
            {!loading && users?.length === 0 && <p className="text-muted-foreground text-center p-4">No users found. Click "Add New User" to get started.</p>}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function UsersPage() {
    return (
        <AdminUserProvider>
            <UsersPageContent />
        </AdminUserProvider>
    )
}
