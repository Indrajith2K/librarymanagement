import { Library } from 'lucide-react';
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
      <div className="bg-pink-500 p-2 rounded-md">
        <Library className={cn("h-6 w-6 text-white", iconClassName)} />
      </div>
      <span className={cn("text-xl font-bold text-foreground hidden sm:inline-block", textClassName)}>quicklook</span>
    </Link>
  );
}
