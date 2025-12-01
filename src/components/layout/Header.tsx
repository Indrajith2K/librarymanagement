import { Logo } from '@/components/Logo';

export function Header() {
  return (
    <header className="w-full rounded-full border border-white/20 bg-white/10 shadow-lg backdrop-blur-lg supports-[backdrop-filter]:bg-white/10">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <Logo />
      </div>
    </header>
  );
}
