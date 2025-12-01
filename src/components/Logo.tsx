import { Rocket } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export function Logo({ className, iconClassName, textClassName }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Rocket className={cn("h-6 w-6 text-accent", iconClassName)} />
      <span className={cn("text-xl font-bold text-foreground", textClassName)}>quicklook</span>
    </Link>
  );
}
