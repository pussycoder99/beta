import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react';


const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className="text-gray-600 hover:text-primary transition-colors font-medium">
        {children}
    </Link>
);

const NavDropdown = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button className="flex items-center text-gray-600 hover:text-primary transition-colors font-medium">
                {title}
                <ChevronDown className="ml-1 h-4 w-4" />
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white">
            {children}
        </DropdownMenuContent>
    </DropdownMenu>
)

const DropdownLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
     <DropdownMenuItem asChild>
        <Link href={href}>{children}</Link>
    </DropdownMenuItem>
)


export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-light bg-white">
        <div className="border-b">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-2 text-sm text-gray-600">
                    <p>Don&apos;t Hesitate to try us out. Its FREE! Takes 1 Minute to sign up and Get 14 Days of FREE Singapore Premium Hosting!</p>
                    <p>What else do you need to speed up your online presence?</p>
                </div>
            </div>
        </div>
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    <Link href="/">
                        <Image src="https://snbdhost.com/wp-content/uploads/2025/05/Untitled-design-6.png" alt="SNBD Host Logo" width={150} height={40} className="h-10 w-auto" />
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        <NavLink href="/">Home</NavLink>
                        <NavDropdown title="Hosting">
                           <DropdownLink href="/services/order">Shared Hosting</DropdownLink>
                           <DropdownLink href="/services/order">Reseller Hosting</DropdownLink>
                           <DropdownLink href="/services/order">VPS Hosting</DropdownLink>
                        </NavDropdown>
                        <NavLink href="#">NBN Automation Hosting</NavLink>
                        <NavLink href="#">Domain</NavLink>
                         <NavDropdown title="Servers">
                           <DropdownLink href="#">Dedicated Servers</DropdownLink>
                           <DropdownLink href="#">Managed Servers</DropdownLink>
                        </NavDropdown>
                        <NavLink href="/support">Support</NavLink>
                        <NavLink href="#">Contact</NavLink>
                    </nav>
                    <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <Link href="/login">My Dashboard</Link>
                    </Button>
                </div>
            </div>
        </header>
        {children}
         <footer className="bg-white border-t">
            <div className="container mx-auto px-4 py-6 text-center text-gray-500">
                &copy; {new Date().getFullYear()} SNBD HOST. All rights reserved.
            </div>
        </footer>
    </div>
  );
}
