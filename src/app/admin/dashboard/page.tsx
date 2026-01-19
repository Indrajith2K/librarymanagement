
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, BookUp, MoreHorizontal, Users2, Library, BookX, ChevronLeft, ChevronRight } from "lucide-react";
import Image from 'next/image';
import { useAdminUser, AdminUserProvider } from '@/context/AdminUserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Member {
  id: string;
  name: string;
  email: string;
  memberType: 'student' | 'staff';
}

interface Book {
  id: string;
  title: string;
  author: string;
  status: 'available' | 'issued' | 'lost' | 'damaged' | 'reserved';
}

const overdueBooks = [
  { userId: '10021', userName: 'Alex Ray', bookId: '#B-10021-30', title: 'Ancestor Trouble', author: 'Maud Newton', overdue: '3 days', status: 'Returned (late)', fine: 'BDT. 150' },
  { userId: '12034', userName: 'Sophia', bookId: '#B-32521-31', title: 'Life Is Everywhere', author: 'Lucy Ives', overdue: '1 day', status: 'Delay', fine: 'BDT. 50' },
  { userId: '22987', userName: 'Jhon', bookId: '#G-95501-31', title: 'Stroller', author: 'Amanda Parrish', overdue: '5 days', status: 'Returned (late)', fine: 'BDT. 250' },
  { userId: '53272', userName: 'Rose', bookId: '#R-773521-67', title: 'The Secret Syllabus', author: 'Terence C. Burnhum', overdue: '-', status: 'Returned', fine: '-' },
];

const issuedBooks = [
  { userId: '10021', bookTitle: 'Ancestor Trouble', bookAuthor: 'Maud Newton', issueDate: '20 Dec, 2022', returnDate: '21 Dec, 2022', image: 'https://picsum.photos/seed/ancestor-trouble/40/60' },
  { userId: '12034', bookTitle: 'Life Is Everywhere', bookAuthor: 'Lucy Ives', issueDate: '23 Dec, 2022', returnDate: '26 Dec, 2022', image: 'https://picsum.photos/seed/life-everywhere/40/60' },
  { userId: '22987', bookTitle: 'Stroller', bookAuthor: 'Amanda Parrish', issueDate: '23 Dec, 2022', returnDate: '28 Dec, 2022', image: 'https://picsum.photos/seed/stroller-book/40/60' },
  { userId: '53272', bookTitle: 'The Secret Syllabus', bookAuthor: 'Terence C. Burnhum', issueDate: '31 Dec, 2022', returnDate: '3 Jan, 2023', image: 'https://picsum.photos/seed/secret-syllabus/40/60' },
  { userId: '06787', bookTitle: 'A Brief History of Time', bookAuthor: 'Stephen Hawking', issueDate: '1 Jan, 2023', returnDate: '6 Jan, 2023', image: 'https://picsum.photos/seed/brief-history/40/60' },
];

const statsData = [
    { name: 'SAT', visitors: 28, borrowers: 45 },
    { name: 'SUN', visitors: 75, borrowers: 35 },
    { name: 'MON', visitors: 12, borrowers: 62 },
    { name: 'TUE', visitors: 98, borrowers: 75 },
    { name: 'WED', visitors: 15, borrowers: 18 },
    { name: 'THU', visitors: 8, borrowers: 28 },
    { name: 'FRI', visitors: 32, borrowers: 85 },
];


