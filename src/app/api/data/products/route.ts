
import { NextResponse, type NextRequest } from 'next/server';
import { getProductsWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils'; // To protect route if needed

export async function GET(request: NextRequest) {
  try {
    // Optional: Protect this route if only logged-in users should see products
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
     if (!userId) {
      // If you want to allow anonymous access to products, remove this check
      // return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gid = searchParams.get('gid'); // Get group ID from query parameters

    const data = await getProductsWHMCS(gid || undefined); // Pass gid if present
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API DATA PRODUCTS ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching products.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
