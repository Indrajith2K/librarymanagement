'use client';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export function AdminHeader() {
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/');
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-6xl">
      <div className="container flex h-14 items-center justify-between rounded-full border bg-background/95 px-8 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Logo />
        <Button onClick={handleLogout} variant="outline" className="rounded-full shadow-md">
          Logout
        </Button>
      </div>
    </header>
  );
}

    