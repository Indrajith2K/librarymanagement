'use client';
import { useState, useMemo, useEffect, Fragment, useCallback } from 'react';
import Image from 'next/image';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, X, BookUp, BookDown, User, Users, Library, XCircle, BookCheck } from 'lucide-react';
import { AdminUserProvider, useAdminUser } from '@/context/AdminUserContext';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, writeBatch, doc, getDocs, serverTimestamp, increment, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addDays, format } from 'date-fns';

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
}
interface CirculationLog {
  id: string;
  bookId: string;
  memberId: string;
  action: 'issue' | 'return';
  status: 'issued' | 'returned' | 'overdue';
  issuedAt?: { seconds: number; nanoseconds: number };
  dueDate?: { seconds: number; nanoseconds: number };
  returnedAt?: { seconds: number; nanoseconds: number };
  actorId: string;
}
interface EnrichedLog extends CirculationLog {
    bookTitle?: string;
    bookAuthor?: string;
}


const loanPeriodDays = 14; 

function IssueTab() {
  const firestore = useFirestore();
  const { adminUser } = useAdminUser();
  const { toast } = useToast();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [booksToIssue, setBooksToIssue] = useState<Book[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recommendations, setRecommendations] = useState<Book[]>([]);

  const [isMemberDialogOpen, setMemberDialogOpen] = useState(false);
  const [isBookDialogOpen, setBookDialogOpen] = useState(false);

  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');

  const { data: members, loading: membersLoading } = useCollection<Member>(useMemo(() => firestore ? query(collection(firestore, 'members')) : null, [firestore]), 'members');
  
  const { data: allBooks, loading: booksLoading } = useCollection<Book>(useMemo(() => firestore ? query(collection(firestore, 'books')) : null, [firestore]), 'books');

  const filteredMembers = useMemo(() => members?.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase())), [members, memberSearch]);
  
  const availableBooks = useMemo(() => {
    if (!allBooks) return [];
    return allBooks.filter(b => ((b.quantityTotal || 0) - (b.quantityIssued || 0)) > 0);
  }, [allBooks]);

  const filteredBooks = useMemo(() => {
    if (!availableBooks) return [];
    const lowercasedSearch = bookSearch.toLowerCase();
    return availableBooks.filter(b => 
        (b.title?.toLowerCase() || '').includes(lowercasedSearch) ||
        (b.author?.toLowerCase() || '').includes(lowercasedSearch)
    );
  }, [availableBooks, bookSearch]);

  useEffect(() => {
    if (!booksToIssue.length || !allBooks) {
      setRecommendations([]);
      return;
    }

    const issueBookIds = new Set(booksToIssue.map(b => b.id));
    const issueBookCategories = [...new Set(booksToIssue.map(b => b.category).filter(Boolean))];

    if (issueBookCategories.length === 0) {
        setRecommendations([]);
        return;
    }

    const potentialRecommendations = allBooks.filter(book =>
      !issueBookIds.has(book.id) &&
      book.category && issueBookCategories.includes(book.category) &&
      ((book.quantityTotal || 0) - (book.quantityIssued || 0)) > 0
    );
    
    // Shuffle and take top 3
    const shuffled = potentialRecommendations.sort(() => 0.5 - Math.random());
    setRecommendations(shuffled.slice(0, 3));

  }, [booksToIssue, allBooks]);

  const handleSelectBook = (book: Book) => {
    if (!booksToIssue.some(b => b.id === book.id)) {
      setBooksToIssue([...booksToIssue, book]);
    }
  };
  const handleRemoveBook = (bookId: string) => setBooksToIssue(booksToIssue.filter(b => b.id !== bookId));

  const handleIssue = async () => {
    if (!selectedMember || booksToIssue.length === 0 || !firestore || !adminUser) {
        toast({variant: 'destructive', title: 'Error', description: 'Please select a member and at least one book.'});
        return;
    }
    setIsProcessing(true);

    try {
        const batch = writeBatch(firestore);
        const dueDate = addDays(new Date(), loanPeriodDays);

        for (const book of booksToIssue) {
            const bookRef = doc(firestore, 'books', book.id);
            batch.update(bookRef, { quantityIssued: increment(1) });

            const logRef = doc(collection(firestore, 'circulationLogs'));
            batch.set(logRef, {
                bookId: book.id,
                memberId: selectedMember.id,
                action: 'issue',
                status: 'issued',
                issuedAt: serverTimestamp(),
                dueDate: dueDate,
                actorId: adminUser.uid || adminUser.staffId,
            });
        }
        await batch.commit();
        toast({title: 'Success', description: `${booksToIssue.length} book(s) issued to ${selectedMember.name}.`});
        
        setSelectedMember(null);
        setBooksToIssue([]);

    } catch (e: any) {
        console.error(e);
        toast({variant: 'destructive', title: 'Issue Failed', description: e.message});
    } finally {
        setIsProcessing(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>1. Select Member</CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedMember ? (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <div>
                             <p className="font-semibold">{selectedMember.name}</p>
                             <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                           </div>
                           <Button variant="outline" onClick={() => setSelectedMember(null)}>Change</Button>
                        </div>
                    ) : (
                         <Dialog open={isMemberDialogOpen} onOpenChange={setMemberDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full" variant="outline"><User className="mr-2"/> Select a Member</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader><DialogTitle>Select Library Member</DialogTitle></DialogHeader>
                                <Input placeholder="Search members..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
                                <ScrollArea className="h-72">
                                <div className="space-y-2">
                                {membersLoading ? <p>Loading...</p> : filteredMembers?.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer" onClick={() => {setSelectedMember(member); setMemberDialogOpen(false);}}>
                                        <div><p>{member.name}</p><p className="text-xs text-muted-foreground">{member.email}</p></div>
                                        <Button variant="ghost" size="sm">Select</Button>
                                    </div>
                                ))}
                                </div>
                                </ScrollArea>
                            </DialogContent>
                         </Dialog>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>2. Select Books</CardTitle>
                </CardHeader>
                <CardContent>
                     <Dialog open={isBookDialogOpen} onOpenChange={setBookDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full" variant="outline" disabled={!selectedMember}><BookUp className="mr-2"/> Select Books to Issue</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Select Available Books</DialogTitle></DialogHeader>
                             <Input placeholder="Search books..." value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} />
                            <ScrollArea className="h-72">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Available</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {booksLoading ? <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow> : filteredBooks?.map(book => (
                                            <TableRow key={book.id}>
                                                <TableCell>{book.title}</TableCell>
                                                <TableCell>{book.author}</TableCell>
                                                <TableCell>{(book.quantityTotal || 0) - (book.quantityIssued || 0)}</TableCell>
                                                <TableCell>
                                                    <Button size="sm" onClick={() => handleSelectBook(book)} disabled={booksToIssue.some(b => b.id === book.id)}>
                                                        {booksToIssue.some(b => b.id === book.id) ? 'Added' : 'Add'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </DialogContent>
                     </Dialog>
                </CardContent>
            </Card>
             {recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>You Might Also Like</CardTitle>
                        <CardDescription>Based on your current selection.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <div className="md:col-span-1 space-y-6">
            <Card className="sticky top-24">
                <CardHeader><CardTitle>Issue Summary</CardTitle></CardHeader>
                <CardContent>
                    {selectedMember ? (
                       <div className="flex items-center gap-3">
                         <Users className="h-5 w-5 text-muted-foreground"/>
                         <p>{selectedMember.name}</p>
                       </div>
                    ): <p className="text-muted-foreground text-sm">No member selected.</p>}
                    <Separator className="my-4" />
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-3"><Library className="h-5 w-5 text-muted-foreground"/> Books ({booksToIssue.length})</h4>
                        {booksToIssue.length > 0 ? (
                            <ScrollArea className="h-48">
                            <div className="space-y-2 pr-4">
                            {booksToIssue.map(book => (
                                <div key={book.id} className="text-sm flex justify-between items-center bg-muted/50 p-2 rounded-md">
                                    <span>{book.title}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveBook(book.id)}><XCircle className="h-4 w-4"/></Button>
                                </div>
                            ))}
                            </div>
                            </ScrollArea>
                        ) : <p className="text-muted-foreground text-sm">No books selected.</p>}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" size="lg" disabled={!selectedMember || booksToIssue.length === 0 || isProcessing} onClick={handleIssue}>
                        {isProcessing ? 'Issuing...' : `Issue ${booksToIssue.length} Book(s)`}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  )
}

function ReturnTab() {
  const firestore = useFirestore();
  const { adminUser } = useAdminUser();
  const { toast } = useToast();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [issuedLogs, setIssuedLogs] = useState<EnrichedLog[]>([]);
  const [booksToReturn, setBooksToReturn] = useState<EnrichedLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const [isMemberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const { data: members, loading: membersLoading } = useCollection<Member>(useMemo(() => firestore ? query(collection(firestore, 'members')) : null, [firestore]), 'members');
  const filteredMembers = useMemo(() => members?.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase())), [members, memberSearch]);

  const fetchIssuedBooks = useCallback(async (memberId: string) => {
      if (!firestore) return;
      setIsLoadingLogs(true);
      
      const logsQuery = query(collection(firestore, 'circulationLogs'), where('memberId', '==', memberId), where('status', '==', 'issued'));
      const logSnapshot = await getDocs(logsQuery);
      
      const enrichedLogsPromises = logSnapshot.docs.map(async (logDoc) => {
          const logData = logDoc.data() as CirculationLog;
          const bookRef = doc(firestore, 'books', logData.bookId);
          const bookSnap = await getDoc(bookRef);
          return {
              ...logData,
              id: logDoc.id,
              bookTitle: bookSnap.exists() ? bookSnap.data().title : 'Unknown Book',
              bookAuthor: bookSnap.exists() ? bookSnap.data().author : 'Unknown Author',
          };
      });
      
      const logs = await Promise.all(enrichedLogsPromises);
      setIssuedLogs(logs);
      setIsLoadingLogs(false);
  }, [firestore]);

  useEffect(() => {
    if (selectedMember) {
        fetchIssuedBooks(selectedMember.id);
    } else {
        setIssuedLogs([]);
        setBooksToReturn([]);
    }
  }, [selectedMember, fetchIssuedBooks]);
  
  const handleSelectBookToReturn = (log: EnrichedLog) => {
      if (!booksToReturn.some(l => l.id === log.id)) {
          setBooksToReturn(prev => [...prev, log]);
      }
  };
  const handleRemoveBook = (logId: string) => setBooksToReturn(booksToReturn.filter(l => l.id !== logId));

  const handleReturn = async () => {
    if (booksToReturn.length === 0 || !firestore || !adminUser) return;
    setIsProcessing(true);
    try {
        const batch = writeBatch(firestore);
        for(const log of booksToReturn) {
            const bookRef = doc(firestore, 'books', log.bookId);
            batch.update(bookRef, { quantityIssued: increment(-1) });

            const logDocRef = doc(firestore, 'circulationLogs', log.id);
            batch.update(logDocRef, {
                status: 'returned',
                action: 'return',
                returnedAt: serverTimestamp(),
            });
        }
        await batch.commit();
        toast({title: 'Success', description: `${booksToReturn.length} book(s) have been returned.`});
        setBooksToReturn([]);
        if (selectedMember) {
            fetchIssuedBooks(selectedMember.id);
        }
    } catch(e: any) {
        console.error(e);
        toast({variant: 'destructive', title: 'Return Failed', description: e.message});
    } finally {
        setIsProcessing(false);
    }
  }


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>1. Select Member to Return Books For</CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedMember ? (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <div>
                             <p className="font-semibold">{selectedMember.name}</p>
                             <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                           </div>
                           <Button variant="outline" onClick={() => setSelectedMember(null)}>Change</Button>
                        </div>
                    ) : (
                         <Dialog open={isMemberDialogOpen} onOpenChange={setMemberDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full" variant="outline"><User className="mr-2"/> Select a Member</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader><DialogTitle>Select Library Member</DialogTitle></DialogHeader>
                                <Input placeholder="Search members..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
                                <ScrollArea className="h-72">
                                <div className="space-y-2">
                                {membersLoading ? <p>Loading...</p> : filteredMembers?.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer" onClick={() => {setSelectedMember(member); setMemberDialogOpen(false);}}>
                                        <div><p>{member.name}</p><p className="text-xs text-muted-foreground">{member.email}</p></div>
                                        <Button variant="ghost" size="sm">Select</Button>
                                    </div>
                                ))}
                                </div>
                                </ScrollArea>
                            </DialogContent>
                         </Dialog>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BookCheck /> Books Issued to {selectedMember?.name || 'Member'}</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="h-72">
                    <Table>
                        <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Due Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {isLoadingLogs && <TableRow><TableCell colSpan={4} className="text-center">Loading issued books...</TableCell></TableRow>}
                            {!isLoadingLogs && issuedLogs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No books currently issued to this member.</TableCell></TableRow>}
                            {!isLoadingLogs && issuedLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.bookTitle}</TableCell>
                                    <TableCell>{log.bookAuthor}</TableCell>
                                    <TableCell>{log.dueDate ? format(log.dueDate.seconds * 1000, 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Button size="sm" onClick={() => handleSelectBookToReturn(log)} disabled={booksToReturn.some(b => b.id === log.id)}>
                                            {booksToReturn.some(b => b.id === log.id) ? 'Selected' : 'Return'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
         <div className="md:col-span-1 space-y-6">
            <Card className="sticky top-24">
                <CardHeader><CardTitle>Return Summary</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-3"><Library className="h-5 w-5 text-muted-foreground"/> Books to Return ({booksToReturn.length})</h4>
                        {booksToReturn.length > 0 ? (
                            <ScrollArea className="h-48">
                            <div className="space-y-2 pr-4">
                            {booksToReturn.map(log => (
                                <div key={log.id} className="text-sm flex justify-between items-center bg-muted/50 p-2 rounded-md">
                                    <span>{log.bookTitle}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveBook(log.id)}><XCircle className="h-4 w-4"/></Button>
                                </div>
                            ))}
                            </div>
                            </ScrollArea>
                        ) : <p className="text-muted-foreground text-sm">No books selected for return.</p>}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" size="lg" disabled={booksToReturn.length === 0 || isProcessing} onClick={handleReturn}>
                        {isProcessing ? 'Returning...' : `Return ${booksToReturn.length} Book(s)`}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  )
}

function CirculationPageContent() {
    return (
        <AdminLayout>
            <div className="space-y-6">
                 <div>
                    <h1 className="text-2xl font-bold">Issue & Return</h1>
                    <p className="text-muted-foreground">Manage book circulation for members.</p>
                </div>
                <Tabs defaultValue="issue" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="issue"><BookUp className="mr-2 h-4 w-4"/>Issue Books</TabsTrigger>
                        <TabsTrigger value="return"><BookDown className="mr-2 h-4 w-4"/>Return Books</TabsTrigger>
                    </TabsList>
                    <TabsContent value="issue">
                       <IssueTab />
                    </TabsContent>
                    <TabsContent value="return">
                       <ReturnTab />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    )
}

export default function CirculationPage() {
    return (
        <AdminUserProvider>
            <CirculationPageContent />
        </AdminUserProvider>
    )
}
