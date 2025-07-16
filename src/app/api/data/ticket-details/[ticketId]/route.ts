
import { NextResponse } from 'next/server';
import { getTicketByIdWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';

export async function GET(request: Request, { params }: { params: { ticketId: string } }) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }

    const { ticketId } = params;
    if (!ticketId) {
      return NextResponse.json({ message: 'Ticket ID is required.' }, { status: 400 });
    }

    // Note: getTicketByIdWHMCS does not require userId, but we can check ownership if WHMCS API provided it.
    // For now, we assume if the user has a valid session token, they might have access.
    // A more secure check would be to get the ticket and see if its clientid matches userId.
    const data = await getTicketByIdWHMCS(ticketId);
    
    // Example of ownership check if clientid was available in the ticket details:
    // if (data.ticket && data.whmcsData.clientid.toString() !== userId) {
    //    return NextResponse.json({ message: 'Access denied to this ticket.' }, { status: 403 });
    // }

    return NextResponse.json(data);

  } catch (error) {
    console.error(`[API DATA TICKET DETAILS ERROR for ${params.ticketId}]`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
