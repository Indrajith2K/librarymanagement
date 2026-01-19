'use client';

import { useMemo, useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookUp, MoreHorizontal, Search, ScanLine, Trash2, FilePenLine, DatabaseZap } from 'lucide-react';
import { AdminUserProvider, useAdminUser } from '@/context/AdminUserContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
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
  category: string;
  rfidTagId: string;
  status: 'available' | 'issued' | 'lost' | 'damaged' | 'reserved';
}

const bookSchema = z.object({
    title: z.string().min(1, "Title is required"),
    author: z.string().min(1, "Author is required"),
    category: z.string().min(1, "Genre is required"),
    rfidTagId: z.string().min(1, "RFID Tag ID is required"),
    status: z.enum(['available', 'issued', 'lost', 'damaged', 'reserved']).default('available'),
});

type BookFormData = z.infer<typeof bookSchema>;

function BookForm({ onFinished, initialData }: { onFinished: () => void; initialData?: Book | null; }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedId, setScannedId] = useState('');
    const isEditMode = !!initialData;

    const form = useForm<BookFormData>({
        resolver: zodResolver(bookSchema),
        defaultValues: initialData || {
            title: '',
            author: '',
            category: '',
            rfidTagId: '',
            status: 'available',
        },
    });

     useEffect(() => {
        form.reset(initialData || {
            title: '',
            author: '',
            category: '',
            rfidTagId: '',
            status: 'available',
        });
    }, [initialData, form]);

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
            if (isEditMode) {
                const bookRef = doc(firestore, 'books', initialData.id);
                await updateDoc(bookRef, {
                    ...values,
                    updatedAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'Book has been updated.' });
            } else {
                await addDoc(collection(firestore, 'books'), {
                    ...values,
                    isDeleted: false,
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
  const { loading: adminLoading } = useAdminUser();
  const [isSeeding, setIsSeeding] = useState(false);

  const booksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'books'));
  }, [firestore]);

  const { data: books, loading: booksLoading, error } = useCollection<Book>(booksQuery);

  async function handleSeedDatabase() {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
      return;
    }
    setIsSeeding(true);

    const sampleBooks = [
        { title: 'Atomic Habits', author: 'James Clear', category: 'Self-Help', rfidTagId: '200000001', status: 'available' },
        { title: 'Deep Work', author: 'Cal Newport', category: 'Productivity', rfidTagId: '200000002', status: 'available' },
        { title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', rfidTagId: '200000003', status: 'available' },
        { title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', category: 'Finance', rfidTagId: '200000004', status: 'available' },
        { title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', category: 'Fantasy', rfidTagId: '200000005', status: 'available' },
        { title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Fantasy', rfidTagId: '200000006', status: 'available' },
        { title: 'Think Like a Monk', author: 'Jay Shetty', category: 'Motivation', rfidTagId: '200000007', status: 'available' },
        { title: 'The Silent Patient', author: 'Alex Michaelides', category: 'Thriller', rfidTagId: '200000008', status: 'available' },
        { title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', category: 'Biography', rfidTagId: '200000009', status: 'available' },
        { title: 'Ikigai', author: 'Hector Garcia', category: 'Philosophy', rfidTagId: '200000010', status: 'available' },
        { title: 'Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'Mystery', rfidTagId: '200000011', status: 'available' },
        { title: 'The Psychology of Money', author: 'Morgan Housel', category: 'Finance', rfidTagId: '200000012', status: 'available' },
        { title: '1984', author: 'George Orwell', category: 'Dystopian', rfidTagId: '200000013', status: 'available' },
        { title: 'The Power of Habit', author: 'Charles Duhigg', category: 'Self-Help', rfidTagId: '200000014', status: 'available' },
        { title: 'The Monk Who Sold His Ferrari', author: 'Robin Sharma', category: 'Motivation', rfidTagId: '200000015', status: 'available' },
        { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Classic', rfidTagId: '200000016', status: 'available' },
        { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Classic', rfidTagId: '200000017', status: 'available' },
        { title: 'Sapiens', author: 'Yuval Noah Harari', category: 'History', rfidTagId: '200000018', status: 'available' },
        { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', category: 'Self-Help', rfidTagId: '200000019', status: 'available' },
        { title: 'The Fault in Our Stars', author: 'John Green', category: 'Romance', rfidTagId: '200000020', status: 'available' },
        { title: 'The Da Vinci Code', author: 'Dan Brown', category: 'Suspense', rfidTagId: '200000021', status: 'available' },
        { title: 'Zero to One', author: 'Peter Thiel', category: 'Startup', rfidTagId: '200000022', status: 'available' },
        { title: 'Start With Why', author: 'Simon Sinek', category: 'Leadership', rfidTagId: '200000023', status: 'available' },
        { title: 'The 5 AM Club', author: 'Robin Sharma', category: 'Productivity', rfidTagId: '200000024', status: 'available' },
        { title: 'Think and Grow Rich', author: 'Napoleon Hill', category: 'Success', rfidTagId: '200000025', status: 'available' },
        { title: 'The Lean Startup', author: 'Eric Ries', category: 'Business', rfidTagId: '200000026', status: 'available' },
        { title: 'Man\'s Search for Meaning', author: 'Viktor Frankl', category: 'Psychology', rfidTagId: '200000027', status: 'available' },
        { title: 'The Kite Runner', author: 'Khaled Hosseini', category: 'Drama', rfidTagId: '200000028', status: 'available' },
        { title: 'Life of Pi', author: 'Yann Martel', category: 'Adventure', rfidTagId: '200000029', status: 'available' },
        { title: 'The Book Thief', author: 'Markus Zusak', category: 'Historical Fiction', rfidTagId: '200000030', status: 'available' },
        { title: 'The Girl on the Train', author: 'Paula Hawkins', category: 'Crime', rfidTagId: '200000031', status: 'available' },
        { title: 'The Martian', author: 'Andy Weir', category: 'Science Fiction', rfidTagId: '200000032', status: 'available' },
        { title: 'Dune', author: 'Frank Herbert', category: 'Sci-Fi', rfidTagId: '200000033', status: 'available' },
        { title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Classic', rfidTagId: '200000034', status: 'available' },
        { title: 'The Road', author: 'Cormac McCarthy', category: 'Post-Apocalyptic', rfidTagId: '200000035', status: 'available' },
        { title: 'The Art of War', author: 'Sun Tzu', category: 'Strategy', rfidTagId: '200000036', status: 'available' },
        { title: 'Can\'t Hurt Me', author: 'David Goggins', category: 'Motivation', rfidTagId: '200000037', status: 'available' },
        { title: 'Educated', author: 'Tara Westover', category: 'Memoir', rfidTagId: '200000038', status: 'available' },
        { title: 'The Hunger Games', author: 'Suzanne Collins', category: 'Young Adult', rfidTagId: '200000039', status: 'available' },
        { title: 'Divergent', author: 'Veronica Roth', category: 'Young Adult', rfidTagId: '200000040', status: 'available' },
        { title: 'The Shining', author: 'Stephen King', category: 'Horror', rfidTagId: '200000041', status: 'available' },
        { title: 'Dracula', author: 'Bram Stoker', category: 'Horror', rfidTagId: '200000042', status: 'available' },
        { title: 'The Odyssey', author: 'Homer', category: 'Epic', rfidTagId: '200000043', status: 'available' },
        { title: 'The Iliad', author: 'Homer', category: 'Epic', rfidTagId: '200000044', status: 'available' },
        { title: 'The Notebook', author: 'Nicholas Sparks', category: 'Romance', rfidTagId: '200000045', status: 'available' },
        { title: 'Good to Great', author: 'Jim Collins', category: 'Management', rfidTagId: '200000046', status: 'available' },
        { title: 'Digital Minimalism', author: 'Cal Newport', category: 'Technology', rfidTagId: '200000047', status: 'available' },
        { title: 'The Code Book', author: 'Simon Singh', category: 'Cryptography', rfidTagId: '200000048', status: 'available' },
        { title: 'Clean Code', author: 'Robert C. Martin', category: 'Programming', rfidTagId: '200000049', status: 'available' },
        { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', category: 'Computer Science', rfidTagId: '200000050', status: 'available' },
    ].map(book => ({...book, isDeleted: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));

    toast({
        title: "Populating Library",
        description: "Updating the database with 50 sample books.",
    });

    const batch = writeBatch(firestore);
    
    sampleBooks.forEach(book => {
        const docRef = doc(firestore, 'books', book.rfidTagId);
        batch.set(docRef, book);
    });

    try {
        await batch.commit();
        toast({
            title: "Database Updated",
            description: "The book collection has been updated with sample data.",
        });
    } catch (e: any) {
        console.error("Error seeding books:", e);
        toast({
            variant: 'destructive',
            title: "Update Failed",
            description: `Could not add sample books to the database: ${e.message}`,
        });
    } finally {
        setIsSeeding(false);
    }
  }


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
                        <Input placeholder="Search books..." className="pl-8" />
                    </div>
                     <Button variant="outline" onClick={handleSeedDatabase} disabled={isSeeding || loading}>
                        <DatabaseZap className="mr-2 h-4 w-4" />
                        {isSeeding ? 'Seeding...' : 'Seed 50 Books'}
                    </Button>
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
                  <TableHead>RFID Tag ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Genre</TableHead>
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
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {!loading && books?.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>{book.rfidTagId}</TableCell>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.category}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                            book.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                            : book.status === 'issued' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                            {book.status}
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
                ))}
              </TableBody>
            </Table>
             {error && <p className="text-red-500 text-center p-4">Error loading books: {error.message}</p>}
            {!loading && books?.length === 0 && (
              <div className="text-center p-8 border-t">
                 <p className="text-muted-foreground">No books found in your library.</p>
                 <p className="text-sm text-muted-foreground mt-2">Click "Seed 50 Books" above to add sample data.</p>
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
