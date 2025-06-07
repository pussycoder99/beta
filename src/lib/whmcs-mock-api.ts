
import type { User, Service, Domain, Invoice, Ticket, TicketReply, InvoiceStatus, TicketStatus, ServiceStatus, DomainStatus, ProductGroup, Product, ProductPricing } from '@/types';
import { format } from 'date-fns';

const WHMCS_API_URL = process.env.NEXT_PUBLIC_WHMCS_API_URL;
const WHMCS_API_IDENTIFIER = process.env.WHMCS_API_IDENTIFIER;
const WHMCS_API_SECRET = process.env.WHMCS_API_SECRET;

export async function callWhmcsApi(action: string, params: Record<string, any> = {}): Promise<any> {
  if (!WHMCS_API_URL || !WHMCS_API_IDENTIFIER || !WHMCS_API_SECRET) {
    const errorMessage = "WHMCS API credentials or URL are not configured server-side. Ensure WHMCS_API_IDENTIFIER, WHMCS_API_SECRET, and NEXT_PUBLIC_WHMCS_API_URL are set.";
    console.error(`[WHMCS API SERVER ERROR] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  const formData = new URLSearchParams();
  formData.append('action', action);
  formData.append('identifier', WHMCS_API_IDENTIFIER);
  formData.append('secret', WHMCS_API_SECRET);
  formData.append('responsetype', 'json');

  for (const key in params) {
    formData.append(key, params[key]);
  }

  console.log(`[WHMCS API SERVER DEBUG] Calling action (via callWhmcsApi): ${action} with params:`, JSON.stringify(params));


  try {
    const response = await fetch(WHMCS_API_URL, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    });

    const rawResponseText = await response.text();
    // console.log(`[WHMCS API SERVER DEBUG] Raw Response Text for ${action}:`, rawResponseText);

    if (!response.ok) {
      const errorText = rawResponseText || `WHMCS API request failed with status ${response.status}`;
      console.error(`[WHMCS API SERVER ERROR] WHMCS API request failed for action ${action} with status ${response.status}: ${errorText}`);
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson && errorJson.message) {
          throw new Error(errorJson.message);
        }
      } catch (parseErr) {
        // Not a JSON error, throw the original text
      }
      throw new Error(errorText);
    }

    const data = JSON.parse(rawResponseText);
    // console.log(`[WHMCS API SERVER DEBUG] Parsed Response Data for ${action}:`, data);

    if (data.result === 'error' && action !== 'ValidateLogin') {
      console.error(`[WHMCS API SERVER ERROR] WHMCS API Error for action ${action}:`, data.message);
      throw new Error(data.message || `WHMCS API error for action ${action}.`);
    }
    return data;
  } catch (error: any) {
    console.error(`[WHMCS API SERVER CATCH ERROR] Error calling WHMCS action ${action}:`, error.message, error.stack);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(`An unknown error occurred while calling WHMCS action ${action}.`);
  }
}

export const validateLoginWHMCS = async (email: string, passwordAttempt: string): Promise<{ result: 'success' | 'error'; message?: string; userid?: string, passwordhash?: string, twoFactorEnabled?: boolean }> => {
  const directFormData = new URLSearchParams();
  directFormData.append('action', 'ValidateLogin');
  directFormData.append('username', WHMCS_API_IDENTIFIER!);
  directFormData.append('password', WHMCS_API_SECRET!);
  directFormData.append('email', email);
  directFormData.append('password2', passwordAttempt);
  directFormData.append('responsetype', 'json');


  console.log(`[WHMCS API SERVER DEBUG] Attempting ValidateLogin action (direct)`);
  console.log(`[WHMCS API SERVER DEBUG] Target URL: ${WHMCS_API_URL}`);
  console.log(`[WHMCS API SERVER DEBUG] ValidateLogin FormData to be sent:`);
  for (const [key, value] of directFormData.entries()) {
    if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase() === 'password2') {
      console.log(`  ${key}: ********`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  }

  try {
    const response = await fetch(WHMCS_API_URL!, {
        method: 'POST',
        body: directFormData,
        cache: 'no-store',
    });

    const rawResponseText = await response.text();
    console.log(`[WHMCS API SERVER DEBUG] Raw Response Text for ValidateLogin (direct):`, rawResponseText);

    if (!response.ok) {
        const errorText = rawResponseText || `WHMCS ValidateLogin request failed with status ${response.status}`;
        console.error(`[WHMCS API SERVER ERROR] ValidateLogin request failed: ${errorText}`);
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson && errorJson.message) {
              return { result: 'error', message: errorJson.message };
            }
          } catch (parseErr) {
            // Not a JSON error
          }
        return { result: 'error', message: errorText };
    }
    const data = JSON.parse(rawResponseText);
    console.log(`[WHMCS API SERVER DEBUG] Parsed Response Data for ValidateLogin (direct):`, data);

    if (data.result === 'success' && data.userid) {
      return {
        result: 'success',
        userid: data.userid.toString(),
        passwordhash: data.passwordhash,
        twoFactorEnabled: data.twoFactorEnabled === "true" || data.twoFactorEnabled === true
      };
    }
    return { result: 'error', message: data.message || 'Authentication failed: Unknown reason from WHMCS.' };
  } catch (error: any) {
    console.error("[WHMCS API SERVER CATCH ERROR] ValidateLogin API error:", error.message);
    return { result: 'error', message: (error instanceof Error ? error.message : String(error)) };
  }
};

export const addClientWHMCS = async (clientData: Omit<User, 'id'> & {password?: string}): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
  try {
    const params = {
      firstname: clientData.firstName,
      lastname: clientData.lastName,
      email: clientData.email,
      password2: clientData.password,
      companyname: clientData.companyName || '',
      address1: clientData.address1 || '',
      city: clientData.city || '',
      state: clientData.state || '',
      postcode: clientData.postcode || '',
      country: clientData.country || '',
      phonenumber: clientData.phoneNumber || '',
    };
    const data = await callWhmcsApi('AddClient', params);
    if (data.result === 'success' && data.clientid) {
      return { result: 'success', userId: data.clientid.toString() };
    }
    return { result: 'error', message: data.message || 'Failed to add client via WHMCS.' };
  } catch (error: any) {
    return { result: 'error', message: (error instanceof Error ? error.message : String(error)) };
  }
};

export const getUserDetailsWHMCS = async (userId: string): Promise<{ user?: User, whmcsData?: any }> => {
  try {
    const data = await callWhmcsApi('GetClientsDetails', { clientid: userId, stats: false });
    if (data.result === 'success' && data.client) {
      const client = data.client;
      const user: User = {
        id: client.id?.toString() || client.userid?.toString() || client.clientid?.toString() || userId,
        email: client.email,
        firstName: client.firstname,
        lastName: client.lastname,
        companyName: client.companyname,
        address1: client.address1,
        city: client.city,
        state: client.state,
        postcode: client.postcode,
        country: client.countrycode || client.country,
        phoneNumber: client.phonenumber || client.telephone,
      };
      return { user, whmcsData: client };
    }
    console.warn(`[WHMCS API SERVER WARN] GetClientsDetails for ${userId} did not return success or client data missing. Data:`, data);
    return { user: undefined, whmcsData: data };
  } catch (error) {
    console.error(`[WHMCS API SERVER CATCH ERROR] Failed to fetch user details for ${userId}:`, error);
    return { user: undefined };
  }
};


export const getClientsProductsWHMCS = async (userId: string, serviceId?: string): Promise<{ services: Service[], whmcsData?: any }> => {
  try {
    const params: Record<string, any> = { clientid: userId, stats: true };
    if (serviceId) {
      params.serviceid = serviceId;
    }
    const data = await callWhmcsApi('GetClientsProducts', params);
    let services: Service[] = [];

    if (data.result === 'success' && data.products?.product) {
      const productsArray = Array.isArray(data.products.product) ? data.products.product : [data.products.product];
      const currency = data.currency || { code: productsArray[0]?.currencycode || 'USD', suffix: productsArray[0]?.currencysuffix || 'USD', prefix: productsArray[0]?.currencyprefix || '$' };

      services = productsArray.map((p: any) => ({
          id: p.id.toString(),
          name: p.name || p.productinfo?.name || p.productname,
          status: p.status as ServiceStatus,
          registrationDate: p.regdate,
          nextDueDate: p.nextduedate,
          billingCycle: p.billingcycle,
          amount: `${p.currencyprefix || currency.prefix}${p.recurringamount} ${p.currencycode || currency.code}`,
          domain: p.domain,
          diskusage: p.diskusage,
          disklimit: p.disklimit,
          bwusage: p.bwusage,
          bwlimit: p.bwlimit,
          lastupdate: p.lastupdate,
          serverInfo: {
            hostname: p.serverhostname,
            ipAddress: p.serverip,
          },
          username: p.username
      }));
    } else if (data.result !== 'success') {
        console.warn(`[WHMCS API SERVER WARN] GetClientsProducts for user ${userId} ${serviceId ? `service ${serviceId}` : ''} API call failed. Data:`, data);
    } else {
        console.log(`[WHMCS API SERVER INFO] No products found for user ${userId} ${serviceId ? `service ${serviceId}` : ''}. Data:`, data);
    }
    return { services, whmcsData: data };
  } catch (error) {
    console.error("[WHMCS API SERVER CATCH ERROR] Failed to fetch client products:", error);
    return { services: [] };
  }
};

export const getDomainsWHMCS = async (userId: string): Promise<{ domains: Domain[], whmcsData?: any }> => {
  try {
    const data = await callWhmcsApi('GetClientsDomains', { clientid: userId });
    let domains: Domain[] = [];
    if (data.result === 'success' && data.domains?.domain) {
      const domainsArray = Array.isArray(data.domains.domain) ? data.domains.domain : [data.domains.domain];
      domains = domainsArray.map((d: any) => ({
          id: d.id.toString(),
          domainName: d.domain,
          status: d.status as DomainStatus,
          registrationDate: d.regdate || d.registrationdate,
          expiryDate: d.nextduedate || d.expirydate,
          registrar: d.registrar,
          nameservers: [d.ns1, d.ns2, d.ns3, d.ns4, d.ns5].filter(Boolean)
      }));
    } else if (data.result !== 'success') {
        console.warn(`[WHMCS API SERVER WARN] GetClientsDomains for user ${userId} API call failed. Data:`, data);
    } else {
        console.log(`[WHMCS API SERVER INFO] No domains found for user ${userId}. Data:`, data);
    }
    return { domains, whmcsData: data };
  } catch (error) {
    console.error("[WHMCS API SERVER CATCH ERROR] Failed to fetch client domains:", error);
    return { domains: [] };
  }
};

export const getInvoicesWHMCS = async (userId: string, statusFilter?: InvoiceStatus, limit: number = 50): Promise<{ invoices: Invoice[], whmcsData?: any }> => {
  try {
    const params: Record<string, any> = { userid: userId, limitnum: limit, orderby: 'duedate', order: 'DESC' };
    if (statusFilter && statusFilter !== "Overdue") {
        params.status = statusFilter;
    } else if (statusFilter === "Overdue") {
        params.status = "Unpaid";
    }

    const invData = await callWhmcsApi('GetInvoices', params);

    let invoices: Invoice[] = [];

    if (invData.result === 'success' && invData.invoices?.invoice) {
      const defaultCurrency = { code: 'USD', suffix: 'USD', prefix: '$' };
      const currency = invData.currency || defaultCurrency;
      const invoicesArray = Array.isArray(invData.invoices.invoice) ? invData.invoices.invoice : [invData.invoices.invoice];
      invoices = invoicesArray.map((inv: any) => ({
          id: inv.id.toString(),
          invoiceNumber: inv.invoicenum || inv.id.toString(),
          dateCreated: inv.date,
          dueDate: inv.duedate,
          total: `${inv.currencyprefix || currency.prefix}${inv.total} ${inv.currencycode || currency.code}`,
          status: inv.status as InvoiceStatus,
          items: inv.items?.item ?
                 (Array.isArray(inv.items.item) ? inv.items.item : [inv.items.item]).map((it: any) => ({
                    description: it.description,
                    amount: `${inv.currencyprefix || currency.prefix}${it.amount} ${inv.currencycode || currency.code}`
                 })) : []
      }));
    } else if (invData.result !== 'success') {
        console.warn(`[WHMCS API SERVER WARN] GetInvoices for user ${userId}, status ${statusFilter || 'any'} API call failed. Data:`, invData);
    } else {
        console.log(`[WHMCS API SERVER INFO] No invoices found for user ${userId}, status ${statusFilter || 'any'}. Data:`, invData);
    }
    return { invoices, whmcsData: invData };
  } catch (error) {
    console.error("[WHMCS API SERVER CATCH ERROR] Failed to fetch invoices:", error);
    return { invoices: [] };
  }
};

export const getTicketsWHMCS = async (userId: string, statusFilter: string = 'All Active'): Promise<{ tickets: Ticket[], whmcsData?: any }> => {
  try {
    const params: Record<string, any> = { clientid: userId, limitnum: 50 };
    if (statusFilter && statusFilter !== 'All Active' && statusFilter !== 'All') {
        params.status = statusFilter;
    }
    const data = await callWhmcsApi('GetTickets', params);
    let tickets: Ticket[] = [];
    if (data.result === 'success' && data.tickets?.ticket) {
        const ticketsArray = Array.isArray(data.tickets.ticket) ? data.tickets.ticket : [data.tickets.ticket];
        tickets = ticketsArray.map((t: any) => ({
            id: t.id.toString(),
            ticketNumber: t.tid,
            subject: t.subject,
            department: t.deptname || t.departmentname,
            status: t.status as TicketStatus,
            lastUpdated: t.lastreply.includes('0000-00-00') ? t.date : t.lastreply,
            dateOpened: t.date,
            priority: t.priority as 'Low' | 'Medium' | 'High',
        }));
        if (statusFilter === 'All Active') {
          const activeStatuses: TicketStatus[] = ['Open', 'Answered', 'Customer-Reply', 'In Progress', 'On Hold'];
          tickets = tickets.filter(ticket => activeStatuses.includes(ticket.status));
        }

    } else if (data.result !== 'success') {
        console.warn(`[WHMCS API SERVER WARN] GetTickets for user ${userId}, status ${statusFilter} API call failed. Data:`, data);
    } else {
        console.log(`[WHMCS API SERVER INFO] No tickets found for user ${userId}, status ${statusFilter}. Data:`, data);
    }
    return { tickets, whmcsData: data };
  } catch (error) {
    console.error("[WHMCS API SERVER CATCH ERROR] Failed to fetch tickets:", error);
    return { tickets: [] };
  }
};

export const getTicketByIdWHMCS = async (ticketId: string): Promise<{ ticket?: Ticket, whmcsData?: any }> => {
  try {
    const data = await callWhmcsApi('GetTicket', { ticketid: ticketId });

    if (data.result === 'success') {
      const repliesData = data.replies?.reply ?
        (Array.isArray(data.replies.reply) ? data.replies.reply : [data.replies.reply]) : [];

      const replies: TicketReply[] = repliesData.map((r: any) => ({
          id: r.replyid?.toString() || r.id?.toString() || `reply-${Math.random().toString(36).substr(2, 9)}`,
          author: (r.userid && r.userid.toString() === '0') || r.admin || r.name === 'System' || (r.requestor_type === 'staff' || r.requestor_type === 'api') ? 'Support Staff' : 'Client',
          message: r.message,
          date: r.date,
          attachments: r.attachments_removed ? [] : (r.attachments?.attachment || []).map((att:any) => att.filename)
        }));

      const ticket: Ticket = {
        id: data.ticketid.toString(),
        ticketNumber: data.tid,
        subject: data.subject,
        department: data.deptname || data.departmentname,
        status: data.status as TicketStatus,
        lastUpdated: data.lastreply.includes('0000-00-00') ? data.date : data.lastreply,
        dateOpened: data.date,
        priority: data.priority as 'Low' | 'Medium' | 'High',
        replies: replies,
      };
      return { ticket, whmcsData: data };
    }
    console.warn(`[WHMCS API SERVER WARN] GetTicketById for ${ticketId} did not return success. Data:`, data);
    return { ticket: undefined, whmcsData: data };
  } catch (error) {
    console.error(`[WHMCS API SERVER CATCH ERROR] Failed to fetch ticket ${ticketId}:`, error);
    return { ticket: undefined };
  }
};

const departmentNameToIdMap: Record<string, string> = {
  "Technical Support": "1",
  "Billing": "2",
  "Sales": "3",
  "General Inquiry": "4",
};

export const openTicketWHMCS = async (ticketData: { clientid: string, deptname: string; subject: string; message: string; priority: 'Low' | 'Medium' | 'High'; serviceid?: string }): Promise<{ result: 'success' | 'error'; message?: string; ticketId?: string; ticketNumber?: string }> => {
  try {
    const deptid = departmentNameToIdMap[ticketData.deptname];
    if (!deptid) {
      return { result: 'error', message: `Invalid department name: ${ticketData.deptname}. Could not map to department ID.` };
    }

    const params = {
      clientid: ticketData.clientid,
      deptid: deptid,
      subject: ticketData.subject,
      message: ticketData.message,
      priority: ticketData.priority,
      ...(ticketData.serviceid && { serviceid: ticketData.serviceid }),
    };

    const data = await callWhmcsApi('OpenTicket', params);
    if (data.result === 'success' && data.id && data.tid) {
      return { result: 'success', ticketId: data.id.toString(), ticketNumber: data.tid };
    }
    return { result: 'error', message: data.message || 'Failed to open ticket via WHMCS.' };
  } catch (error: any) {
    return { result: 'error', message: (error instanceof Error ? error.message : String(error)) };
  }
};

export const replyToTicketWHMCS = async (replyData: { ticketid: string, message: string, clientid?: string, adminusername?: string }): Promise<{ result: 'success' | 'error'; message?: string; reply?: TicketReply }> => {
  try {
    const params: Record<string, any> = {
      ticketid: replyData.ticketid,
      message: replyData.message,
    };
    if (replyData.clientid) {
        params.clientid = replyData.clientid;
    } else if (replyData.adminusername) {
        params.adminusername = replyData.adminusername;
    }

    const data = await callWhmcsApi('AddTicketReply', params);
    if (data.result === 'success') {
      const newReply: TicketReply = {
        id: `temp-reply-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        author: replyData.clientid ? 'Client' : 'Support Staff',
        message: replyData.message,
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      };
      return { result: 'success', reply: newReply };
    }
    return { result: 'error', message: data.message || 'Failed to reply to ticket via WHMCS.' };
  } catch (error: any) {
    return { result: 'error', message: (error instanceof Error ? error.message : String(error)) };
  }
};

