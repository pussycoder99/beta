
import type { User, Service, Domain, Invoice, Ticket, TicketReply } from '@/types';
import { format } from 'date-fns';

const WHMCS_API_URL = process.env.NEXT_PUBLIC_WHMCS_API_URL;
const WHMCS_API_IDENTIFIER = process.env.WHMCS_API_IDENTIFIER;
const WHMCS_API_SECRET = process.env.WHMCS_API_SECRET;

// Helper function to make API requests to WHMCS
async function callWhmcsApi(action: string, params: Record<string, any> = {}): Promise<any> {
  if (!WHMCS_API_URL || !WHMCS_API_IDENTIFIER || !WHMCS_API_SECRET) {
    const errorMessage = "WHMCS API credentials or URL are not configured. Please set NEXT_PUBLIC_WHMCS_API_URL, WHMCS_API_IDENTIFIER, and WHMCS_API_SECRET in your .env.local file.";
    console.error(`[WHMCS API ERROR] ${errorMessage}`);
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

  console.log(`[WHMCS API DEBUG] Calling action: ${action}`);
  console.log(`[WHMCS API DEBUG] Request URL: ${WHMCS_API_URL}`);
  // Avoid logging the full secret in production logs if possible, but helpful for local debugging.
  // Consider removing or partially masking WHMCS_API_SECRET from this specific log in production.
  console.log(`[WHMCS API DEBUG] Request FormData: ${formData.toString().replace(WHMCS_API_SECRET, '********')}`);


  try {
    const response = await fetch(WHMCS_API_URL, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    });

    console.log(`[WHMCS API DEBUG] Response Status for ${action}: ${response.status}`);
    const rawResponseText = await response.text();
    console.log(`[WHMCS API DEBUG] Raw Response Text for ${action}:`, rawResponseText);

    if (!response.ok) {
      const errorText = rawResponseText || `WHMCS API request failed with status ${response.status}`;
      console.error(`[WHMCS API ERROR] WHMCS API request failed for action ${action} with status ${response.status}: ${errorText}`);
      throw new Error(errorText);
    }

    const data = JSON.parse(rawResponseText); // Parse text after logging it
    console.log(`[WHMCS API DEBUG] Parsed Response Data for ${action}:`, data);
    
    if (data.result === 'error') {
      console.error(`[WHMCS API ERROR] WHMCS API Error for action ${action}:`, data.message);
      throw new Error(data.message || `WHMCS API error for action ${action}.`);
    }
    return data;
  } catch (error: any) {
    console.error(`[WHMCS API CATCH ERROR] Error calling WHMCS action ${action}:`, error.message, error.stack);
    // Re-throw the error so it can be caught by the calling function
    // This ensures UI can display appropriate messages
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(`An unknown error occurred while calling WHMCS action ${action}.`);
  }
}

export const validateLoginAPI = async (email: string, passwordAttempt: string): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
  try {
    // For ValidateLogin, WHMCS expects client credentials directly.
    // It might not use the admin API identifier/secret in the same way for this specific action.
    // The `callWhmcsApi` function already adds identifier and secret.
    // If ValidateLogin needs *only* email and password2 without admin API creds, this call needs adjustment.
    // However, most WHMCS API actions, even ValidateLogin, can be called using admin API creds for authentication of the API call itself.
    const params = { email: email, password2: passwordAttempt };
    
    // Special handling for ValidateLogin if it MUST NOT use API identifier/secret for the call itself,
    // but rather a different authentication mechanism (unlikely for standard API usage but possible).
    // For now, assuming standard API call with admin credentials to authenticate the API request itself.
    const directFormData = new URLSearchParams();
    directFormData.append('action', 'ValidateLogin');
    directFormData.append('email', email);
    directFormData.append('password2', passwordAttempt);
    directFormData.append('responsetype', 'json');
    // Add API credentials if your WHMCS requires them even for ValidateLogin for the API call itself
    // This is usually handled by callWhmcsApi, but if ValidateLogin is a special case:
    // if (WHMCS_API_IDENTIFIER && WHMCS_API_SECRET) {
    //     directFormData.append('identifier', WHMCS_API_IDENTIFIER);
    //     directFormData.append('secret', WHMCS_API_SECRET);
    // }

    console.log(`[WHMCS API DEBUG] Calling action: ValidateLogin (direct)`);
    console.log(`[WHMCS API DEBUG] Request URL: ${WHMCS_API_URL}`);
    console.log(`[WHMCS API DEBUG] Request FormData for ValidateLogin: ${directFormData.toString()}`);


    const response = await fetch(WHMCS_API_URL!, {
        method: 'POST',
        body: directFormData,
        cache: 'no-store',
    });

    console.log(`[WHMCS API DEBUG] Response Status for ValidateLogin (direct): ${response.status}`);
    const rawResponseText = await response.text();
    console.log(`[WHMCS API DEBUG] Raw Response Text for ValidateLogin (direct):`, rawResponseText);

    if (!response.ok) {
        const errorText = rawResponseText || `WHMCS ValidateLogin request failed with status ${response.status}`;
        console.error(`[WHMCS API ERROR] ValidateLogin request failed: ${errorText}`);
        throw new Error(errorText);
    }
    const data = JSON.parse(rawResponseText);
    console.log(`[WHMCS API DEBUG] Parsed Response Data for ValidateLogin (direct):`, data);

    if (data.result === 'success' && data.userid) {
      return { result: 'success', userId: data.userid.toString() };
    }
    return { result: 'error', message: data.message || 'Invalid email or password via WHMCS.' };
  } catch (error: any) {
    console.error("[WHMCS API CATCH ERROR] ValidateLogin API error:", error.message);
    return { result: 'error', message: (error instanceof Error ? error.message : String(error)) };
  }
};

