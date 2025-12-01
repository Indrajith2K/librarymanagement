import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Logo />
        <Button asChild variant="outline" className="rounded-full shadow-md">
          <Link href="/admin/login">Admin Login</Link>
        </Button>
      </div>
    </header>
  );
}
