
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, LogIn, LogOut, CheckCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type ScanState = 'idle' | 'verified' | 'options';

interface Book {
  id: string;
  title: string;
  author: string;
  quantityTotal: number;
  quantityIssued: number;
}

function SearchComponent() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);


  const booksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'books'));
  }, [firestore]);

  const { data: books, loading: booksLoading } = useCollection<Book>(booksQuery, 'books');

  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim() || !books) return [];
    return books.filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, books]);

  useEffect(() => {
      setPopoverOpen(searchTerm.trim().length > 0);
  }, [searchTerm, filteredBooks]);

  return (
    <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
        <div className="relative w-full shadow-md rounded-full">
            <PopoverAnchor asChild>
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            </PopoverAnchor>
            <PopoverTrigger asChild>
                <Input
                    ref={inputRef}
                    placeholder="Search for any book..."
                    className="pl-12 pr-4 h-14 rounded-full text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </PopoverTrigger>
        </div>
        <PopoverContent 
            className="w-[--radix-popover-trigger-width] mt-2 p-2"
            onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
        >
            {booksLoading && (
                <div className="p-2 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                </div>
            )}
            {!booksLoading && filteredBooks.length > 0 && (
                <ul className="space-y-1">
                    {filteredBooks.slice(0, 5).map(book => (
                        <li key={book.id} className="p-2 rounded-md hover:bg-accent cursor-pointer text-sm">
                            <p className="font-medium">{book.title}</p>
                            <p className="text-xs text-muted-foreground">{book.author}</p>
                        </li>
                    ))}
                </ul>
            )}
            {!booksLoading && filteredBooks.length === 0 && searchTerm && (
                 <div className="p-4 text-center text-sm text-muted-foreground">
                    No books found for "{searchTerm}".
                </div>
            )}
        </PopoverContent>
    </Popover>
  )
}


export default function Home() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [rfidInput, setRfidInput] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleScan = () => {
    // Store the "scanned" ID in session storage to identify the user
    sessionStorage.setItem('quicklook-member-id', rfidInput);
    toast({ title: 'ID Scanned', description: 'Member identified successfully.' });
    setScanState('verified');
  };

  const handleIssue = () => {
    router.push('/issue');
  }

  const handleReturn = () => {
    router.push('/return');
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (scanState !== 'idle') return;

      if (event.key === 'Enter') {
        if (rfidInput.length > 0) {
          handleScan();
          setRfidInput('');
        }
      } else if (event.key.length === 1) {
        setRfidInput((prev) => prev + event.key);
      } else if (event.key === 'Backspace') {
        setRfidInput((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [rfidInput, scanState]);

  useEffect(() => {
    if (scanState === 'verified') {
      const timer = setTimeout(() => {
        setScanState('options');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [scanState]);


  return (
    <div className="flex flex-col min-h-screen bg-background">
        <div className="absolute top-4 right-4 z-50">
            <Button asChild variant="outline" className="rounded-full shadow-md">
                <Link href="/admin/login">Admin Login</Link>
            </Button>
        </div>
      <main className="flex flex-1 items-center justify-center">
        {scanState === 'idle' && (
            <Card className="w-[400px] shadow-lg">
                <CardContent className="flex flex-col items-center justify-center p-12">
                    <Button variant="ghost" className="h-auto w-auto flex flex-col items-center justify-center p-0" onClick={handleScan}>
                        <div className="rounded-full bg-accent p-6">
                        <User className="h-24 w-24 text-accent-foreground" />
                        </div>
                        <p className="mt-6 text-center text-xl font-semibold text-foreground">
                        Scan your ID card
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">(Simulated via keyboard input + Enter)</p>
                    </Button>
                </CardContent>
            </Card>
        )}
        {scanState === 'verified' && (
             <Card className="w-[400px] shadow-lg">
                <CardContent className="flex flex-col items-center justify-center p-12">
                    <div className="flex flex-col items-center justify-center">
                        <CheckCircle className="h-32 w-32 text-green-500" />
                        <p className="mt-6 text-center text-xl font-semibold text-foreground">
                        Verified
                        </p>
                    </div>
                </CardContent>
            </Card>
        )}
        {scanState === 'options' && (
            <div className="flex flex-col items-center gap-8 w-full max-w-2xl px-4">
                <Logo className="mb-4" iconClassName="h-10 w-10" textClassName="text-4xl" />
                
                <SearchComponent />

                <div className="flex w-full gap-8">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Card className="flex-1 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                              <CardContent className="p-0">
                                  <div className="w-full h-full aspect-square flex flex-col items-center justify-center gap-4">
                                      <LogIn className="h-20 w-20 text-foreground" />
                                      <span className="text-2xl font-semibold text-foreground">Issue</span>
                                  </div>
                              </CardContent>
                          </Card>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                          <AlertDialogTitle>Proceed to Issue Books?</AlertDialogTitle>
                          <AlertDialogDescription>
                              This will take you to the book issuance page.
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                          <AlertDialogCancel>No</AlertDialogCancel>
                          <AlertDialogAction onClick={handleIssue}>Yes</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Card className="flex-1 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                                <CardContent className="p-0">
                                    <div className="w-full h-full aspect-square flex flex-col items-center justify-center gap-4">
                                        <LogOut className="h-20 w-20 text-foreground" />
                                        <span className="text-2xl font-semibold text-foreground">Return</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Proceed to Return Books?</AlertDialogTitle>
                            <AlertDialogDescription>
                               This will take you to the book return page.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReturn}>Yes</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="text-center mt-4">
                    <h3 className="text-lg font-semibold text-foreground">About Quicklook</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                        Quicklook is a RFID based smart AI library management system. Seamlessly check in and check out books with a simple tap of your ID card. Our intelligent system helps you find books faster and manage your borrows with ease.
                    </p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
