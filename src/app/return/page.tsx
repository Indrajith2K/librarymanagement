
'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, BookCheck, Library, User } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, writeBatch, doc, getDocs, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { UserSupportChat } from '@/components/UserSupportChat';
import { format } from 'date-fns';

interface EnrichedLog {
  id: string; // Log ID
  bookId: string;
  bookTitle?: string;
  bookAuthor?: string;
  dueDate?: { seconds: number, nanoseconds: number };
}

interface Member {
  id: string;
  name: string;
  email: string;
  rfidCardId: string;
}

export default function ReturnPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [booksToReturn, setBooksToReturn] = useState<EnrichedLog[]>([]);
    const [isReturning, setIsReturning] = useState(false);

    const [member, setMember] = useState<Member | null>(null);
    const [issuedLogs, setIssuedLogs] = useState<EnrichedLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);

    const fetchIssuedBooks = useCallback(async (memberId: string) => {
      if (!firestore) return;
      setLogsLoading(true);
      
      const logsQuery = query(collection(firestore, 'circulationLogs'), where('memberId', '==', memberId), where('status', '==', 'issued'));
      const logSnapshot = await getDocs(logsQuery);
      
      const enrichedLogsPromises = logSnapshot.docs.map(async (logDoc) => {
          const logData = logDoc.data();
          const bookRef = doc(firestore, 'books', logData.bookId);
          const bookSnap = await getDoc(bookRef);
          return {
              id: logDoc.id,
              bookId: logData.bookId,
              bookTitle: bookSnap.exists() ? bookSnap.data().title : 'Unknown Book',
              bookAuthor: bookSnap.exists() ? bookSnap.data().author : 'Unknown Author',
              dueDate: logData.dueDate,
          };
      });
      
      const logs = await Promise.all(enrichedLogsPromises);
      setIssuedLogs(logs);
      setLogsLoading(false);
  }, [firestore]);


    useEffect(() => {
        const memberRfid = sessionStorage.getItem('quicklook-member-id');
        if (!memberRfid || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Member ID not found. Please scan your ID from the homepage.' });
            router.push('/');
            return;
        }

        const fetchMemberAndBooks = async () => {
            const membersRef = collection(firestore, 'members');
            const q = query(membersRef, where('rfidCardId', '==', memberRfid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const memberDoc = querySnapshot.docs[0];
                const memberData = { id: memberDoc.id, ...memberDoc.data() } as Member
                setMember(memberData);
                await fetchIssuedBooks(memberData.id);
            } else {
                 toast({ variant: 'destructive', title: 'Member Not Found', description: `No member found with ID: ${memberRfid}` });
                 router.push('/');
            }
        };

        fetchMemberAndBooks();
    }, [firestore, router, toast, fetchIssuedBooks]);


    const handleSelectBookToReturn = (log: EnrichedLog) => {
        if (!booksToReturn.some(l => l.id === log.id)) {
            setBooksToReturn(prev => [...prev, log]);
        }
    };

    const removeBookFromReturn = (logId: string) => {
        setBooksToReturn(booksToReturn.filter(l => l.id !== logId));
    };

    const handleReturnBooks = async () => {
        if (!firestore || booksToReturn.length === 0) return;

        setIsReturning(true);
        const batch = writeBatch(firestore);

        for(const log of booksToReturn) {
            const bookRef = doc(firestore, 'books', log.bookId);
            batch.update(bookRef, { quantityIssued: increment(-1) });

            const logDocRef = doc(firestore, 'circulationLogs', log.id);
            batch.update(logDocRef, {
                status: 'returned',
                returnedAt: serverTimestamp(),
            });
        }

        try {
            await batch.commit();
            toast({ title: 'Success!', description: `${booksToReturn.length} book(s) have been returned.` });
            router.push('/return-success');
        } catch (err: any) {
            console.error("Error returning books: ", err);
            toast({ variant: 'destructive', title: 'Error', description: `Failed to return books: ${err.message}` });
        } finally {
            setIsReturning(false);
        }
    };


  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                     <h1 className="text-xl font-bold text-gray-800">Return Books</h1>
                      <div className="flex items-center gap-4">
                        {logsLoading && <Skeleton className="h-8 w-32" />}
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
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <CardTitle className="flex items-center gap-2"><BookCheck className="h-5 w-5" /> Your Borrowed Books</CardTitle>
                         <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{issuedLogs.length} book(s)</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[60vh] overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white">
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logsLoading && Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                                    </TableRow>
                                ))}
                                {!logsLoading && issuedLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.bookTitle}</TableCell>
                                        <TableCell>{log.bookAuthor}</TableCell>
                                        <TableCell>{log.dueDate ? format(log.dueDate.seconds * 1000, 'dd MMM, yyyy') : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                             <Button size="sm" onClick={() => handleSelectBookToReturn(log)} disabled={booksToReturn.some(b => b.id === log.id)}>
                                                {booksToReturn.some(b => b.id === log.id) ? 'Selected' : 'Select for Return'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {!logsLoading && issuedLogs.length === 0 && <p className="text-muted-foreground text-center p-8">You have no books currently checked out.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="bg-white sticky top-24">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Library className="h-5 w-5" /> Books to Return ({booksToReturn.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {booksToReturn.length > 0 ? (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {booksToReturn.map(log => (
                                <div key={log.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                    <div>
                                        <p className="font-medium text-sm">{log.bookTitle}</p>
                                        <p className="text-xs text-gray-500">{log.bookAuthor}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeBookFromReturn(log.id)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-8">Select a book from the list to begin the return process.</p>
                    )}
                    <Separator className="my-4" />
                    <Button 
                        className="w-full" 
                        size="lg"
                        disabled={booksToReturn.length === 0 || isReturning}
                        onClick={handleReturnBooks}
                    >
                        {isReturning ? 'Returning...' : `Return ${booksToReturn.length} Book(s)`}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </main>
      <UserSupportChat />
    </div>
  );
}
