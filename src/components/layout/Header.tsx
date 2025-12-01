import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Header() {
  return (
    <header className="fixed top-4 left-4 right-4 z-50 rounded-full border border-white/20 bg-white/10 shadow-lg backdrop-blur-lg supports-[backdrop-filter]:bg-white/10">
      <div className="flex h-14 items-center justify-between px-6">
        <Logo />
        <Button asChild variant="outline" className="rounded-full">
          <Link href="#">Admin Login</Link>
        </Button>
      </div>
    </header>
  );
}
