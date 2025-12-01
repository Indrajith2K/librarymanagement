import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Header() {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-5xl">
      <div className="container flex h-14 items-center justify-between rounded-full border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Logo />
        <Button asChild variant="outline" className="rounded-full shadow-md">
          <Link href="/admin/login">Admin Login</Link>
        </Button>
      </div>
    </header>
  );
}
