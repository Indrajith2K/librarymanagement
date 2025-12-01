import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const navLinks = [
    { href: "#", label: "Home" },
    { href: "#", label: "About" },
    { href: "#", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Button key={link.label} variant="ghost" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Get Started
          </Button>
        </nav>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 p-4">
                <Logo />
                <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Button key={link.label} variant="ghost" asChild className="justify-start">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Get Started
                </Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
