
import { NextResponse } from 'next/server';
import { getTicketsWHMCS, openTicketWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';
import type { Ticket } from '@/types';

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }
    // TODO: Add query param handling for statusFilter if needed
    const data = await getTicketsWHMCS(userId, 'All Active'); // Default to All Active tickets
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API DATA TICKETS ERROR - GET]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching tickets.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}


export async function POST(request: Request) {
    try {
        const userId = getUserIdFromToken(request.headers.get('Authorization'));
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
        }

        const body = await request.json();
        const { subject, department, message, priority, serviceid } = body;

        if (!subject || !department || !message || !priority) {
            return NextResponse.json({ message: 'Missing required fields for ticket creation.' }, { status: 400 });
        }
        
        const result = await openTicketWHMCS({
            clientid: userId,
            deptname: department,
            subject,
            message,
            priority,
            ...(serviceid && { serviceid }),
        });

        if (result.result === 'success' && result.ticketId) {
            return NextResponse.json({
                message: 'Ticket opened successfully.',
                ticketId: result.ticketId,
                ticketNumber: result.ticketNumber,
            });
        } else {
            return NextResponse.json({ message: result.message || 'Failed to open ticket via WHMCS.' }, { status: 500 });
        }

    } catch (error) {
        console.error('[API DATA TICKETS ERROR - POST]', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while creating the ticket.';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
