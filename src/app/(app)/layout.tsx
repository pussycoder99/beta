
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Server,
  Globe,
  CreditCard,
  MessageSquare,
  User as UserIcon,
  LogOut,
  Settings,
  Bell,
  LifeBuoy,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/services', label: 'Services', icon: Server },
  { href: '/domains', label: 'Domains', icon: Globe },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/support', label: 'Support', icon: MessageSquare },
];

const NavLink = ({ href, children, isActive }: { href: string; children: React.ReactNode, isActive: boolean }) => (
    <Link 
        href={href} 
        className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            isActive ? "text-primary font-semibold" : "text-muted-foreground"
        )}
    >
        {children}
    </Link>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      </div>
    );
  }
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  }

  return (
    <SidebarProvider defaultOpen>
      {/* The sidebar is now mainly for mobile navigation */}
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
            <Link href="/dashboard">
                <Image 
                    src="https://snbdhost.com/wp-content/uploads/2025/05/Untitled-design-6.png" 
                    alt="SNBD Host Logo" 
                    width={40} 
                    height={40} 
                    className="h-10 w-10 object-contain"
                />
            </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label, side: 'right', align: 'center' }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
           <SidebarMenu>
             <SidebarMenuItem>
                <Link href="/settings">
                  <SidebarMenuButton
                    isActive={pathname.startsWith('/settings')}
                    tooltip={{ children: 'Settings', side: 'right', align: 'center' }}
                  >
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Link href="/dashboard" className="hidden md:flex items-center gap-2">
            <Image 
                src="https://snbdhost.com/wp-content/uploads/2025/05/Untitled-design-6.png" 
                alt="SNBD Host Logo" 
                width={150} 
                height={40} 
                className="h-8 w-auto"
            />
          </Link>
          
          {/* Mobile Sidebar Trigger */}
          <SidebarTrigger className="md:hidden" />

          <nav className="hidden md:flex flex-1 items-center justify-center gap-6">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} isActive={pathname.startsWith(item.href)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(user?.firstName)}`} alt={user?.firstName || ''} data-ai-hint="user avatar" />
                    <AvatarFallback>{user ? getInitials(user.firstName + ' ' + user.lastName) : 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile"><UserIcon className="mr-2 h-4 w-4" /> Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing"><CreditCard className="mr-2 h-4 w-4" /> Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/support"><LifeBuoy className="mr-2 h-4 w-4" /> Support</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
