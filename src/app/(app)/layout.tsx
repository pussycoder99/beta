
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Bell,
  LifeBuoy,
  Menu,
  AlertTriangle,
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
  const [open, setOpen] = React.useState(false);

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
    <div className="flex min-h-screen w-full flex-col bg-gray-50">
       <div className="bg-yellow-100 text-yellow-800 p-2 text-center text-sm flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>This is a BETA application. Some features may not work as expected.</span>
       </div>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
          <Link href="/dashboard" className="mr-4 flex items-center gap-2">
            <Image 
                src="https://snbdhost.com/wp-content/uploads/2025/05/Untitled-design-6.png" 
                alt="SNBD Host Logo" 
                width={150} 
                height={40} 
                className="h-8 w-auto"
            />
             <Badge variant="outline" className="border-primary text-primary">BETA</Badge>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 items-center justify-start gap-6">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} isActive={pathname.startsWith(item.href)}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Navigation Trigger */}
          <div className="flex w-full justify-end md:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                          <Menu className="h-5 w-5" />
                          <span className="sr-only">Toggle navigation menu</span>
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                      <nav className="grid gap-6 text-lg font-medium">
                          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold mb-4" onClick={() => setOpen(false)}>
                              <Image src="https://snbdhost.com/wp-content/uploads/2025/05/Untitled-design-6.png" alt="SNBD Host Logo" width={150} height={40} className="h-8 w-auto" />
                          </Link>
                          {navItems.map((item) => (
                              <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
                                  {item.label}
                              </Link>
                          ))}
                      </nav>
                  </SheetContent>
              </Sheet>
          </div>
          
          <div className="ml-auto hidden md:flex items-center gap-4">
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
    </div>
  );
}