export const createSsoTokenWHMCS = async (
  params: { clientid?: string; service_id?: number; module?: string; destination?: string }
): Promise<{ result: 'success' | 'error'; message?: string; redirect_url?: string }> => {
  try {
    if (!params.clientid && !params.service_id) {
      return { result: 'error', message: 'Client ID or Service ID is required for SSO token creation.' };
    }

    const whmcsParams: Record<string, any> = {};
    if (params.clientid) whmcsParams.client_id = params.clientid;
    if (params.service_id) whmcsParams.service_id = params.service_id;
    if (params.module) whmcsParams.sso_module = params.module;
    if (params.destination) whmcsParams.sso_destination = params.destination;


    const data = await callWhmcsApi('CreateSsoToken', whmcsParams);
    if (data.result === 'success' && data.redirect_url) {
      return { result: 'success', redirect_url: data.redirect_url };
    }
    return { result: 'error', message: data.message || 'Failed to create SSO token.' };
  } catch (error: any) {
    return { result: 'error', message: (error instanceof Error ? error.message : String(error)) };
  }
};

export const addFundsWHMCS = async (
  userId: string,
  amount: number,
  paymentMethodGateway: string
): Promise<{ result: 'success' | 'error'; message?: string; invoiceId?: string; paymentUrl?: string }> => {
  try {
    const invoiceParams = {
      clientid: userId,
      status: 'Unpaid',
      sendinvoice: true,
      paymentmethod: paymentMethodGateway,
      itemdescription1: `Add Funds - ${new Date().toISOString().split('T')[0]}`,
      itemamount1: amount.toFixed(2),
      itemtaxed1: 0,
    };

    const invoiceData = await callWhmcsApi('AddInvoice', invoiceParams);

    if (invoiceData.result === 'success' && invoiceData.invoiceid) {
      const paymentUrl = `${process.env.NEXT_PUBLIC_WHMCS_APP_URL || WHMCS_API_URL?.replace('/includes/api.php', '')}/viewinvoice.php?id=${invoiceData.invoiceid}`;
      return {
        result: 'success',
        invoiceId: invoiceData.invoiceid.toString(),
        paymentUrl: paymentUrl
      };
    } else {
      return { result: 'error', message: invoiceData.message || 'Failed to create invoice for adding funds.' };
    }
  } catch (error: any) {
    return { result: 'error', message: (error instanceof Error ? error.message : String(error)) };
  }
};

