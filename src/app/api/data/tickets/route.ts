
import { NextResponse } from 'next/server';
import { getTicketsWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }
    // TODO: Add query param handling for statusFilter if needed
    const data = await getTicketsWHMCS(userId); // Default 'All Active'
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API DATA TICKETS ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching tickets.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
