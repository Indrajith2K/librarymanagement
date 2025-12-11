'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminUserProvider } from '@/context/AdminUserContext';

const logs = [
    { logId: 'LOG-001', bookTitle: 'Ancestor Trouble', memberName: 'Alex Ray', action: 'Issued', date: '2024-07-28 10:15 AM' },
    { logId: 'LOG-002', bookTitle: 'Life is Everywhere', memberName: 'Sophia', action: 'Issued', date: '2024-07-28 11:02 AM' },
    { logId: 'LOG-003', bookTitle: 'Stroller', memberName: 'Jhon', action: 'Returned', date: '2024-07-27 03:22 PM' },
    { logId: 'LOG-004', bookTitle: 'The Secret Syllabus', memberName: 'Rose', action: 'Issued', date: '2024-07-26 09:00 AM' },
    { logId: 'LOG-005', bookTitle: 'The Great Gatsby', memberName: 'Alex Ray', action: 'Returned', date: '2024-07-25 05:45 PM' },
];

function HistoryPageContent() {
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
                                <TableHead>Log ID</TableHead>
                                <TableHead>Book Title</TableHead>
                                <TableHead>Member Name</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.logId}>
                                    <TableCell>{log.logId}</TableCell>
                                    <TableCell>{log.bookTitle}</TableCell>
                                    <TableCell>{log.memberName}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 text-xs rounded-full ${log.action === 'Issued' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell>{log.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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