// This function is for the original approach (using GetProductGroups WHMCS API)
// It will be called by the /api/data/product-groups route IF that API is available in WHMCS
export const getProductGroupsWHMCS = async (): Promise<{ groups: ProductGroup[], whmcsData?: any }> => {
  try {
    const data = await callWhmcsApi('GetProductGroups', {});
    let groups: ProductGroup[] = [];
    if (data.result === 'success') {
      if (data.groups && data.groups.group) {
        const groupsArray = Array.isArray(data.groups.group) ? data.groups.group : [data.groups.group];
        groups = groupsArray.map((g: any) => ({
          id: g.id.toString(),
          name: g.name,
          headline: g.headline,
          tagline: g.tagline,
          order: parseInt(g.order, 10) || 0,
        })).sort((a, b) => (a.order || 0) - (b.order || 0));
        console.log(`[WHMCS API SERVER INFO - getProductGroupsWHMCS] GetProductGroups successful. Found ${groups.length} groups. Parsed groups:`, JSON.stringify(groups.map(g => ({id: g.id, name: g.name}))));
        console.log(`[WHMCS API SERVER INFO - getProductGroupsWHMCS] Raw data.groups from WHMCS:`, JSON.stringify(data.groups));
      } else if (data.groups) {
        console.log(`[WHMCS API SERVER INFO - getProductGroupsWHMCS] GetProductGroups successful, but data.groups.group is missing or empty. Raw data.groups:`, JSON.stringify(data.groups), `Full data:`, JSON.stringify(data));
      } else {
        console.log(`[WHMCS API SERVER INFO - getProductGroupsWHMCS] GetProductGroups successful, but data.groups is missing. Full data:`, JSON.stringify(data));
      }
    } else {
      console.warn(`[WHMCS API SERVER WARN - getProductGroupsWHMCS] GetProductGroups API call failed. Full data:`, JSON.stringify(data));
      // If GetProductGroups fails, we still return empty groups, and the new API route will try the alternative.
    }
    return { groups, whmcsData: data };
  } catch (error) {
    console.error("[WHMCS API SERVER CATCH ERROR - getProductGroupsWHMCS] Failed to fetch product groups:", error);
    // If GetProductGroups fails, we still return empty groups, and the new API route will try the alternative.
    return { groups: [] };
  }
};

