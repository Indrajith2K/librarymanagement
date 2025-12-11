'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, BookUp, MoreHorizontal, Users2, Library, BookX } from "lucide-react";
import Image from 'next/image';
import { useAdminUser, AdminUserProvider } from '@/context/AdminUserContext';

function AdminDashboardContent() {
  const { user, loading: authLoading } = useUser();
  const { adminUser, loading: adminUserLoading } = useAdminUser();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const loading = authLoading || adminUserLoading;

  useEffect(() => {
    const isPasswordAdmin = !!sessionStorage.getItem('admin_staff_id');
    if (!loading && !user && !isPasswordAdmin) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);


  useEffect(() => {
    const date = new Date();
    setCurrentDate(date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }));
    setCurrentTime(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Verifying session...</p>
      </div>
    );
  }
  
  const isPasswordAdmin = !!sessionStorage.getItem('admin_staff_id');
  if (!user && !isPasswordAdmin) {
     return (
         <div className="flex items-center justify-center min-h-screen">
            <p>Redirecting to login...</p>
        </div>
    );
  }
  
  const users = [
    { id: '10021', name: 'Alex Ray', booksIssued: 12, department: 'Psychology', avatar: '/avatars/01.png' },
    { id: '12034', name: 'Sophia', booksIssued: 7, department: 'Business', avatar: '/avatars/02.png' },
    { id: '22987', name: 'Jhon', booksIssued: 17, department: 'Computer Science', avatar: '/avatars/03.png' },
    { id: '53272', name: 'Rose', booksIssued: 25, department: 'Pharmacy', avatar: '/avatars/04.png' },
  ];
  
  const books = [
    { id: '#B-10021-30', title: 'Ancestor Trouble', author: 'Maud Newton', available: 30 },
    { id: '#B-32521-31', title: 'Life is Everywhere', author: 'Lucy Ives', available: 23 },
    { id: '#G-95501-31', title: 'Stroller', author: 'Amanda Parrish', available: 90 },
    { id: '#R-773521-67', title: 'The Secret Syllabus', author: 'Terence C. Burnhum', available: 6 },
  ];
  
  const topChoices = [
      { title: 'The Critique of Pure Reason', author: 'Immanuel Kant', imageUrl: 'https://picsum.photos/seed/critique/200/300', imageHint: 'philosophy book' },
      { title: 'Stroller', author: 'Amanda Parrish Morgan', imageUrl: 'https://picsum.photos/seed/stroller/200/300', imageHint: 'modern novel' },
      { title: 'The Design of Everyday Things', author: 'Don Norman', imageUrl: 'https://picsum.photos/seed/designdaily/200/300', imageHint: 'design book' },
      { title: 'Lean UX', author: 'Jeff Gothelf', imageUrl: 'https://picsum.photos/seed/leanux/200/300', imageHint: 'tech book' },
      { title: 'The Republic', author: 'Plato', imageUrl: 'https://picsum.photos/seed/republic/200/300', imageHint: 'classic book' },
      { title: 'Ancestor Trouble', author: 'Maud Newton', imageUrl: 'https://picsum.photos/seed/ancestor/200/300', imageHint: 'family history' },
  ];

  return (
    <AdminLayout>
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Hello, {adminUser?.displayName || 'Admin'}!</h1>
                <p className="text-muted-foreground">{currentDate} | {currentTime}</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                        <Users2 className="h-5 w-5 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1223</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Borrowed Books</CardTitle>
                        <Library className="h-5 w-5 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">740</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
                        <BookX className="h-5 w-5 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">22</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Members</CardTitle>
                        <UserPlus className="h-5 w-5 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">60</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-0">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Users List</CardTitle>
                            <Button variant="outline" size="sm"><UserPlus className="mr-2 h-4 w-4" /> Add New User</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>User Name</TableHead>
                                    <TableHead>Book Issued</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={`https://i.pravatar.cc/40?u=${user.id}`} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            {user.name}
                                        </TableCell>
                                        <TableCell>{user.booksIssued}</TableCell>
                                        <TableCell>{user.department}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <div className="text-right mt-4 pr-6">
                            <Button variant="link" className="text-pink-500">See All</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-0">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Books List</CardTitle>
                            <Button variant="outline" size="sm"><BookUp className="mr-2 h-4 w-4" /> Add New Book</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Book ID</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Available</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {books.map((book) => (
                                    <TableRow key={book.id}>
                                        <TableCell>{book.id}</TableCell>
                                        <TableCell className="font-medium">{book.title}</TableCell>
                                        <TableCell>{book.author}</TableCell>
                                        <TableCell>{book.available}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <div className="text-right mt-4 pr-6">
                            <Button variant="link" className="text-pink-500">See All</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div>
                <h2 className="text-2xl font-bold mb-4">Top Choices</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {topChoices.map((book) => (
                        <div key={book.title} className="space-y-2">
                            <Image src={book.imageUrl} alt={book.title} width={200} height={300} className="rounded-md w-full object-cover aspect-[2/3] shadow-lg" data-ai-hint={book.imageHint}/>
                            <h3 className="font-semibold text-sm truncate">{book.title}</h3>
                            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    </AdminLayout>
  );
}


export default function AdminDashboardPage() {
  return (
    <AdminUserProvider>
      <AdminDashboardContent />
    </AdminUserProvider>
  );
}

