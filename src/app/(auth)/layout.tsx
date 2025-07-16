import React from 'react';
import { SnbdLogo } from '@/components/icons';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <SnbdLogo className="h-12 w-auto" />
        </Link>
        <div className="dark:bg-card bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-muted-foreground">
          &copy; {new Date().getFullYear()} SNBD Host. All rights reserved.
        </p>
      </div>
    </div>
  );
}