const getDisplayPrice = (pricing: ProductPricing, currencyCodeFromProduct: string | undefined): string => {
  const targetCurrencyCode = currencyCodeFromProduct || 'USD'; // Default to USD if not available
  const currencyPricing = pricing[targetCurrencyCode];

  if (!currencyPricing) {
    const availableCurrencyCodes = Object.keys(pricing);
    if (availableCurrencyCodes.length > 0) {
      const firstAvailableCurrencyPricing = pricing[availableCurrencyCodes[0]];
      if (firstAvailableCurrencyPricing) {
        const cycles = ['monthly', 'quarterly', 'semiannually', 'annually', 'biennially', 'triennially', 'onetime'];
        for (const cycle of cycles) {
            const priceKey = cycle as keyof typeof firstAvailableCurrencyPricing;
            if (Object.prototype.hasOwnProperty.call(firstAvailableCurrencyPricing, priceKey) && typeof firstAvailableCurrencyPricing[priceKey] === 'string') {
                const priceValue = parseFloat(firstAvailableCurrencyPricing[priceKey] as string);
                 if (priceValue >= 0) { // Price is valid (not -1.00 which means not available)
                    let cycleName = cycle.charAt(0).toUpperCase() + cycle.slice(1);
                    if (cycle === 'monthly') cycleName = "/mo";
                    else if (cycle === 'annually') cycleName = "/yr";
                    else if (cycle === 'quarterly') cycleName = "/qtr";
                    else if (cycle === 'semiannually') cycleName = "/s-yr";
                    else if (cycle === 'biennially') cycleName = "/2yrs";
                    else if (cycle === 'triennially') cycleName = "/3yrs";
                    else if (cycle === 'onetime') cycleName = "One Time";
                    return `${firstAvailableCurrencyPricing.prefix}${priceValue.toFixed(2)} ${firstAvailableCurrencyPricing.suffix || availableCurrencyCodes[0]} ${cycle === 'onetime' ? '' : cycleName}`.trim();
                 }
            }
        }
      }
    }
    return "Contact Us"; // Fallback if no pricing found
  }

  // Standard cycles check
  const cycles = ['monthly', 'quarterly', 'semiannually', 'annually', 'biennially', 'triennially', 'onetime'];
  for (const cycle of cycles) {
    const priceKey = cycle as keyof typeof currencyPricing;
    // Check if the cycle exists and is a valid price (not -1.00 which means not available for that cycle)
    if (Object.prototype.hasOwnProperty.call(currencyPricing, priceKey) && typeof currencyPricing[priceKey] === 'string') {
        const priceValue = parseFloat(currencyPricing[priceKey] as string);
        if (priceValue >= 0) { // Price is valid
            let cycleName = cycle.charAt(0).toUpperCase() + cycle.slice(1);
            if (cycle === 'monthly') cycleName = "/mo";
            else if (cycle === 'annually') cycleName = "/yr";
            else if (cycle === 'quarterly') cycleName = "/qtr";
            else if (cycle === 'semiannually') cycleName = "/s-yr";
            else if (cycle === 'biennially') cycleName = "/2yrs";
            else if (cycle === 'triennially') cycleName = "/3yrs";
            else if (cycle === 'onetime') cycleName = "One Time";
            return `${currencyPricing.prefix}${priceValue.toFixed(2)} ${currencyPricing.suffix || targetCurrencyCode} ${cycle === 'onetime' ? '' : cycleName}`.trim();
        }
    }
  }
  return "Contact Us"; // Fallback if no valid pricing found for any cycle
};