function AdminDashboardContent() {
  const { user, loading: authLoading } = useUser();
  const { adminUser, loading: adminUserLoading } = useAdminUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const membersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'members'));
  }, [firestore]);

  const booksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'books'));
  }, [firestore]);

  const { data: members, loading: membersLoading, error: membersError } = useCollection<Member>(membersQuery);
  const { data: books, loading: booksLoading, error: booksError } = useCollection<Book>(booksQuery);


  const loading = authLoading || adminUserLoading;

  useEffect(() => {
    const isPasswordAdmin = !!sessionStorage.getItem('admin_doc_id');
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
  
  const isPasswordAdmin = !!sessionStorage.getItem('admin_doc_id');
  if (!user && !isPasswordAdmin) {
     return (
         <div className="flex items-center justify-center min-h-screen">
            <p>Redirecting to login...</p>
        </div>
    );
  }
  
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
                        <Users2 className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1223</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Borrowed Books</CardTitle>
                        <Library className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">740</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
                        <BookX className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">22</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Members</CardTitle>
                        <UserPlus className="h-5 w-5 text-primary" />
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
                            <Button variant="outline" size="sm" onClick={() => router.push('/admin/members')}><UserPlus className="mr-2 h-4 w-4" /> Add New User</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Books Issued</TableHead>
                                    <TableHead>Member Type</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {membersLoading && Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))}
                                {!membersLoading && members?.slice(0, 4).map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={`https://i.pravatar.cc/40?u=${member.id}`} />
                                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            {member.name}
                                        </TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>0</TableCell>
                                        <TableCell className="capitalize">{member.memberType}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {membersError && <p className="text-red-500 text-center p-4">Error: {membersError.message}</p>}
                         <div className="text-right mt-4 pr-6">
                            <Button variant="link" className="text-primary" onClick={() => router.push('/admin/members')}>See All</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-0">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Books List</CardTitle>
                            <Button variant="outline" size="sm" onClick={() => router.push('/admin/books')}><BookUp className="mr-2 h-4 w-4" /> Add New Book</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {booksLoading && Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))}
                                {!booksLoading && books?.slice(0, 4).map((book) => (
                                    <TableRow key={book.id}>
                                        <TableCell className="font-medium">{book.title}</TableCell>
                                        <TableCell>{book.author}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                                                book.status === 'available' ? 'bg-green-100 text-green-800' 
                                                : book.status === 'issued' ? 'bg-yellow-100 text-yellow-800' 
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {book.status}
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
                        {booksError && <p className="text-red-500 text-center p-4">Error: {booksError.message}</p>}
                         <div className="text-right mt-4 pr-6">
                            <Button variant="link" className="text-primary" onClick={() => router.push('/admin/books')}>See All</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div>
                <h2 className="text-2xl font-bold mb-4">Top Choices</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {topChoices.map((book) => (
                        <div key={book.title} className="space-y-2">
                            <Image src={book.imageUrl} alt={book.title} width={200} height={300} className="rounded-md w-full object-cover aspect-[2/3] shadow-lg" data-ai-hint={book.imageHint}/>
                            <h3 className="font-semibold text-sm truncate">{book.title}</h3>
                            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                        </div>
                    ))}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Overdue Book List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden sm:table-cell">User ID</TableHead>
                                <TableHead>User Name</TableHead>
                                <TableHead className="hidden lg:table-cell">Book ID</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead className="hidden lg:table-cell">Author</TableHead>
                                <TableHead>Overdue</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Fine</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {overdueBooks.map((book) => (
                                <TableRow key={book.bookId}>
                                    <TableCell className="hidden sm:table-cell">{book.userId}</TableCell>
                                    <TableCell className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={`https://i.pravatar.cc/40?u=${book.userId}`} />
                                            <AvatarFallback>{book.userName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {book.userName}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">{book.bookId}</TableCell>
                                    <TableCell>{book.title}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{book.author}</TableCell>
                                    <TableCell>{book.overdue}</TableCell>
                                    <TableCell>
                                      <span className={book.status === 'Delay' ? 'text-red-500' : book.status === 'Returned' ? 'text-green-500' : ''}>
                                        {book.status}
                                      </span>
                                    </TableCell>
                                    <TableCell>{book.fine}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button variant="outline" size="sm"><ChevronLeft className="h-4 w-4" /> </Button>
                        <Button variant="outline" size="sm">1</Button>
                        <Button variant="outline" size="sm">2</Button>
                        <Button variant="outline" size="sm">3</Button>
                        <Button variant="outline" size="sm">4</Button>
                        <Button variant="outline" size="sm">5</Button>
                        <Button variant="outline" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <Card className="xl:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Books Issued</CardTitle>
                        <Button variant="outline">Issue Book</Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden sm:table-cell">User ID</TableHead>
                                    <TableHead>Book</TableHead>
                                    <TableHead>Issue Date</TableHead>
                                    <TableHead>Return Date</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {issuedBooks.map((book) => (
                                    <TableRow key={book.userId}>
                                        <TableCell className="hidden sm:table-cell">{book.userId}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Image src={book.image} alt={book.bookTitle} width={40} height={60} className="rounded" />
                                                <div>
                                                    <p className="font-medium">{book.bookTitle}</p>
                                                    <p className="text-sm text-muted-foreground">{book.bookAuthor}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{book.issueDate}</TableCell>
                                        <TableCell>{book.returnDate}</TableCell>
                                        <TableCell><Button variant="link" className="text-primary p-0">View Details</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Visitors & Borrowers Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{fill: 'hsl(var(--accent))'}}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                    }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="visitors" fill="hsl(var(--chart-1))" name="Visitors" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="borrowers" fill="hsl(var(--chart-2))" name="Borrowers" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
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
