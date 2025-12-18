'use client';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ReturnPage() {
  useEffect(() => {
    // Ensure light theme is applied on mount for standalone pages
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex flex-1 flex-col items-center justify-center p-4 gap-8">
        <Logo iconClassName="h-8 w-8" textClassName="text-3xl" />
        <div className="text-center">
            <h1 className="text-4xl font-bold">Return Successful</h1>
            <p className="text-lg text-muted-foreground mt-2">You have successfully returned the item.</p>
        </div>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </main>
    </div>
  );
}