// Fetches products, optionally filtered by GID.
// When GID is not provided, it fetches ALL products.
// It's expected that WHMCS GetProducts API includes 'groupname' for each product when fetching all.
export const getProductsWHMCS = async (gid?: string): Promise<{ products: Product[], whmcsData?: any }> => {
  try {
    const params: Record<string, any> = { };
    if (gid) {
      params.gid = gid;
    } else {
      // Fetching all products, so no gid.
      // WHMCS documentation suggests that when fetching all products, 'groupname' is included.
      // We rely on this for the "derive groups" strategy.
      console.log("[WHMCS API SERVER INFO - getProductsWHMCS] Fetching ALL products (no GID specified). Expecting 'groupname' in response for each product.");
    }
    const data = await callWhmcsApi('GetProducts', params);
    let products: Product[] = [];

    if (data.result === 'success' && data.products?.product) {
      const productsArray = Array.isArray(data.products.product) ? data.products.product : [data.products.product];
      products = productsArray.map((p: any) => {
        const pricing = p.pricing as ProductPricing;
        // The currency code might be part of the product itself or needs to be inferred
        const currencyCodeFromProduct = p.pricing ? Object.keys(p.pricing)[0] : undefined;

        if (!gid && !p.groupname) {
            console.warn(`[WHMCS API SERVER WARN - getProductsWHMCS] Product PID ${p.pid} is missing 'groupname' when fetching all products. Group derivation might be incomplete.`);
        }

        return {
          pid: p.pid.toString(),
          gid: p.gid.toString(),
          groupname: p.groupname, // Crucial for deriving groups if GetProductGroups is unavailable
          type: p.type,
          name: p.name,
          slug: p.slug,
          "product-url": p['product-url'],
          description: p.description, // HTML content
          module: p.module,
          paytype: p.paytype as 'free' | 'onetime' | 'recurring',
          pricing: pricing,
          displayPrice: getDisplayPrice(pricing, currencyCodeFromProduct),
          allowqty: p.allowqty,
          quantity_available: p.quantity_available
        };
      });
      if (!gid) {
        console.log(`[WHMCS API SERVER INFO - getProductsWHMCS] Successfully fetched ${products.length} products (all). First few products raw:`, JSON.stringify(productsArray.slice(0,2)));
      }
    } else if (data.result !== 'success') {
      console.warn(`[WHMCS API SERVER WARN - getProductsWHMCS] GetProducts API call ${gid ? `for GID ${gid}` : '(all products)'} failed. Data:`, data);
    } else {
      console.log(`[WHMCS API SERVER INFO - getProductsWHMCS] No products found ${gid ? `for GID ${gid}` : '(all products)'}. Data:`, data);
    }
    return { products, whmcsData: data };
  } catch (error) {
    console.error("[WHMCS API SERVER CATCH ERROR - getProductsWHMCS] Failed to fetch products:", error);
    return { products: [] };
  }
};


