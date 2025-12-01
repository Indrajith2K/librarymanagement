import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Header() {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full border border-border/20 bg-background/50 shadow-lg backdrop-blur-lg supports-[backdrop-filter]:bg-background/50">
      <div className="flex h-14 items-center justify-between px-6">
        <Logo />
        <Button asChild variant="outline" className="rounded-full shadow-md ml-4">
          <Link href="/admin/login">Admin Login</Link>
        </Button>
      </div>
    </header>
  );
}
