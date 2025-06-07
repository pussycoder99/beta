
import { NextResponse } from 'next/server';
import { getUserDetailsWHMCS } from '@/lib/whmcs-mock-api'; // Using WHMCS direct function

// This route fetches user details based on a userId extracted from a placeholder token
// In a real app, this would involve validating a proper session token (e.g., JWT)
export async function GET(request: Request) {
  try {
    // Example: Extract userId from a placeholder token in Authorization header
    // "Bearer mock-jwt-token-for-USERID"
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const userIdPrefix = "mock-jwt-token-for-";
    
    let userId: string | null = null;
    if (token.startsWith(userIdPrefix)) {
        userId = token.replace(userIdPrefix, '');
    }
    // Add other prefixes if your AuthContext uses different placeholder token formats
    const whmcsSessionPrefix = "whmcs-session-for-";
    if (token.startsWith(whmcsSessionPrefix)) {
        userId = token.replace(whmcsSessionPrefix, '');
    }


    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized: Invalid token format' }, { status: 401 });
    }
    
    const userDetailsResponse = await getUserDetailsWHMCS(userId);

    if (userDetailsResponse.user) {
      return NextResponse.json({ user: userDetailsResponse.user });
    } else {
      return NextResponse.json({ message: 'User not found or error fetching details' }, { status: 404 });
    }
  } catch (error) {
    console.error('[API USER DETAILS ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: `Failed to fetch user details: ${errorMessage}` }, { status: 500 });
  }
}

    