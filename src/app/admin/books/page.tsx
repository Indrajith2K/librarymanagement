'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminUserProvider } from '@/context/AdminUserContext';
import { BookUp, MoreHorizontal, Search } from 'lucide-react';

const books = [
  { id: '#B-10021-30', title: 'Ancestor Trouble', author: 'Maud Newton', available: 30, status: 'Available' },
  { id: '#B-32521-31', title: 'Life is Everywhere', author: 'Lucy Ives', available: 23, status: 'Available' },
  { id: '#G-95501-31', title: 'Stroller', author: 'Amanda Parrish', available: 90, status: 'Available' },
  { id: '#R-773521-67', title: 'The Secret Syllabus', author: 'Terence C. Burnhum', available: 0, status: 'Issued' },
  { id: '#A-12345-01', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', available: 5, status: 'Available' },
  { id: '#C-67890-02', title: 'To Kill a Mockingbird', author: 'Harper Lee', available: 2, status: 'Available' },
  { id: '#D-11121-03', title: '1984', author: 'George Orwell', available: 0, status: 'Issued' },
];

function BooksPageContent() {
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
                  <TableHead>Book ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Available Copies</TableHead>
                  <TableHead>Status</TableHead>
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
                        <span className={`px-2 py-1 text-xs rounded-full ${book.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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
