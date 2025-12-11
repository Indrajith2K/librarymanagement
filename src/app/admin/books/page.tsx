'use client';

import { useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookUp, MoreHorizontal, Search } from 'lucide-react';
import { AdminUserProvider } from '@/context/AdminUserContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface Book {
  id: string;
  title: string;
  author: string;
  rfidTagId: string;
  status: 'available' | 'issued' | 'lost' | 'damaged' | 'reserved';
}

function BooksPageContent() {
  const firestore = useFirestore();

  const booksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'books'));
  }, [firestore]);

  const { data: books, loading, error } = useCollection<Book>(booksQuery);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Books</h1>
          <p className="text-muted-foreground">Manage the library's book collection.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Book List</CardTitle>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search books..." className="pl-8" />
                    </div>
                    <Button><BookUp className="mr-2 h-4 w-4" /> Add New Book</Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFID Tag ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))}
                {!loading && books?.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>{book.rfidTagId || book.id}</TableCell>
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
             {error && <p className="text-red-500 text-center p-4">Error loading books: {error.message}</p>}
            {!loading && books?.length === 0 && <p className="text-muted-foreground text-center p-4">No books found.</p>}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function BooksPage() {
    return (
        <AdminUserProvider>
            <BooksPageContent />
        </AdminUserProvider>
    )
}
