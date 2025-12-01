'use client';

import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CheckOutPage() {

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8">Check Out</h1>
        <p className="text-lg text-muted-foreground mb-8">You have successfully checked out.</p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </main>
    </div>
  );
}
