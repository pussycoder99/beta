
import { NextResponse } from 'next/server';
import { resendVerificationEmailWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }

    const result = await resendVerificationEmailWHMCS(userId);

    if (result.result === 'success') {
      return NextResponse.json({ message: 'Verification email has been resent successfully.' });
    } else {
      return NextResponse.json({ message: result.message || 'Failed to resend verification email.' }, { status: 500 });
    }

  } catch (error) {
    console.error('[API RESEND VERIFICATION ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
