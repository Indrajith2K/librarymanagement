
'use client';

import { useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminUserProvider } from '@/context/AdminUserContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface CirculationLog {
    id: string;
    bookId: string;
    memberId: string;
    action: 'issue' | 'return';
    issuedAt?: { seconds: number, nanoseconds: number };
    returnedAt?: { seconds: number, nanoseconds: number };
}

interface Book {
    id: string;
    title: string;
}

interface Member {
    id: string;
    name: string;
}

function HistoryPageContent() {
  const firestore = useFirestore();

  const logsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'circulationLogs'), orderBy('issuedAt', 'desc'));
  }, [firestore]);

  const booksQuery = useMemo(() => firestore ? query(collection(firestore, 'books')) : null, [firestore]);
  const membersQuery = useMemo(() => firestore ? query(collection(firestore, 'members')) : null, [firestore]);

  const { data: logs, loading: logsLoading, error: logsError } = useCollection<CirculationLog>(logsQuery);
  const { data: books, loading: booksLoading, error: booksError } = useCollection<Book>(booksQuery);
  const { data: members, loading: membersLoading, error: membersError } = useCollection<Member>(membersQuery);

  const loading = logsLoading || booksLoading || membersLoading;

  const enrichedLogs = useMemo(() => {
    if (!logs || !books || !members) return [];
    return logs.map(log => {
      const book = books.find(b => b.id === log.bookId);
      const member = members.find(m => m.id === log.memberId);
      const timestamp = log.action === 'issue' ? log.issuedAt : log.returnedAt;
      return {
        ...log,
        bookTitle: book?.title || 'Unknown Book',
        memberName: member?.name || 'Unknown Member',
        date: timestamp ? format(new Date(timestamp.seconds * 1000), 'yyyy-MM-dd hh:mm a') : 'N/A',
      };
    });
  }, [logs, books, members]);

  return (
    <AdminLayout>
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Circulation History</h1>
                <p className="text-muted-foreground">View the log of all book circulation events.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>History Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Book Title</TableHead>
                                <TableHead>Member Name</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                                </TableRow>
                            ))}
                            {!loading && enrichedLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.bookTitle}</TableCell>
                                    <TableCell>{log.memberName}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${log.action === 'issue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell>{log.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {(logsError || booksError || membersError) && <p className="text-red-500 text-center p-4">Error loading data.</p>}
                     {!loading && enrichedLogs.length === 0 && <p className="text-muted-foreground text-center p-8">No circulation history found.</p>}
                </CardContent>
            </Card>
        </div>
    </AdminLayout>
  );
}


export default function HistoryPage() {
    return (
        <AdminUserProvider>
            <HistoryPageContent />
        </AdminUserProvider>
    )
}
