
'use client';
import { useState, useMemo, useEffect, Fragment } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ScanLine, X, BookUp, BookDown, User, Users, Library, XCircle, ArrowRight } from 'lucide-react';
import { AdminUserProvider, useAdminUser } from '@/context/AdminUserContext';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, writeBatch, doc, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addDays, format } from 'date-fns';

interface Book {
  id: string;
  title: string;
  author: string;
  rfidTagId: string;
  status: 'available' | 'issued' | 'lost' | 'damaged' | 'reserved';
}
interface Member {
  id: string;
  name: string;
  email: string;
}

const loanPeriodDays = 14; 

function IssueTab() {
  const firestore = useFirestore();
  const { adminUser } = useAdminUser();
  const { toast } = useToast();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [booksToIssue, setBooksToIssue] = useState<Book[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isMemberDialogOpen, setMemberDialogOpen] = useState(false);
  const [isBookDialogOpen, setBookDialogOpen] = useState(false);

  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');

  const { data: members, loading: membersLoading } = useCollection<Member>(useMemo(() => firestore ? query(collection(firestore, 'members')) : null, [firestore]));
  const { data: availableBooks, loading: booksLoading } = useCollection<Book>(useMemo(() => firestore ? query(collection(firestore, 'books'), where('status', '==', 'available')) : null, [firestore]));

  const filteredMembers = useMemo(() => members?.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase())), [members, memberSearch]);
  const filteredBooks = useMemo(() => availableBooks?.filter(b => b.title.toLowerCase().includes(bookSearch.toLowerCase())), [availableBooks, bookSearch]);

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
            // Update book status
            const bookRef = doc(firestore, 'books', book.id);
            batch.update(bookRef, { status: 'issued' });

            // Create circulation log
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
        // Reset state
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
                                    <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent" onClick={() => {setSelectedMember(member); setMemberDialogOpen(false);}}>
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
                                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {booksLoading ? <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow> : filteredBooks?.map(book => (
                                            <TableRow key={book.id}>
                                                <TableCell>{book.title}</TableCell>
                                                <TableCell>{book.author}</TableCell>
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

  const [booksToReturn, setBooksToReturn] = useState<Book[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedId, setScannedId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: issuedBooks, loading: booksLoading } = useCollection<Book>(useMemo(() => firestore ? query(collection(firestore, 'books'), where('status', '==', 'issued')) : null, [firestore]));

  useEffect(() => {
    if (!isScanning) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && scannedId) {
        const foundBook = issuedBooks?.find(b => b.rfidTagId === scannedId);
        if (foundBook) {
          if (!booksToReturn.some(b => b.id === foundBook.id)) {
            setBooksToReturn(prev => [...prev, foundBook]);
            toast({ title: 'Book Added to Return List', description: foundBook.title });
          } else {
            toast({ variant: 'destructive', title: 'Duplicate Scan', description: 'This book is already in the return list.' });
          }
        } else {
          toast({ variant: 'destructive', title: 'Book Not Found', description: `No issued book found with RFID: ${scannedId}` });
        }
        setScannedId('');
      } else if (event.key.length === 1) {
        setScannedId(prev => prev + event.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScanning, scannedId, issuedBooks, booksToReturn, toast]);
  
  const handleRemoveBook = (bookId: string) => setBooksToReturn(booksToReturn.filter(b => b.id !== bookId));

  const handleReturn = async () => {
    if (booksToReturn.length === 0 || !firestore || !adminUser) return;
    setIsProcessing(true);
    try {
        const batch = writeBatch(firestore);
        for(const book of booksToReturn) {
            const bookRef = doc(firestore, 'books', book.id);
            batch.update(bookRef, { status: 'available' });

            const logQuery = query(collection(firestore, 'circulationLogs'), where('bookId', '==', book.id), where('status', '==', 'issued'));
            const logSnapshot = await getDocs(logQuery);
            if (!logSnapshot.empty) {
                const logDocRef = logSnapshot.docs[0].ref;
                batch.update(logDocRef, {
                    status: 'returned',
                    action: 'return',
                    returnedAt: serverTimestamp(),
                });
            }
        }
        await batch.commit();
        toast({title: 'Success', description: `${booksToReturn.length} book(s) have been returned.`});
        setBooksToReturn([]);
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
                    <CardTitle className="flex items-center gap-2"><ScanLine /> RFID Return Scanner</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center space-y-4 p-4 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-center text-muted-foreground">
                           {isScanning ? 'Scanner is active. Present books now.' : 'Activate the scanner to add books to the return list.'}
                        </p>
                        <Button onClick={() => setIsScanning(p => !p)} variant={isScanning ? 'destructive' : 'default'} className="w-full max-w-sm">
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
            <Card>
                <CardHeader><CardTitle>All Issued Books</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="h-72">
                    <Table>
                        <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>RFID Tag ID</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {booksLoading && <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>}
                            {!booksLoading && issuedBooks?.map(book => (
                                <TableRow key={book.id}>
                                    <TableCell>{book.title}</TableCell>
                                    <TableCell>{book.author}</TableCell>
                                    <TableCell>{book.rfidTagId}</TableCell>
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
                            {booksToReturn.map(book => (
                                <div key={book.id} className="text-sm flex justify-between items-center bg-muted/50 p-2 rounded-md">
                                    <span>{book.title}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveBook(book.id)}><XCircle className="h-4 w-4"/></Button>
                                </div>
                            ))}
                            </div>
                            </ScrollArea>
                        ) : <p className="text-muted-foreground text-sm">No books scanned for return.</p>}
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

