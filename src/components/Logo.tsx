import { Rocket } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Rocket className="h-6 w-6 text-accent" />
      <span className="text-xl font-bold text-foreground">React Starter</span>
    </Link>
  );
}
