
import { NextResponse } from 'next/server';
import { replyToTicketWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';

export async function POST(request: Request, { params }: { params: { ticketId: string } }) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }

    const { ticketId } = params;
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ message: 'Reply message cannot be empty.' }, { status: 400 });
    }

    const result = await replyToTicketWHMCS({
      ticketid: ticketId,
      message,
      clientid: userId,
    });

    if (result.result === 'success') {
      return NextResponse.json({ message: 'Reply posted successfully.', reply: result.reply });
    } else {
      return NextResponse.json({ message: result.message || 'Failed to post reply.' }, { status: 500 });
    }
  } catch (error) {
    console.error(`[API TICKET REPLY ERROR for ${params.ticketId}]`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while posting reply.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
