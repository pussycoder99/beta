
import { NextResponse } from 'next/server';
import { getPaymentMethodsWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }
    
    const data = await getPaymentMethodsWHMCS();

    return NextResponse.json(data);

  } catch (error) {
    console.error('[API PAYMENT METHODS ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching payment methods.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
