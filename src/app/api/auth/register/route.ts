
import { NextResponse } from 'next/server';
import { addClientWHMCS } from '@/lib/whmcs-mock-api'; // Using WHMCS direct function
import type { User } from '@/types';

export async function POST(request: Request) {
  try {
    const userData = await request.json() as Omit<User, 'id'> & { password: string };

    if (!userData.email || !userData.firstName || !userData.lastName || !userData.password) {
      return NextResponse.json({ message: 'Missing required registration fields' }, { status: 400 });
    }
    
    // Basic validation example (add more as needed)
    if (userData.password.length < 8) {
        return NextResponse.json({ message: 'Password must be at least 8 characters long'}, { status: 400});
    }


    const response = await addClientWHMCS(userData);

    if (response.result === 'success' && response.userId) {
      return NextResponse.json({ message: 'Registration successful. Please login.', userId: response.userId });
    } else {
      return NextResponse.json({ message: response.message || 'Registration failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('[API REGISTER ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: `Registration failed: ${errorMessage}` }, { status: 500 });
  }
}

    