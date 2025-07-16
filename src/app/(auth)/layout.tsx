import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Image src="https://snbdhost.com/wp-content/uploads/2025/05/Untitled-design-6.png" alt="SNBD Host Logo" width={200} height={50} className="h-12 w-auto" />
        </Link>
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} SNBD Host. All rights reserved.
        </p>
      </div>
    </div>
  );
}
