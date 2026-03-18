
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, X, BookOpen, Library, User, CheckCircle } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, writeBatch, doc, getDocs, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { UserSupportChat } from '@/components/UserSupportChat';
import { addDays } from 'date-fns';

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  quantityTotal: number;
  quantityIssued: number;
}
interface Member {
  id: string;
  name: string;
  email: string;
  rfidCardId: string;
}

const loanPeriodDays = 14; 

export default function IssuePage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [booksToIssue, setBooksToIssue] = useState<Book[]>([]);
    const [isIssuing, setIsIssuing] = useState(false);
    const [recommendations, setRecommendations] = useState<Book[]>([]);

    const [member, setMember] = useState<Member | null>(null);
    const [memberLoading, setMemberLoading] = useState(true);

    useEffect(() => {
        const memberId = sessionStorage.getItem('quicklook-member-id');
        if (!memberId || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Member ID not found. Please scan your ID from the homepage.' });
            router.push('/');
            return;
        }

        const fetchMember = async () => {
            const membersRef = collection(firestore, 'members');
            const q = query(membersRef, where('rfidCardId', '==', memberId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const memberDoc = querySnapshot.docs[0];
                setMember({ id: memberDoc.id, ...memberDoc.data() } as Member);
            } else {
                 toast({ variant: 'destructive', title: 'Member Not Found', description: `No member found with ID: ${memberId}` });
                 router.push('/');
            }
            setMemberLoading(false);
        };

        fetchMember();
    }, [firestore, router, toast]);

    const { data: allBooks, loading: booksLoading, error } = useCollection<Book>(useMemo(() => firestore ? query(collection(firestore, 'books')) : null, [firestore]));

    const availableBooks = useMemo(() => {
        if (!allBooks) return [];
        return allBooks.filter(b => (b.quantityTotal - b.quantityIssued) > 0);
    }, [allBooks]);

    const filteredBooks = useMemo(() => {
        if (!availableBooks) return [];
        return availableBooks.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [availableBooks, searchTerm]);

    useEffect(() => {
        if (!booksToIssue.length || !availableBooks) {
          setRecommendations([]);
          return;
        }
    
        const issueBookIds = new Set(booksToIssue.map(b => b.id));
        const issueBookCategories = [...new Set(booksToIssue.map(b => b.category).filter(Boolean))];
    
        if (issueBookCategories.length === 0) {
            setRecommendations([]);
            return;
        }
    
        const potentialRecommendations = availableBooks.filter(book =>
          !issueBookIds.has(book.id) &&
          book.category && issueBookCategories.includes(book.category)
        );
        
        const shuffled = potentialRecommendations.sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 3));
    
    }, [booksToIssue, availableBooks]);

    const handleSelectBook = (book: Book) => {
        if (!booksToIssue.some(b => b.id === book.id)) {
          setBooksToIssue([...booksToIssue, book]);
        } else {
          toast({ variant: 'destructive', title: 'Duplicate Book', description: `\'\'\'${book.title}\'\'\' is already in the list.` });
        }
    };

    const removeScannedBook = (bookId: string) => {
        setBooksToIssue(prev => prev.filter(b => b.id !== bookId));
    };

    const handleIssueBooks = async () => {
        if (!firestore || booksToIssue.length === 0 || !member) return;

        setIsIssuing(true);
        const batch = writeBatch(firestore);
        const dueDate = addDays(new Date(), loanPeriodDays);

        for (const book of booksToIssue) {
            const bookRef = doc(firestore, 'books', book.id);
            batch.update(bookRef, { quantityIssued: increment(1) });
            
            const logRef = doc(collection(firestore, 'circulationLogs'));
            batch.set(logRef, {
                bookId: book.id,
                memberId: member.id,
                action: 'issue',
                status: 'issued',
                issuedAt: serverTimestamp(),
                dueDate: dueDate,
                actorId: member.id,
            });
        }

        try {
            await batch.commit();
            toast({ title: 'Success!', description: `${booksToIssue.length} book(s) have been issued.` });
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
                     <div className="flex items-center gap-4">
                        {memberLoading && <Skeleton className="h-8 w-32" />}
                        {member && (
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <User className="h-4 w-4" /> {member.name}
                            </div>
                        )}
                        <Button variant="outline" onClick={() => router.push('/')}>Cancel</Button>
                     </div>
                </div>
            </div>
        </header>

      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                         <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{availableBooks?.length ?? 0} Titles Available</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[60vh] overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white">
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(booksLoading || memberLoading) && Array.from({length: 5}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                                    </TableRow>
                                ))}
                                {!booksLoading && !memberLoading && filteredBooks.map(book => (
                                    <TableRow key={book.id}>
                                        <TableCell className="font-medium">{book.title}</TableCell>
                                        <TableCell>{book.author}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => handleSelectBook(book)} disabled={booksToIssue.some(b => b.id === book.id)}>
                                                {booksToIssue.some(b => b.id === book.id) ? <CheckCircle className="h-4 w-4" /> : 'Add'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {error && <p className="text-red-500 text-center p-4">Error loading books: {error.message}</p>}
                        {!booksLoading && filteredBooks.length === 0 && <p className="text-muted-foreground text-center p-8">No books match your search.</p>}
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
                                <Button size="sm" className="w-full" onClick={() => handleSelectBook(book)} disabled={booksToIssue.some(b => b.id === book.id)}>
                                    {booksToIssue.some(b => b.id === book.id) ? 'Added' : 'Add'}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

        </div>

        <div className="space-y-6">
            <Card className="bg-white sticky top-24">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Library className="h-5 w-5" /> Books to Issue ({booksToIssue.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {booksToIssue.length > 0 ? (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {booksToIssue.map(book => (
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
                        <p className="text-center text-sm text-gray-500 py-8">No books in the issue list. Add a book to get started.</p>
                    )}
                    <Separator className="my-4" />
                    <Button 
                        className="w-full" 
                        size="lg"
                        disabled={booksToIssue.length === 0 || isIssuing || !member}
                        onClick={handleIssueBooks}
                    >
                        {isIssuing ? 'Issuing...' : `Issue ${booksToIssue.length} Book(s)`}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </main>
      <UserSupportChat />
    </div>
  );
}
