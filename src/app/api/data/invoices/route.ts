
import { NextResponse } from 'next/server';
import { getInvoicesWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }
    // TODO: Add query param handling for statusFilter if needed by dashboard or other pages
    const data = await getInvoicesWHMCS(userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API DATA INVOICES ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching invoices.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
