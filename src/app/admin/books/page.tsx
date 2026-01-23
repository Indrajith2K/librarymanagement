'use client';

import { useMemo, useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookUp, MoreHorizontal, Search, Trash2, FilePenLine } from 'lucide-react';
import { AdminUserProvider, useAdminUser } from '@/context/AdminUserContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  quantityTotal: number;
  quantityIssued: number;
}

const bookSchema = z.object({
    title: z.string().min(1, "Title is required"),
    author: z.string().min(1, "Author is required"),
    category: z.string().min(1, "Genre is required"),
    quantityTotal: z.preprocess(
      (val) => (typeof val === 'string' && val.length > 0 ? parseInt(val, 10) : val),
      z.number({invalid_type_error: "Must be a number"}).min(0, "Quantity must be a non-negative number")
    ),
});


type BookFormData = z.infer<typeof bookSchema>;

function BookForm({ onFinished, initialData }: { onFinished: () => void; initialData?: Book | null; }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!initialData;

    const dynamicBookSchema = useMemo(() => {
        return bookSchema.refine(
            (data) => {
                if (isEditMode && initialData) {
                    return data.quantityTotal >= (initialData.quantityIssued || 0);
                }
                return true;
            },
            {
                message: `Total quantity cannot be less than the currently issued amount (${initialData?.quantityIssued || 0}).`,
                path: ["quantityTotal"],
            }
        );
    }, [initialData, isEditMode]);

    const form = useForm<BookFormData>({
        resolver: zodResolver(dynamicBookSchema),
        defaultValues: initialData ? {
            title: initialData.title,
            author: initialData.author,
            category: initialData.category,
            quantityTotal: initialData.quantityTotal,
        } : {
            title: '',
            author: '',
            category: '',
            quantityTotal: 0,
        },
    });

    async function onSubmit(values: BookFormData) {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
            return;
        }
        setIsSubmitting(true);
        try {
            if (isEditMode && initialData) {
                const bookRef = doc(firestore, 'books', initialData.id);
                await updateDoc(bookRef, {
                    ...values,
                    updatedAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'Book has been updated.' });
            } else {
                await addDoc(collection(firestore, 'books'), {
                    ...values,
                    quantityIssued: 0, // New books have 0 issued
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'New book has been added.' });
            }
            onFinished();
        } catch (error: any) {
            console.error("Error saving book: ", error);
            toast({ variant: 'destructive', title: isEditMode ? 'Error updating book' : 'Error adding book', description: error.message });
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
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Genre</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Fiction" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="quantityTotal"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Total Quantity</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g. 10" {...field} />
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Book'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}


function BooksPageContent() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const { adminUser, loading: adminLoading } = useAdminUser();
  const [searchTerm, setSearchTerm] = useState('');

  const booksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'books'));
  }, [firestore]);

  const { data: books, loading: booksLoading, error } = useCollection<Book>(booksQuery);

  const filteredBooks = useMemo(() => {
    if (!books) {
      return [];
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    const safeBooks = books.map(book => ({
        ...book,
        quantityTotal: book.quantityTotal || 0,
        quantityIssued: book.quantityIssued || 0,
    }));

    return safeBooks.filter(book =>
      (book.title?.toLowerCase() || '').includes(lowercasedTerm) ||
      (book.author?.toLowerCase() || '').includes(lowercasedTerm) ||
      (book.category?.toLowerCase() || '').includes(lowercasedTerm)
    );
  }, [books, searchTerm]);

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

  const loading = booksLoading || adminLoading;

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
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search books..." 
                            className="pl-8 w-40 md:w-64" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button disabled={loading} onClick={() => { setEditingBook(null); setIsFormOpen(true); }}>
                        <BookUp className="mr-2 h-4 w-4" /> Add New Book
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingBook(null); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
                        <DialogDescription>
                           {editingBook ? 'Update the details for this book.' : 'Fill in the details below to add a new book to the collection.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                       <BookForm
                         key={editingBook?.id || 'new-book'}
                         initialData={editingBook}
                         onFinished={() => {
                            setIsFormOpen(false);
                            setEditingBook(null);
                         }}
                       />
                    </div>
                </DialogContent>
            </Dialog>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="hidden sm:table-cell">Genre</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-8 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {!loading && filteredBooks.map((book) => {
                  const available = book.quantityTotal - book.quantityIssued;
                  return (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell className="hidden sm:table-cell">{book.category}</TableCell>
                    <TableCell>{book.quantityTotal}</TableCell>
                    <TableCell>{book.quantityIssued}</TableCell>
                    <TableCell>
                         <span className={`font-semibold ${available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {available}
                        </span>
                    </TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={loading}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                               <DropdownMenuItem onClick={() => { setEditingBook(book); setIsFormOpen(true); }}>
                                <FilePenLine className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-900/50 dark:focus:text-red-400">
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
                  );
                })}
              </TableBody>
            </Table>
            {error && <p className="text-red-500 text-center p-4">Error loading books: {error.message}</p>}
            {!loading && filteredBooks.length === 0 && (
                <div className="text-center p-8 border-t">
                    <p className="text-muted-foreground">
                        {books && books.length > 0 ? 'No books match your search.' : 'No books found in your library.'}
                    </p>
                    {books?.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-2">Click "Add New Book" to start building your collection.</p>
                    )}
                </div>
            )}
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
