
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, BookUp, MoreHorizontal, Users2, Library, BookX } from "lucide-react";
import Image from 'next/image';
import { useAdminUser, AdminUserProvider } from '@/context/AdminUserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

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
  quantityTotal: number;
  quantityIssued: number;
}

interface CirculationLog {
  id: string;
  bookId: string;
  memberId: string;
  action: 'issue' | 'return';
  status: 'issued' | 'returned' | 'overdue';
  issuedAt?: { seconds: number; nanoseconds: number };
  dueDate?: { seconds: number; nanoseconds: number };
}

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
  
  const recentCirculationLogsQuery = useMemo(() => {
    if (!firestore) return null;
    // Fetch the 10 most recent logs, then we will filter for 'issue' on the client
    // This avoids needing a composite index on `action` and `issuedAt`.
    return query(
        collection(firestore, 'circulationLogs'), 
        orderBy('issuedAt', 'desc'), 
        limit(10)
    );
  }, [firestore]);

  const allCirculationLogsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'circulationLogs'), where('action', '==', 'issue'));
  }, [firestore]);


  const { data: members, loading: membersLoading, error: membersError } = useCollection<Member>(membersQuery);
  const { data: books, loading: booksLoading, error: booksError } = useCollection<Book>(booksQuery);
  const { data: recentCirculationLogs, loading: recentLogsLoading, error: recentLogsError } = useCollection<CirculationLog>(recentCirculationLogsQuery);
  const { data: allCirculationLogs, loading: allLogsLoading, error: allLogsError } = useCollection<CirculationLog>(allCirculationLogsQuery);

  const enrichedIssuedBooks = useMemo(() => {
    if (!recentCirculationLogs || !books || !members) return [];
    
    // Filter client-side for issue actions and limit to 5
    const issuedLogs = recentCirculationLogs
        .filter(log => log.action === 'issue')
        .slice(0, 5);

    return issuedLogs.map(log => {
      const book = books.find(b => b.id === log.bookId);
      const member = members.find(m => m.id === log.memberId);
      
      return {
        ...log,
        bookTitle: book?.title || 'Unknown Book',
        bookAuthor: book?.author || 'Unknown Author',
        memberName: member?.name || 'Unknown Member',
      }
    });
  }, [recentCirculationLogs, books, members]);
  
  const loading = authLoading || adminUserLoading || membersLoading || booksLoading || recentLogsLoading || allLogsLoading;
  
  const topChoices = useMemo(() => {
    if (loading || !allCirculationLogs || !books) {
        return Array.from({ length: 6 }).map((_, i) => ({ id: `skeleton-${i}`, isLoading: true, title: '', author: '', imageUrl: '', imageHint: '' }));
    }

    const bookCounts = allCirculationLogs.reduce((acc, log) => {
        acc[log.bookId] = (acc[log.bookId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const sortedBookIds = Object.keys(bookCounts).sort((a, b) => bookCounts[b] - bookCounts[a]);
    const topBookIds = sortedBookIds.slice(0, 6);
    
    const topBooks = topBookIds.map(bookId => {
        const book = books.find(b => b.id === bookId);
        if (!book) return null;
        return {
            ...book,
            isLoading: false,
            imageUrl: `https://picsum.photos/seed/${book.id}/200/300`,
            imageHint: 'book cover'
        };
    }).filter((b): b is Book & { isLoading: boolean; imageUrl: string; imageHint: string } => b !== null);

    return topBooks;

  }, [allCirculationLogs, books, loading]);

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

  if (loading && !adminUser) { // More robust loading check
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Verifying session...</p>
      </div>
    );
  }
  
  const isPasswordAdmin = !!sessionStorage.getItem('admin_doc_id');
  if (!user && !isPasswordAdmin && !loading) {
     return (
         <div className="flex items-center justify-center min-h-screen">
            <p>Redirecting to login...</p>
        </div>
    );
  }

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
                                    <TableHead className="hidden md:table-cell">Email</TableHead>
                                    <TableHead className="hidden sm:table-cell">Books Issued</TableHead>
                                    <TableHead>Member Type</TableHead>
                                    <TableHead className="hidden sm:table-cell">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {membersLoading && Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-40" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-8 w-8" /></TableCell>
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
                                        <TableCell className="hidden md:table-cell">{member.email}</TableCell>
                                        <TableCell className="hidden sm:table-cell">0</TableCell>
                                        <TableCell className="capitalize">{member.memberType}</TableCell>
                                        <TableCell className="hidden sm:table-cell">
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
                                    <TableHead className="hidden sm:table-cell">Author</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden sm:table-cell">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {booksLoading && Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))}
                                {!booksLoading && books?.slice(0, 4).map((book) => {
                                    const available = book.quantityTotal - book.quantityIssued > 0;
                                    return (
                                        <TableRow key={book.id}>
                                            <TableCell className="font-medium">{book.title}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{book.author}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                                                    available ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {available ? 'Available' : 'Out of Stock'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {topChoices.map((book) => (
                        <div key={book.id} className="space-y-2">
                           {book.isLoading ? (
                                <>
                                    <Skeleton className="rounded-md w-full object-cover aspect-[2/3] shadow-lg" />
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </>
                            ) : (
                                <>
                                    <Image src={book.imageUrl} alt={book.title} width={200} height={300} className="rounded-md w-full object-cover aspect-[2/3] shadow-lg" data-ai-hint={book.imageHint}/>
                                    <h3 className="font-semibold text-sm truncate">{book.title}</h3>
                                    <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <Card className="xl:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Issues</CardTitle>
                        <Button variant="outline" onClick={() => router.push('/admin/circulation')}>Issue Book</Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden sm:table-cell">Member</TableHead>
                                    <TableHead>Book</TableHead>
                                    <TableHead>Issue Date</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-[60px] w-[40px] rounded" />
                                                <div>
                                                    <Skeleton className="h-5 w-32" />
                                                    <Skeleton className="h-4 w-24 mt-1" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    </TableRow>
                                ))}
                                {!loading && enrichedIssuedBooks.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="hidden sm:table-cell">{log.memberName}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Image src={`https://picsum.photos/seed/${log.bookId}/40/60`} alt={log.bookTitle} width={40} height={60} className="rounded" data-ai-hint="book cover" />
                                                <div>
                                                    <p className="font-medium">{log.bookTitle}</p>
                                                    <p className="text-sm text-muted-foreground">{log.bookAuthor}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{log.issuedAt ? format(log.issuedAt.seconds * 1000, 'dd MMM, yyyy') : 'N/A'}</TableCell>
                                        <TableCell>{log.dueDate ? format(log.dueDate.seconds * 1000, 'dd MMM, yyyy') : 'N/A'}</TableCell>
                                        <TableCell><Button variant="link" className="text-primary p-0">View Details</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {recentLogsError && <p className="text-red-500 text-center p-4">Error loading issued books.</p>}
                         {!loading && !recentLogsError && enrichedIssuedBooks.length === 0 && (
                             <p className="text-muted-foreground text-center p-8 border-t">No books have been issued recently.</p>
                         )}
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
