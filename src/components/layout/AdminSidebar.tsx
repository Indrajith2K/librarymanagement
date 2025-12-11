'use client';

import { Logo } from '@/components/Logo';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { LayoutDashboard, Book, Users, History, Settings, LogOut, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/books', icon: Book, label: 'Books' },
  { href: '/admin/members', icon: Users, label: 'Members' },
  { href: '/admin/history', icon: History, label: 'History' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminSidebar() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = async () => {
    // Clear the dummy admin session flag
    sessionStorage.removeItem('dummy_admin');
    
    if (auth && auth.currentUser) {
      await signOut(auth);
    }
    
    // Redirect to the main homepage after logout
    router.push('/');
  };


  return (
    <div className={cn("flex h-full flex-col", isMobile ? "w-full" : "w-64")}>
      <div className="border-b p-4">
        <Logo textClassName="text-xl" />
      </div>
      <nav className="flex flex-col p-4 space-y-2 flex-grow">
        {navItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className="justify-start"
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t mt-auto">
        <Button variant="ghost" className="w-full justify-start mb-2">
            <HelpCircle className="mr-2 h-4 w-4" />
            Help
        </Button>
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
