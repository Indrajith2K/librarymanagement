import { Logo } from '@/components/Logo';

export function Header() {
  return (
    <header className="w-full rounded-full border border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <Logo />
      </div>
    </header>
  );
}
