
import { NextResponse } from 'next/server';
import { addDomainOrderWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';
import type { DomainConfiguration } from '@/types';

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }

    const config: DomainConfiguration = await request.json();

    if (!config.domainName || !config.registrationPeriod) {
      return NextResponse.json({ message: 'Domain name and registration period are required.' }, { status: 400 });
    }

    // Default payment method, can be made dynamic later
    const paymentMethod = 'paypal'; 

    const result = await addDomainOrderWHMCS(userId, config, paymentMethod);

    if (result.result === 'success' && result.orderid && result.invoiceid) {
        const whmcsAppUrl = process.env.NEXT_PUBLIC_WHMCS_APP_URL || 'https://portal.snbdhost.com';
        const invoiceUrl = `${whmcsAppUrl}/viewinvoice.php?id=${result.invoiceid}`;
      
        return NextResponse.json({ 
            message: 'Order placed successfully.', 
            orderid: result.orderid,
            invoiceid: result.invoiceid,
            invoiceUrl: invoiceUrl
        });
    } else {
      return NextResponse.json({ message: result.message || 'Failed to place order via WHMCS.' }, { status: 500 });
    }

  } catch (error) {
    console.error('[API DOMAIN ORDER ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while placing the domain order.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
