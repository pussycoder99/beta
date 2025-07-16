
import { NextResponse } from 'next/server';
import { validateLoginWHMCS, getUserDetailsWHMCS } from '@/lib/whmcs-mock-api'; 

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const loginResponse = await validateLoginWHMCS(email, password);

    if (loginResponse.result === 'success' && loginResponse.userid) {
      const userDetailsResponse = await getUserDetailsWHMCS(loginResponse.userid);
      if (userDetailsResponse.user) {
        // This is a placeholder token for demonstration purposes.
        // In a real production app, you would generate a secure JWT here.
        const placeholderToken = `whmcs-session-for-${loginResponse.userid}`;
        
        return NextResponse.json({ 
          user: userDetailsResponse.user, 
          token: placeholderToken,
          message: 'Login successful' 
        });
      } else {
        // This case is unlikely if login succeeded, but good to handle.
        return NextResponse.json({ message: 'User details not found after successful validation.' }, { status: 500 });
      }
    } else {
      // If login failed, return the message from WHMCS or a generic one.
      return NextResponse.json({ message: loginResponse.message || 'Invalid credentials or API error.' }, { status: 401 });
    }
  } catch (error) {
    console.error('[API LOGIN ROUTE ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