export const addClientAPI = async (clientData: Omit<User, 'id'> & {password?: string}): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
  try {
    const params = {
      firstname: clientData.firstName,
      lastname: clientData.lastName,
      email: clientData.email,
      password2: clientData.password, // WHMCS AddClient hashes this
      companyname: clientData.companyName || '',
      address1: clientData.address1 || '',
      city: clientData.city || '',
      state: clientData.state || '',
      postcode: clientData.postcode || '',
      country: clientData.country || '', // WHMCS expects 2-letter country code
      phonenumber: clientData.phoneNumber || '',
      // skipvalidation: true, // Optionally skip WHMCS validation if needed for some fields
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

export const getUserDetailsAPI = async (userId: string): Promise<{ user?: User }> => {
  try {
    const data = await callWhmcsApi('GetClientsDetails', { clientid: userId, stats: false });
    // WHMCS response for GetClientsDetails often nests user data under `client` or has it at top level depending on version/call method.
    // The API through identifier/secret usually returns data directly, not under a `client` sub-object for GetClientsDetails.
    // Let's try to access fields robustly.
    if (data.result === 'success') {
      const user: User = {
        id: data.id?.toString() || data.userid?.toString() || data.clientid?.toString() || userId,
        email: data.email,
        firstName: data.firstname,
        lastName: data.lastname,
        companyName: data.companyname,
        address1: data.address1,
        city: data.city,
        state: data.state,
        postcode: data.postcode,
        country: data.countrycode || data.country, // WHMCS usually returns country code as 'country' or 'countrycode'
        phoneNumber: data.phonenumber,
      };
      return { user };
    }
    console.warn(`[WHMCS API WARN] GetClientsDetails for ${userId} did not return success. Data:`, data);
    return { user: undefined };
  } catch (error) {
    console.error(`[WHMCS API CATCH ERROR] Failed to fetch user details for ${userId}:`, error);
    return { user: undefined };
  }
};


export const getClientsProductsAPI = async (userId: string): Promise<{ services: Service[] }> => {
  try {
    const data = await callWhmcsApi('GetClientsProducts', { clientid: userId, stats: true });
    let services: Service[] = [];
    // WHMCS often returns currency info at the top level or per product. Let's assume a general currency object for simplicity.
    const currency = data.currency || { code: data.products?.product?.[0]?.currencycode || 'USD', suffix: data.products?.product?.[0]?.currencysuffix || 'USD', prefix: data.products?.product?.[0]?.currencyprefix || '$' };

    if (data.products?.product) {
      const productsArray = Array.isArray(data.products.product) ? data.products.product : [data.products.product];
      services = productsArray.map((p: any) => ({
          id: p.id.toString(),
          name: p.name || p.productname, // productname can also be a field
          status: p.status, 
          registrationDate: p.regdate,
          nextDueDate: p.nextduedate,
          billingCycle: p.billingcycle,
          amount: `${p.currencyprefix || currency.prefix}${p.recurringamount} ${p.currencycode || currency.code}`,
          domain: p.domain,
          serverInfo: (p.serverip && p.serverhostname) ? { hostname: p.serverhostname, ipAddress: p.serverip } : undefined,
      }));
    }
    return { services };
  } catch (error) {
    console.error("[WHMCS API CATCH ERROR] Failed to fetch client products:", error);
    return { services: [] };
  }
};

export const getDomainsAPI = async (userId: string): Promise<{ domains: Domain[] }> => {
  try {
    const data = await callWhmcsApi('GetClientsDomains', { clientid: userId });
    let domains: Domain[] = [];
    if (data.domains?.domain) {
      const domainsArray = Array.isArray(data.domains.domain) ? data.domains.domain : [data.domains.domain];
      domains = domainsArray.map((d: any) => ({
          id: d.id.toString(),
          domainName: d.domainname,
          status: d.status,
          registrationDate: d.registrationdate,
          expiryDate: d.expirydate,
          registrar: d.registrar,
          nameservers: [d.nameserver1, d.nameserver2, d.nameserver3, d.nameserver4, d.nameserver5].filter(Boolean) // Filter out empty/null nameservers
      }));
    }
    return { domains };
  } catch (error) {
    console.error("[WHMCS API CATCH ERROR] Failed to fetch client domains:", error);
    return { domains: [] };
  }
};

export const getInvoicesAPI = async (userId: string): Promise<{ invoices: Invoice[] }> => {
  try {
    // Fetch both unpaid and a few recent paid invoices
    const unpaidParams = { userid: userId, limitnum: 50, status: 'Unpaid', orderby: 'duedate', order: 'desc' };
    const paidParams = { userid: userId, limitnum: 20, status: 'Paid', orderby: 'datepaid', order: 'desc' };
    
    const [unpaidData, paidData] = await Promise.all([
        callWhmcsApi('GetInvoices', unpaidParams),
        callWhmcsApi('GetInvoices', paidParams)
    ]);
    
    let invoices: Invoice[] = [];
    // WHMCS might return currency info at the top level or per invoice.
    // Defaulting currency if not found.
    const defaultCurrency = { code: 'USD', suffix: 'USD', prefix: '$' };

    const processInvoiceData = (invData: any, apiStatus: string) => {
        if (invData.result !== 'success' || !invData.invoices?.invoice) {
            console.warn(`[WHMCS API WARN] GetInvoices for status ${apiStatus} did not return success or no invoices found. Data:`, invData);
            return [];
        }
        const currency = invData.currency || defaultCurrency;
        const invoicesArray = Array.isArray(invData.invoices.invoice) ? invData.invoices.invoice : [invData.invoices.invoice];
        return invoicesArray.map((inv: any) => ({
            id: inv.id.toString(),
            invoiceNumber: inv.invoicenum || inv.id.toString(), // Fallback to ID if invoicenum is missing
            dateCreated: inv.date,
            dueDate: inv.duedate,
            total: `${inv.currencyprefix || currency.prefix}${inv.total} ${inv.currencycode || currency.code}`,
            status: inv.status as InvoiceStatus, // Assuming status matches type
            items: inv.items?.item ? 
                   (Array.isArray(inv.items.item) ? inv.items.item : [inv.items.item]).map((it: any) => ({
                      description: it.description,
                      amount: `${inv.currencyprefix || currency.prefix}${it.amount} ${inv.currencycode || currency.code}`
                   })) : []
        }));
    }

    invoices = invoices.concat(processInvoiceData(unpaidData, 'Unpaid'));
    invoices = invoices.concat(processInvoiceData(paidData, 'Paid'));
    
    // Sort by due date for unpaid (most urgent first), then by creation date for others (most recent first)
    invoices.sort((a, b) => {
      if (a.status === 'Unpaid' && b.status !== 'Unpaid') return -1;
      if (a.status !== 'Unpaid' && b.status === 'Unpaid') return 1;
      if ( (a.status === 'Unpaid' || a.status === 'Overdue') && (b.status === 'Unpaid' || b.status === 'Overdue') ) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); // Sooner due dates first
      }
      return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(); // Most recent created first for paid/cancelled
    });

    return { invoices };
  } catch (error) {
    console.error("[WHMCS API CATCH ERROR] Failed to fetch invoices:", error);
    return { invoices: [] };
  }
};

