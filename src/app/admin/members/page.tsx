'use client';

import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Search, UserPlus } from 'lucide-react';
import { AdminUserProvider } from '@/context/AdminUserContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';


interface Member {
  id: string;
  name: string;
  email: string;
  memberType: 'student' | 'staff';
  rfidCardId?: string;
  isActive: boolean;
}

const memberSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    memberType: z.enum(['student', 'staff']),
    rfidCardId: z.string().optional(),
    isActive: z.boolean().default(true),
});

type MemberFormData = z.infer<typeof memberSchema>;

function AddMemberForm({ onFinished }: { onFinished: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<MemberFormData>({
        resolver: zodResolver(memberSchema),
        defaultValues: {
            name: '',
            email: '',
            memberType: 'student',
            rfidCardId: '',
            isActive: true,
        },
    });

    async function onSubmit(values: MemberFormData) {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'members'), {
                ...values,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Success', description: 'New member has been added.' });
            onFinished();
            form.reset();
        } catch (error: any) {
            console.error("Error adding member: ", error);
            toast({ variant: 'destructive', title: 'Error adding member', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Jane Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. jane.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="memberType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Member Type</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a member type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="rfidCardId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>RFID Card ID (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Account Status</FormLabel>
                                <p className="text-sm text-muted-foreground">Set account to active or inactive.</p>
                            </div>
                             <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Member'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function MembersPageContent() {
  const firestore = useFirestore();
  const [isAddMemberOpen, setAddMemberOpen] = useState(false);

  const membersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'members'));
  }, [firestore]);

  const { data: members, loading, error } = useCollection<Member>(membersQuery);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Members</h1>
            <p className="text-muted-foreground">Manage library member information.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Member List</CardTitle>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search members..." className="pl-8" />
                    </div>
                     <Dialog open={isAddMemberOpen} onOpenChange={setAddMemberOpen}>
                        <DialogTrigger asChild>
                           <Button><UserPlus className="mr-2 h-4 w-4" /> Add New Member</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Member</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below to add a new member to the system.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                               <AddMemberForm onFinished={() => setAddMemberOpen(false)} />
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Member Type</TableHead>
                  <TableHead>RFID Card ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))}
                {!loading && members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                        {member.name}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell className="capitalize">{member.memberType}</TableCell>
                    <TableCell>{member.rfidCardId || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {error && <p className="text-red-500 text-center p-4">Error loading members: {error.message}</p>}
            {!loading && members?.length === 0 && <p className="text-muted-foreground text-center p-4">No members found. Click "Add New Member" to get started.</p>}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function MembersPage() {
    return (
        <AdminUserProvider>
            <MembersPageContent />
        </AdminUserProvider>
    )
}
