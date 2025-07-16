
import { NextResponse, type NextRequest } from 'next/server';
import { domainWhoisWHMCS } from '@/lib/whmcs-mock-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({ message: 'Domain query parameter is required.' }, { status: 400 });
    }

    // Basic validation for domain format
    // This is not exhaustive but catches common mistakes
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
        return NextResponse.json({ message: 'Invalid domain name format provided.' }, { status: 400 });
    }

    const data = await domainWhoisWHMCS(domain);

    if (data.result.status === 'error') {
        // If the WHMCS function caught an error, it will be in the result object
        return NextResponse.json({ message: data.result.errorMessage || 'Failed to check domain.' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('[API DOMAIN CHECK ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
