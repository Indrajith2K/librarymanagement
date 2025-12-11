'use client';

import { useMemo, useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookUp, MoreHorizontal, Search, ScanLine, Trash2 } from 'lucide-react';
import { AdminUserProvider } from '@/context/AdminUserContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
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

interface Book {
  id: string;
  title: string;
  author: string;
  rfidTagId: string;
  status: 'available' | 'issued' | 'lost' | 'damaged' | 'reserved';
}

const bookSchema = z.object({
    title: z.string().min(1, "Title is required"),
    author: z.string().min(1, "Author is required"),
    rfidTagId: z.string().min(1, "RFID Tag ID is required"),
    status: z.enum(['available', 'issued', 'lost', 'damaged', 'reserved']).default('available'),
});

type BookFormData = z.infer<typeof bookSchema>;

function AddBookForm({ onFinished }: { onFinished: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedId, setScannedId] = useState('');

    const form = useForm<BookFormData>({
        resolver: zodResolver(bookSchema),
        defaultValues: {
            title: '',
            author: '',
            rfidTagId: '',
            status: 'available',
        },
    });

    useEffect(() => {
        if (!isScanning) return;

        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Enter' && scannedId) {
            form.setValue('rfidTagId', scannedId);
            setIsScanning(false);
            setScannedId('');
            toast({ title: 'Scan Complete', description: `RFID ${scannedId} captured.` });
          } else if (event.key.length === 1) {
            setScannedId(prev => prev + event.key);
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);

    }, [isScanning, scannedId, form, toast]);

    async function onSubmit(values: BookFormData) {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'books'), {
                ...values,
                isDeleted: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Success', description: 'New book has been added.' });
            onFinished();
            form.reset();
        } catch (error: any) {
            console.error("Error adding book: ", error);
            toast({ variant: 'destructive', title: 'Error adding book', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Book Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. The Great Gatsby" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Author</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. F. Scott Fitzgerald" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="rfidTagId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>RFID Tag ID</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormControl>
                                    <Input 
                                        placeholder={isScanning ? "Scanning..." : "Enter ID or scan"} 
                                        {...field}
                                        disabled={isScanning}
                                    />
                                </FormControl>
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => {
                                        setIsScanning(prev => !prev);
                                        setScannedId('');
                                    }}
                                >
                                    <ScanLine className="h-4 w-4" />
                                    <span className="ml-2 hidden sm:inline">{isScanning ? 'Cancel' : 'Scan'}</span>
                                </Button>
                            </div>
                            {isScanning && (
                                <p className="text-sm text-primary animate-pulse p-2 bg-primary/10 rounded-md">
                                    Ready to scan. Please present the RFID tag...
                                </p>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="issued">Issued</SelectItem>
                                    <SelectItem value="reserved">Reserved</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                    <SelectItem value="damaged">Damaged</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={() => setIsScanning(false)}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting || isScanning}>
                        {isSubmitting ? 'Adding...' : 'Add Book'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}


function BooksPageContent() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAddBookOpen, setAddBookOpen] = useState(false);

  const booksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'books'));
  }, [firestore]);

  const { data: books, loading, error } = useCollection<Book>(booksQuery);

  const handleDeleteBook = async (bookId: string) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
        return;
    }
    try {
        await deleteDoc(doc(firestore, 'books', bookId));
        toast({ title: 'Success', description: 'Book has been deleted.' });
    } catch (error: any) {
        console.error("Error deleting book: ", error);
        toast({ variant: 'destructive', title: 'Error deleting book', description: error.message });
    }
  };

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
                     <Dialog open={isAddBookOpen} onOpenChange={setAddBookOpen}>
                        <DialogTrigger asChild>
                           <Button><BookUp className="mr-2 h-4 w-4" /> Add New Book</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Book</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below to add a new book to the collection.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                               <AddBookForm onFinished={() => setAddBookOpen(false)} />
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
                  <TableHead>RFID Tag ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {!loading && books?.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>{book.rfidTagId}</TableCell>
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
                    <TableCell className="text-right">
                       <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
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
                                    This action cannot be undone. This will permanently delete the book
                                    and remove its data from our servers.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteBook(book.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {error && <p className="text-red-500 text-center p-4">Error loading books: {error.message}</p>}
            {!loading && books?.length === 0 && <p className="text-muted-foreground text-center p-4">No books found. Click "Add New Book" to get started.</p>}
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
