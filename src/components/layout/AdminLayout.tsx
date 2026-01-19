'use client';
import { ReactNode } from 'react';
import { SidebarProvider } from '@/hooks/use-sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminUserProvider } from '@/context/AdminUserContext';
import { SupportChat } from '@/components/SupportChat';

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          <div className="hidden md:block">
              <AdminSidebar />
          </div>
          <div className="flex-1 flex flex-col">
            <AdminHeader />
            <main className="flex-1 p-6 lg:p-8">
              {children}
            </main>
          </div>
          <SupportChat />
        </div>
    </SidebarProvider>
  );
}
