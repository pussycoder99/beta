
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
      // Successfully validated with WHMCS, now fetch user details
      const userDetailsResponse = await getUserDetailsWHMCS(loginResponse.userid); // Use userid from loginResponse
      if (userDetailsResponse.user) {
        // In a real app, you'd generate a proper session token (e.g., JWT) here
        // Or use the passwordhash from loginResponse if needed for WHMCS session integration
        const placeholderToken = `whmcs-session-for-${loginResponse.userid}`;
        return NextResponse.json({ 
          user: userDetailsResponse.user, 
          token: placeholderToken, // This is our app's session token, not directly from WHMCS API login
          message: 'Login successful' 
        });
      } else {
        return NextResponse.json({ message: 'User details not found after login.' }, { status: 500 });
      }
    } else {
      // If loginResponse contains a message, use it, otherwise provide a generic one
      return NextResponse.json({ message: loginResponse.message || 'Invalid credentials or unknown API error' }, { status: 401 });
    }
  } catch (error) {
    console.error('[API LOGIN ERROR]', error);
    let errorMessage = 'An unexpected error occurred during login.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    try {
      const parsedError = JSON.parse(errorMessage);
      if (parsedError && parsedError.message) {
        errorMessage = parsedError.message;
      }
    } catch (e) {
      // not a JSON string
    }
    return NextResponse.json({ message: `Login failed: ${errorMessage}` }, { status: 500 });
  }
}