// --- Functions below are legacy and mainly for pages that might still directly import them ---
// --- These should be refactored to use the Next.js API routes for secure credential handling ---

export const getInvoicesAPI = async (userId: string, token?: string) => {
  if (!token) throw new Error("Auth token required for getInvoicesAPI");
  const response = await fetch('/api/data/invoices', { headers: { 'Authorization': `Bearer ${token}` }});
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch invoices');
  }
  return response.json();
};

export const getTicketsAPI = async (userId: string, token?: string) => {
  if (!token) throw new Error("Auth token required for getTicketsAPI");
  const response = await fetch('/api/data/tickets', { headers: { 'Authorization': `Bearer ${token}` }});
   if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch tickets');
  }
  return response.json();
};

export const getTicketByIdAPI = async (ticketId: string, token?: string) => {
  if (!token) throw new Error("Auth token required for getTicketByIdAPI");
   const response = await fetch(`/api/data/ticket-details/${ticketId}`, { headers: { 'Authorization': `Bearer ${token}` }});
   if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch ticket details');
  }
  return response.json();
};


export const replyToTicketAPI = async (userId: string, ticketId: string, message: string, token?: string) => {
  if (!token) throw new Error("Auth token required for replyToTicketAPI");
   const response = await fetch(`/api/data/ticket-replies/${ticketId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ message, userId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to reply to ticket');
  }
  return response.json();
};

export const openTicketAPI = async (userId: string, ticketDetails: {subject: string, department: string, message: string, priority: 'Low' | 'Medium' | 'High'}, token?: string) => {
  if (!token) throw new Error("Auth token required for openTicketAPI");
  const response = await fetch('/api/data/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ ...ticketDetails, userId }),
  });
   if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to open ticket');
  }
  return response.json();
};
