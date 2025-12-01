'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, LogIn, LogOut, CheckCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type ScanState = 'idle' | 'verified' | 'options';

export default function Home() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [rfidInput, setRfidInput] = useState('');

  const handleScan = () => {
    // You could do something with the rfidInput here, like save it
    console.log('Scanned RFID:', rfidInput);
    setScanState('verified');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (scanState !== 'idle') return;

      // When the 'Enter' key is pressed, we'll consider the scan complete.
      if (event.key === 'Enter') {
        if (rfidInput.length > 0) {
          handleScan();
          setRfidInput(''); // Reset for the next scan
        }
      } else if (event.key.length === 1) {
        // Append character keys to our input state
        setRfidInput((prev) => prev + event.key);
      }
    };

    // Add event listener for keyboard input
    window.addEventListener('keydown', handleKeyDown);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [rfidInput, scanState]);

  useEffect(() => {
    if (scanState === 'verified') {
      const timer = setTimeout(() => {
        setScanState('options');
      }, 1500); // Wait for 1.5 seconds before showing options

      return () => clearTimeout(timer);
    }
  }, [scanState]);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
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
            <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
                <div className="relative w-full shadow-md rounded-full">
                    <Input placeholder="Search..." className="pl-4 pr-12 h-12 rounded-full text-lg" />
                    <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full">
                        <Search className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex w-full gap-8">
                    <Card className="flex-1 hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-0">
                            <Button variant="ghost" className="w-full h-full aspect-square flex flex-col items-center justify-center gap-4">
                                <LogIn className="h-20 w-20 text-foreground" />
                                <span className="text-2xl font-semibold text-foreground">Check In</span>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="flex-1 hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-0">
                            <Button variant="ghost" className="w-full h-full aspect-square flex flex-col items-center justify-center gap-4">
                                <LogOut className="h-20 w-20 text-foreground" />
                                <span className="text-2xl font-semibold text-foreground">Check Out</span>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
