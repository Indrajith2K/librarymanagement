'use client';

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Menu, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/hooks/use-sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminUser } from "@/context/AdminUserContext";

export function AdminHeader() {
  const { isMobile } = useSidebar();
  const { adminUser } = useAdminUser();

  const getInitials = (name: string | undefined) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30">
      {!isMobile && (
        <div className="hidden md:block">
            {/* This space is for the sidebar trigger if needed, or to maintain layout */}
        </div>
      )}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center justify-between gap-4">
        <h1 className="text-xl font-semibold hidden md:block">Dashboard</h1>
        <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px]"
            />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Toggle notifications</span>
        </Button>
        <Avatar className="h-9 w-9">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${adminUser?.staffId || adminUser?.email}`} />
            <AvatarFallback>{getInitials(adminUser?.displayName)}</AvatarFallback>
        </Avatar>
        <div>
            <p className="text-sm font-semibold">{adminUser?.displayName || 'Admin User'}</p>
            <p className="text-xs text-muted-foreground">{adminUser?.role || 'Admin Role'}</p>
        </div>
      </div>
    </header>
  );
}
