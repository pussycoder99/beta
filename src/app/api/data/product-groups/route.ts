
import { NextResponse } from 'next/server';
import { getProductGroupsWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils'; // To protect route if needed

export async function GET(request: Request) {
  try {
    // Optional: Protect this route if only logged-in users should see product groups
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    // if (!userId) {
      // If you want to allow anonymous access to product groups, remove this check
      // return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    // }

    const data = await getProductGroupsWHMCS();
    console.log('[API /api/data/product-groups] Sending product groups to client. Count:', data.groups.length, 'Raw WHMCS data for groups:', data.whmcsData?.groups);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API DATA PRODUCT GROUPS ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching product groups.';
    return NextResponse.json({ message: errorMessage, errorDetails: String(error) }, { status: 500 });
  }
}

