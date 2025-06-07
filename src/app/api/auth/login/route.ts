
import { NextResponse } from 'next/server';
import { validateLoginWHMCS, getUserDetailsWHMCS } from '@/lib/whmcs-mock-api'; // Now using WHMCS direct functions

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const loginResponse = await validateLoginWHMCS(email, password);

    if (loginResponse.result === 'success' && loginResponse.userId) {
      // Successfully validated with WHMCS, now fetch user details
      const userDetailsResponse = await getUserDetailsWHMCS(loginResponse.userId);
      if (userDetailsResponse.user) {
        // In a real app, you'd generate a proper session token (e.g., JWT) here
        // For now, we'll return user details and a placeholder token structure
        const placeholderToken = `mock-jwt-token-for-${loginResponse.userId}`;
        return NextResponse.json({ 
          user: userDetailsResponse.user, 
          token: placeholderToken,
          message: 'Login successful' 
        });
      } else {
        // This case should ideally not happen if ValidateLogin succeeded with a userId
        return NextResponse.json({ message: 'User details not found after login.' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ message: loginResponse.message || 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    console.error('[API LOGIN ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: `Login failed: ${errorMessage}` }, { status: 500 });
  }
}

    