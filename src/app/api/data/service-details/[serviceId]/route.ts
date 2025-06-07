
import { NextResponse } from 'next/server';
import { getClientsProductsWHMCS, createSsoTokenWHMCS } from '@/lib/whmcs-mock-api';
import { getUserIdFromToken } from '@/lib/auth-utils';
import type { Service } from '@/types';


// Helper to convert usage string to number, e.g., "1024 MB" to 1024
const parseUsageValue = (usageStr: string | number | undefined): number => {
  if (typeof usageStr === 'number') return usageStr;
  if (typeof usageStr === 'string') {
    const parsed = parseFloat(usageStr.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper to format usage string, e.g., 100 MB / 1000 MB or 50 / Unlimited
const formatUsageString = (used: string | number | undefined, limit: string | number | undefined, unit: string = 'MB'): string => {
  const usedVal = parseUsageValue(used);
  const limitVal = parseUsageValue(limit);

  const usedFormatted = `${usedVal.toFixed(0)} ${unit}`;
  let limitFormatted = `${limitVal.toFixed(0)} ${unit}`;

  if (limitVal === 0 || limitVal >= 9999999) { // Common representations for "unlimited"
    limitFormatted = 'Unlimited';
  }
  
  if (usedVal === 0 && (limitVal === 0 || limitFormatted === 'Unlimited')) return 'N/A'; // Or "0 / Unlimited"

  return `${usedFormatted} / ${limitFormatted}`;
};


export async function GET(request: Request, { params }: { params: { serviceId: string } }) {
  try {
    const userId = getUserIdFromToken(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
    }

    const { serviceId } = params;
    if (!serviceId) {
      return NextResponse.json({ message: 'Service ID is required.' }, { status: 400 });
    }

    // Fetch detailed product information
    const productData = await getClientsProductsWHMCS(userId, serviceId);
    
    if (!productData.services || productData.services.length === 0) {
      return NextResponse.json({ message: 'Service not found or access denied.' }, { status: 404 });
    }
    
    const service = productData.services[0] as Service & { // Cast to include potential WHMCS fields
        diskusage?: string;
        disklimit?: string;
        bwusage?: string;
        bwlimit?: string;
        lastupdate?: string; 
        // Control panel specific username, might be needed for some SSO, not directly used here
        username?: string; 
    };

    let controlPanelLink: string | undefined = undefined;
    try {
        // Attempt to create an SSO token for the control panel
        // Assuming the first product's ID is the service ID we need for SSO.
        // The module type (e.g., 'cpanel', 'plesk') might need to be determined or configured.
        // For now, let's assume cPanel if not specified or try a generic login.
        const ssoResponse = await createSsoTokenWHMCS({ clientid: userId, service_id: parseInt(service.id) });
        if (ssoResponse.result === 'success' && ssoResponse.redirect_url) {
            controlPanelLink = ssoResponse.redirect_url;
        } else {
            console.warn(`[API Service Details] SSO token creation failed for service ${service.id}: ${ssoResponse.message}`);
        }
    } catch (ssoError) {
        console.error(`[API Service Details] Error creating SSO token for service ${service.id}:`, ssoError);
    }
    
    const diskUsed = parseUsageValue(service.diskusage);
    const diskLimit = parseUsageValue(service.disklimit);
    const bwUsed = parseUsageValue(service.bwusage);
    const bwLimit = parseUsageValue(service.bwlimit);

    const enhancedService = {
      ...service,
      controlPanelLink,
      diskUsagePercent: diskLimit > 0 ? (diskUsed / diskLimit) * 100 : (diskUsed > 0 ? 100 : 0), // Handle unlimited correctly
      diskUsageRaw: formatUsageString(service.diskusage, service.disklimit, 'MB'),
      bandwidthUsagePercent: bwLimit > 0 ? (bwUsed / bwLimit) * 100 : (bwUsed > 0 ? 100 : 0), // Handle unlimited correctly
      bandwidthUsageRaw: formatUsageString(service.bwusage, service.bwlimit, 'GB'), // Assuming BW is often in GB
      lastupdate: service.lastupdate, // Ensure this is passed through
    };


    return NextResponse.json({ service: enhancedService });

  } catch (error) {
    console.error('[API DATA SERVICE DETAILS ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching service details.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
