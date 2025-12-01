'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, CheckCircle } from 'lucide-react';

export default function Home() {
  const [isScanned, setIsScanned] = useState(false);

  const handleScan = () => {
    setIsScanned(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <Card className="w-[400px] shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-12">
            {!isScanned ? (
              <Button variant="ghost" className="h-auto w-auto flex flex-col items-center justify-center p-0" onClick={handleScan}>
                <div className="rounded-full bg-accent p-6">
                  <User className="h-24 w-24 text-accent-foreground" />
                </div>
                <p className="mt-6 text-center text-xl font-semibold text-foreground">
                  Scan your ID card
                </p>
              </Button>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="rounded-full bg-green-100 p-6">
                  <CheckCircle className="h-24 w-24 text-green-600" />
                </div>
                <p className="mt-6 text-center text-xl font-semibold text-foreground">
                  Successfully scanned your ID
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
