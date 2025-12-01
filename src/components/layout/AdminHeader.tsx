
'use client';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    // For now, this just redirects to the home page.
    // In a real app, you'd handle actual session logout here.
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Logo />
        <Button onClick={handleLogout} variant="outline" className="rounded-full shadow-md">
          Logout
        </Button>
      </div>
    </header>
  );
}
