
import { NextResponse } from 'next/server';
import { getDomainsWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }
    const data = await getDomainsWHMCS(userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API DATA DOMAINS ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching domains.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