export const getTicketsAPI = async (userId: string): Promise<{ tickets: Ticket[] }> => {
  try {
    const data = await callWhmcsApi('GetTickets', { clientid: userId, limitnum: 50, status: 'All Active' }); // Fetch more tickets, 'All Active' includes Open, Answered, Customer-Reply, In Progress
    let tickets: Ticket[] = [];
    if (data.tickets?.ticket) {
        const ticketsArray = Array.isArray(data.tickets.ticket) ? data.tickets.ticket : [data.tickets.ticket];
        tickets = ticketsArray.map((t: any) => ({
            id: t.id.toString(), 
            ticketNumber: t.tid, 
            subject: t.subject,
            department: t.deptname || t.department,
            status: t.status as TicketStatus, // Assuming status matches type
            lastUpdated: t.lastreply || t.lastupdated, // lastupdated is also a common field
            dateOpened: t.date,
            priority: t.priority as 'Low' | 'Medium' | 'High',
        }));
    }
    return { tickets };
  } catch (error) {
    console.error("[WHMCS API CATCH ERROR] Failed to fetch tickets:", error);
    return { tickets: [] };
  }
};

export const getTicketByIdAPI = async (userId: string, ticketId: string): Promise<{ ticket?: Ticket }> => {
  try {
    // WHMCS GetTicket API expects 'ticketid' (numeric ID) or 'ticketnum' (TID like ABC-123)
    // Using ticketid as we generally store the numeric ID.
    const data = await callWhmcsApi('GetTicket', { ticketid: ticketId }); 
    
    if (data.result === 'success') {
      const repliesData = data.replies?.reply ? 
        (Array.isArray(data.replies.reply) ? data.replies.reply : [data.replies.reply]) : [];
      
      const replies: TicketReply[] = repliesData.map((r: any) => ({
          id: r.replyid?.toString() || r.id?.toString() || `reply-${Math.random().toString(36).substr(2, 9)}`,
          // WHMCS distinguishes staff/admin by userid=0 or an admin flag, or name.
          author: (r.userid?.toString() === '0' || r.admin || r.name === 'System' || (r.requestor_type === 'staff' || r.requestor_type === 'api')) ? 'Support Staff' : 'Client',
          message: r.message,
          date: r.date,
          attachments: r.attachments_removed ? [] : (r.attachments?.attachment || []).map((att:any) => att.filename) // Basic attachment handling
        }));

      const ticket: Ticket = {
        id: data.ticketid.toString(),
        ticketNumber: data.tid,
        subject: data.subject,
        department: data.deptname || data.department,
        status: data.status as TicketStatus,
        lastUpdated: data.last_reply_time || data.lastreply || data.lastactivity,
        dateOpened: data.date || data.created_at,
        priority: data.priority as 'Low' | 'Medium' | 'High',
        replies: replies,
      };
      return { ticket };
    }
    console.warn(`[WHMCS API WARN] GetTicketById for ${ticketId} did not return success. Data:`, data);
    return { ticket: undefined };
  } catch (error) {
    console.error(`[WHMCS API CATCH ERROR] Failed to fetch ticket ${ticketId}:`, error);
    return { ticket: undefined };
  }
};

