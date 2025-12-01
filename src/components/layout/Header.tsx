import { Logo } from '@/components/Logo';

export function Header() {
  return (
    <header className="fixed top-4 left-4 right-4 z-50 rounded-full border border-white/20 bg-white/10 shadow-lg backdrop-blur-lg supports-[backdrop-filter]:bg-white/10">
      <div className="flex h-14 items-center justify-start px-6">
        <Logo />
      </div>
    </header>
  );
}
