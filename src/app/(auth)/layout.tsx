import React from 'react';
import { SnbdLogo } from '@/components/icons';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <SnbdLogo className="h-12 w-auto" />
        </Link>
        <div className="bg-card p-6 sm:p-8 rounded-lg shadow-xl">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SNBD Host. All rights reserved.
        </p>
      </div>
    </div>
  );
}