export const openTicketAPI = async (userId: string, ticketData: { subject: string; department: string; message: string; priority: 'Low' | 'Medium' | 'High' }): Promise<{ result: 'success' | 'error'; message?: string; ticketId?: string; ticketNumber?: string }> => {
  try {
    const params = {
      clientid: userId,
      // deptname might not work for OpenTicket, it usually expects deptid (department ID).
      // If you have department names, you might need a preliminary call to GetSupportDepartments to map name to ID.
      // For now, assuming deptname might work or you'll adjust this.
      deptid: ticketData.department, // Changed from deptname to deptid as it's more common for OpenTicket
      subject: ticketData.subject,
      message: ticketData.message,
      priority: ticketData.priority,
      // serviceid: 'some_service_id', // Optional: if ticket relates to a specific service
    };
    // Before calling, you might need to fetch department ID if `ticketData.department` is a name.
    // Example: const departments = await callWhmcsApi('GetSupportDepartments');
    // const dept = departments.departments.department.find(d => d.name === ticketData.department);
    // if (dept) params.deptid = dept.id; else throw new Error('Department not found');
    // This part is commented out as it adds complexity but is often necessary.
    // For now, assuming ticketData.department is already an ID or deptname works.

    const data = await callWhmcsApi('OpenTicket', params);
    if (data.result === 'success' && data.id) {
      return { result: 'success', ticketId: data.id.toString(), ticketNumber: data.tid };
    }
    return { result: 'error', message: data.message || 'Failed to open ticket via WHMCS.' };
  } catch (error: any) {
    return { result: 'error', message: (error instanceof Error ? error.message : String(error)) };
  }
};

export const replyToTicketAPI = async (userId: string, ticketId: string, message: string): Promise<{ result: 'success' | 'error'; message?: string; reply?: TicketReply }> => {
  try {
    const params = {
      ticketid: ticketId, 
      message: message,
      clientid: userId, // Ensures reply is associated with the client if called by client context
      // adminusername: 'api_admin_user', // Optional: If the API user needs to be specified as replier (for staff replies via API)
    };
    const data = await callWhmcsApi('AddTicketReply', params);
    if (data.result === 'success') {
      // WHMCS AddTicketReply usually doesn't return the full reply object.
      // We construct a temporary one for immediate UI update.
      const newReply: TicketReply = { 
        id: `temp-reply-${Date.now()}-${Math.random().toString(16).slice(2)}`, 
        author: 'Client', // Assuming client is replying. If staff, this needs adjustment.
        message,
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'), 
      };
      return { result: 'success', reply: newReply };
    }
    return { result: 'error', message: data.message || 'Failed to reply to ticket via WHMCS.' };
  } catch (error: any) {
    return { result: 'error', message: (error instanceof Error ? error.message : String(error)) };
  }
};
