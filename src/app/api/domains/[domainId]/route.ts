
'use server';

import { NextResponse } from 'next/server';
import { getDomainDetailsWHMCS, updateDomainNameserversWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';

export async function GET(request: Request, { params }: { params: { domainId: string } }) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }

    const { domainId } = params;
    if (!domainId) {
      return NextResponse.json({ message: 'Domain ID is required.' }, { status: 400 });
    }

    // In a real scenario, you'd also verify that this domain belongs to the userId
    const data = await getDomainDetailsWHMCS(domainId);

    if (data.domain) {
        return NextResponse.json(data);
    } else {
        return NextResponse.json({ message: 'Domain not found.' }, { status: 404 });
    }

  } catch (error) {
    console.error(`[API DOMAIN DETAILS ERROR for ${params.domainId}]`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}


export async function POST(request: Request, { params }: { params: { domainId: string } }) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }

    const { domainId } = params;
    if (!domainId) {
      return NextResponse.json({ message: 'Domain ID is required.' }, { status: 400 });
    }
    
    const body = await request.json();
    const { ns1, ns2, ns3, ns4, ns5 } = body;
    
    // Basic validation
    if (!ns1 || !ns2) {
        return NextResponse.json({ message: 'At least two nameservers are required.' }, { status: 400 });
    }

    const result = await updateDomainNameserversWHMCS(domainId, { ns1, ns2, ns3, ns4, ns5 });

    if (result.result === 'success') {
      return NextResponse.json({ message: 'Nameservers updated successfully.' });
    } else {
      return NextResponse.json({ message: result.message || 'Failed to update nameservers.' }, { status: 500 });
    }

  } catch (error) {
    console.error(`[API DOMAIN UPDATE ERROR for ${params.domainId}]`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
