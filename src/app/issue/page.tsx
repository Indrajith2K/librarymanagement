'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ScanLine, X, BookOpen, Library } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { UserSupportChat } from '@/components/UserSupportChat';

interface Book {
  id: string;
  title: string;
  author: string;
  rfidTagId: string;
  status: 'available' | 'issued' | 'lost' | 'damaged' | 'reserved';
  category?: string;
}

export default function IssuePage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [scannedBooks, setScannedBooks] = useState<Book[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedIdInput, setScannedIdInput] = useState('');
    const [isIssuing, setIsIssuing] = useState(false);
    const [recommendations, setRecommendations] = useState<Book[]>([]);

    const booksQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'books'), where('status', '==', 'available'));
    }, [firestore]);

    const { data: allBooks, loading, error } = useCollection<Book>(booksQuery);

    const filteredBooks = useMemo(() => {
        if (!allBooks) return [];
        return allBooks.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allBooks, searchTerm]);

    useEffect(() => {
        if (!scannedBooks.length || !allBooks) {
          setRecommendations([]);
          return;
        }
    
        const issueBookIds = new Set(scannedBooks.map(b => b.id));
        const issueBookCategories = [...new Set(scannedBooks.map(b => b.category).filter(Boolean))];
    
        if (issueBookCategories.length === 0) {
            setRecommendations([]);
            return;
        }
    
        const potentialRecommendations = allBooks.filter(book =>
          !issueBookIds.has(book.id) &&
          book.category && issueBookCategories.includes(book.category)
        );
        
        // Shuffle and take top 3
        const shuffled = potentialRecommendations.sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 3));
    
    }, [scannedBooks, allBooks]);
    
    useEffect(() => {
        if (!isScanning) return;

        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Enter' && scannedIdInput) {
            const foundBook = allBooks?.find(b => b.rfidTagId === scannedIdInput);
            if (foundBook) {
                if (scannedBooks.some(b => b.id === foundBook.id)) {
                    toast({ variant: 'destructive', title: 'Duplicate Book', description: `\'\'\'${foundBook.title}\'\'\' is already in the list.` });
                } else {
                    setScannedBooks(prev => [...prev, foundBook]);
                    toast({ title: 'Book Added', description: `\'\'\'${foundBook.title}\'\'\' has been added to the issue list.` });
                }
            } else {
                toast({ variant: 'destructive', title: 'Book Not Found', description: `No available book with RFID ${scannedIdInput} found.` });
            }
            setScannedIdInput(''); // Reset input after each scan attempt
          } else if (event.key.length === 1) {
            setScannedIdInput(prev => prev + event.key);
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);

    }, [isScanning, scannedIdInput, allBooks, scannedBooks, toast]);

    const handleSelectBook = (book: Book) => {
        if (!scannedBooks.some(b => b.id === book.id)) {
          setScannedBooks([...scannedBooks, book]);
          toast({ title: 'Book Added', description: `\'\'\'${book.title}\'\'\' has been added to the issue list.` });
        } else {
          toast({ variant: 'destructive', title: 'Duplicate Book', description: `\'\'\'${book.title}\'\'\' is already in the list.` });
        }
    };

    const removeScannedBook = (bookId: string) => {
        setScannedBooks(prev => prev.filter(b => b.id !== bookId));
    };

    const handleIssueBooks = async () => {
        if (!firestore || scannedBooks.length === 0) return;

        setIsIssuing(true);
        const batch = writeBatch(firestore);

        scannedBooks.forEach(book => {
            const bookRef = doc(firestore, 'books', book.id);
            batch.update(bookRef, { status: 'issued' });
        });

        try {
            await batch.commit();
            toast({ title: 'Success!', description: `${scannedBooks.length} book(s) have been issued.` });
            router.push('/issue-success');
        } catch (err: any) {
            console.error("Error issuing books: ", err);
            toast({ variant: 'destructive', title: 'Error', description: `Failed to issue books: ${err.message}` });
        } finally {
            setIsIssuing(false);
        }
    };


  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                     <h1 className="text-xl font-bold text-gray-800">Issue Books</h1>
                     <Button variant="outline" onClick={() => router.push('/')}>Cancel</Button>
                </div>
            </div>
        </header>

      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side - Search and Book List */}
        <div className="lg:col-span-2 space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                    placeholder="Search by title or author..." 
                    className="pl-10 h-12 text-lg rounded-full shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Available Books</CardTitle>
                         <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{allBooks?.length ?? 0} Total</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[60vh] overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white">
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>RFID Tag ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && Array.from({length: 5}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    </TableRow>
                                ))}
                                {!loading && filteredBooks.map(book => (
                                    <TableRow key={book.id}>
                                        <TableCell className="font-medium">{book.title}</TableCell>
                                        <TableCell>{book.author}</TableCell>
                                        <TableCell className="font-mono text-xs">{book.rfidTagId}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {error && <p className="text-red-500 text-center p-4">Error loading books: {error.message}</p>}
                        {!loading && filteredBooks.length === 0 && <p className="text-muted-foreground text-center p-8">No books match your search.</p>}
                    </div>
                </CardContent>
            </Card>

            {recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>You Might Also Like</CardTitle>
                        <CardDescription>Based on your current selection.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {recommendations.map(book => (
                            <div key={book.id} className="relative group border rounded-lg p-3 space-y-3 text-center">
                                <Image 
                                    src={`https://picsum.photos/seed/${book.id}/200/300`} 
                                    alt={book.title} 
                                    width={100} 
                                    height={150} 
                                    className="rounded-md object-cover w-full aspect-[2/3] shadow-md"
                                    data-ai-hint="book cover"
                                />
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm truncate">{book.title}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                                </div>
                                <Button size="sm" className="w-full" onClick={() => handleSelectBook(book)}>
                                    Add
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

        </div>

        {/* Right side - RFID Scanner and Issue Area */}
        <div className="space-y-6">
            <Card className="bg-white sticky top-24">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ScanLine className="h-5 w-5" /> RFID Issue Scanner</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center space-y-4 p-4 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-center text-gray-500">
                           {isScanning ? 'Scanner is active. Present books now.' : 'Activate the scanner to add books to the issue list.'}
                        </p>
                        <Button onClick={() => setIsScanning(prev => !prev)} variant={isScanning ? 'destructive' : 'default'} className="w-full">
                            {isScanning ? 'Deactivate Scanner' : 'Activate RFID Scanner'}
                        </Button>
                         {isScanning && (
                            <p className="text-xs text-primary animate-pulse text-center">
                                Listening for RFID tags... <br/> (Simulated via keyboard input + Enter)
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Library className="h-5 w-5" /> Books to Issue ({scannedBooks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {scannedBooks.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {scannedBooks.map(book => (
                                <div key={book.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                    <div>
                                        <p className="font-medium text-sm">{book.title}</p>
                                        <p className="text-xs text-gray-500">{book.author}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeScannedBook(book.id)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-8">No books in the issue list. Scan a book to add it.</p>
                    )}
                    <Separator className="my-4" />
                    <Button 
                        className="w-full" 
                        size="lg"
                        disabled={scannedBooks.length === 0 || isIssuing}
                        onClick={handleIssueBooks}
                    >
                        {isIssuing ? 'Issuing...' : `Issue ${scannedBooks.length} Book(s)`}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </main>
      <UserSupportChat />
    </div>
  );
}
