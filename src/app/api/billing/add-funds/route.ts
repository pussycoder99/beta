
import { NextResponse } from 'next/server';
import { addFundsWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }

    const { amount, paymentMethod } = await request.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount specified.' }, { status: 400 });
    }
    if (!paymentMethod || typeof paymentMethod !== 'string') {
      return NextResponse.json({ message: 'Payment method is required.' }, { status: 400 });
    }

    // In a real scenario, map UI paymentMethod string to actual WHMCS payment gateway names
    // e.g., if UI sends "paypal", map it to "paypalcheckout" or whatever your WHMCS gateway is named.
    // For this example, we'll assume paymentMethod is the direct gateway name.
    const whmcsPaymentGateway = paymentMethod; 

    const result = await addFundsWHMCS(userId, amount, whmcsPaymentGateway);

    if (result.result === 'success' && result.invoiceId && result.paymentUrl) {
      return NextResponse.json({ 
        message: 'Invoice created successfully for adding funds.', 
        invoiceId: result.invoiceId,
        paymentUrl: result.paymentUrl 
      });
    } else {
      return NextResponse.json({ message: result.message || 'Failed to add funds via WHMCS.' }, { status: 500 });
    }

  } catch (error) {
    console.error('[API ADD FUNDS ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while adding funds.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
