
'use server';

import { NextResponse } from 'next/server';
import { updateRegistrarLockStatusWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';

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
    const { lockstatus } = body;

    if (typeof lockstatus !== 'boolean') {
        return NextResponse.json({ message: 'A valid lock status (true or false) is required.' }, { status: 400 });
    }

    const result = await updateRegistrarLockStatusWHMCS(domainId, lockstatus);

    if (result.result === 'success') {
      return NextResponse.json({ message: 'Registrar Lock updated successfully.', newStatus: result.newStatus });
    } else {
      return NextResponse.json({ message: result.message || 'Failed to update registrar lock.' }, { status: 500 });
    }

  } catch (error) {
    console.error(`[API DOMAIN LOCK ERROR for ${params.domainId}]`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
