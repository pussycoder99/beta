
import type { User, Service, Domain, Invoice, Ticket, TicketReply, InvoiceStatus, TicketStatus } from '@/types';
import { format } from 'date-fns';

const WHMCS_API_URL = process.env.NEXT_PUBLIC_WHMCS_API_URL;
// These are now ONLY used server-side (e.g., in API routes)
const WHMCS_API_IDENTIFIER = process.env.WHMCS_API_IDENTIFIER;
const WHMCS_API_SECRET = process.env.WHMCS_API_SECRET;

// This function is intended to be called ONLY from server-side code (e.g., API routes)
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

  console.log(`[WHMCS API SERVER DEBUG] Calling action: ${action}`);
  // console.log(`[WHMCS API SERVER DEBUG] Request URL: ${WHMCS_API_URL}`);
  // console.log(`[WHMCS API SERVER DEBUG] Request FormData: ${formData.toString().replace(WHMCS_API_SECRET, '********')}`);

  try {
    const response = await fetch(WHMCS_API_URL, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    });

    // console.log(`[WHMCS API SERVER DEBUG] Response Status for ${action}: ${response.status}`);
    const rawResponseText = await response.text();
    // console.log(`[WHMCS API SERVER DEBUG] Raw Response Text for ${action}:`, rawResponseText);

    if (!response.ok) {
      const errorText = rawResponseText || `WHMCS API request failed with status ${response.status}`;
      console.error(`[WHMCS API SERVER ERROR] WHMCS API request failed for action ${action} with status ${response.status}: ${errorText}`);
      throw new Error(errorText);
    }

    const data = JSON.parse(rawResponseText);
    // console.log(`[WHMCS API SERVER DEBUG] Parsed Response Data for ${action}:`, data);
    
    if (data.result === 'error') {
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

// Specific WHMCS API call wrappers - intended to be called from server-side API routes

export const validateLoginWHMCS = async (email: string, passwordAttempt: string): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
  // ValidateLogin is a bit special in WHMCS, often called without admin API creds but with client's creds.
  // However, to make this usable within our API route structure which might be protected,
  // we'll use a direct fetch here instead of callWhmcsApi for this specific action if needed,
  // or ensure callWhmcsApi can handle actions that don't strictly need IDENTIFIER/SECRET if client creds are primary.
  // For simplicity and consistency, we'll assume ValidateLogin can be proxied via an admin-authenticated API call,
  // or that WHMCS allows ValidateLogin with admin creds for the API call itself.

  // If ValidateLogin MUST NOT use admin identifier/secret for the API call itself:
  const directFormData = new URLSearchParams();
  directFormData.append('action', 'ValidateLogin');
  directFormData.append('email', email);
  directFormData.append('password2', passwordAttempt);
  directFormData.append('responsetype', 'json');
  
  // If your WHMCS needs API IDENTIFIER/SECRET even for ValidateLogin:
  // directFormData.append('identifier', WHMCS_API_IDENTIFIER!);
  // directFormData.append('secret', WHMCS_API_SECRET!);


  console.log(`[WHMCS API SERVER DEBUG] Calling action: ValidateLogin (direct)`);
  console.log(`[WHMCS API SERVER DEBUG] Request URL: ${WHMCS_API_URL}`);
  // console.log(`[WHMCS API SERVER DEBUG] Request FormData for ValidateLogin: ${directFormData.toString()}`);

  try {
    const response = await fetch(WHMCS_API_URL!, {
        method: 'POST',
        body: directFormData,
        cache: 'no-store',
    });

    // console.log(`[WHMCS API SERVER DEBUG] Response Status for ValidateLogin (direct): ${response.status}`);
    const rawResponseText = await response.text();
    // console.log(`[WHMCS API SERVER DEBUG] Raw Response Text for ValidateLogin (direct):`, rawResponseText);

    if (!response.ok) {
        const errorText = rawResponseText || `WHMCS ValidateLogin request failed with status ${response.status}`;
        console.error(`[WHMCS API SERVER ERROR] ValidateLogin request failed: ${errorText}`);
        throw new Error(errorText);
    }
    const data = JSON.parse(rawResponseText);
    // console.log(`[WHMCS API SERVER DEBUG] Parsed Response Data for ValidateLogin (direct):`, data);

    if (data.result === 'success' && data.userid) {
      return { result: 'success', userId: data.userid.toString() };
    }
    return { result: 'error', message: data.message || 'Invalid email or password via WHMCS.' };
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
      password2: clientData.password, // WHMCS AddClient hashes this
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

export const getUserDetailsWHMCS = async (userId: string): Promise<{ user?: User }> => {
  try {
    const data = await callWhmcsApi('GetClientsDetails', { clientid: userId, stats: false });
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
        country: data.countrycode || data.country,
        phoneNumber: data.phonenumber || data.telephone, // WHMCS sometimes uses 'telephone'
      };
      return { user };
    }
    console.warn(`[WHMCS API SERVER WARN] GetClientsDetails for ${userId} did not return success. Data:`, data);
    return { user: undefined };
  } catch (error) {
    console.error(`[WHMCS API SERVER CATCH ERROR] Failed to fetch user details for ${userId}:`, error);
    return { user: undefined };
  }
};

export const getClientsProductsWHMCS = async (userId: string): Promise<{ services: Service[] }> => {
  try {
    const data = await callWhmcsApi('GetClientsProducts', { clientid: userId, stats: true });
    let services: Service[] = [];
    const currency = data.currency || { code: data.products?.product?.[0]?.currencycode || 'USD', suffix: data.products?.product?.[0]?.currencysuffix || 'USD', prefix: data.products?.product?.[0]?.currencyprefix || '$' };

    if (data.products?.product) {
      const productsArray = Array.isArray(data.products.product) ? data.products.product : [data.products.product];
      services = productsArray.map((p: any) => ({
          id: p.id.toString(),
          name: p.name || p.productinfo?.name || p.productname,
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
    console.error("[WHMCS API SERVER CATCH ERROR] Failed to fetch client products:", error);
    return { services: [] };
  }
};

export const getDomainsWHMCS = async (userId: string): Promise<{ domains: Domain[] }> => {
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
          nameservers: [d.nameserver1, d.nameserver2, d.nameserver3, d.nameserver4, d.nameserver5].filter(Boolean)
      }));
    }
    return { domains };
  } catch (error) {
    console.error("[WHMCS API SERVER CATCH ERROR] Failed to fetch client domains:", error);
    return { domains: [] };
  }
};

export const getInvoicesWHMCS = async (userId: string, statusFilter?: InvoiceStatus, limit: number = 50): Promise<{ invoices: Invoice[] }> => {
  try {
    const params: Record<string, any> = { userid: userId, limitnum: limit, orderby: 'duedate', order: 'desc' };
    if (statusFilter) {
        params.status = statusFilter;
        if (statusFilter === 'Paid') {
            params.orderby = 'datepaid';
        }
    }
    
    const invData = await callWhmcsApi('GetInvoices', params);
    
    let invoices: Invoice[] = [];
    const defaultCurrency = { code: 'USD', suffix: 'USD', prefix: '$' };

    if (invData.result !== 'success' || !invData.invoices?.invoice) {
        console.warn(`[WHMCS API SERVER WARN] GetInvoices for status ${statusFilter || 'any'} did not return success or no invoices found. Data:`, invData);
        return { invoices: [] };
    }
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
    
    // Sorting can be handled by the caller if multiple statuses are fetched and combined
    return { invoices };
  } catch (error) {
    console.error("[WHMCS API SERVER CATCH ERROR] Failed to fetch invoices:", error);
    return { invoices: [] };
  }
};

export const getTicketsWHMCS = async (userId: string, statusFilter: string = 'All Active'): Promise<{ tickets: Ticket[] }> => {
  try {
    // WHMCS typically uses status like 'Open', 'Answered', 'Customer-Reply', 'Closed', 'In Progress'.
    // 'All Active' might include Open, Answered, Customer-Reply, In Progress.
    const data = await callWhmcsApi('GetTickets', { clientid: userId, limitnum: 50, status: statusFilter });
    let tickets: Ticket[] = [];
    if (data.tickets?.ticket) {
        const ticketsArray = Array.isArray(data.tickets.ticket) ? data.tickets.ticket : [data.tickets.ticket];
        tickets = ticketsArray.map((t: any) => ({
            id: t.id.toString(), 
            ticketNumber: t.tid, 
            subject: t.subject,
            department: t.deptname || t.department, // WHMCS uses deptname when returning tickets usually
            status: t.status as TicketStatus,
            lastUpdated: t.lastreply || t.lastupdated,
            dateOpened: t.date,
            priority: t.priority as 'Low' | 'Medium' | 'High',
        }));
    }
    return { tickets };
  } catch (error) {
    console.error("[WHMCS API SERVER CATCH ERROR] Failed to fetch tickets:", error);
    return { tickets: [] };
  }
};

export const getTicketByIdWHMCS = async (ticketId: string): Promise<{ ticket?: Ticket }> => {
  try {
    const data = await callWhmcsApi('GetTicket', { ticketid: ticketId }); 
    
    if (data.result === 'success') {
      const repliesData = data.replies?.reply ? 
        (Array.isArray(data.replies.reply) ? data.replies.reply : [data.replies.reply]) : [];
      
      const replies: TicketReply[] = repliesData.map((r: any) => ({
          id: r.replyid?.toString() || r.id?.toString() || `reply-${Math.random().toString(36).substr(2, 9)}`,
          author: (r.userid?.toString() === '0' || r.admin || r.name === 'System' || (r.requestor_type === 'staff' || r.requestor_type === 'api')) ? 'Support Staff' : 'Client',
          message: r.message,
          date: r.date,
          attachments: r.attachments_removed ? [] : (r.attachments?.attachment || []).map((att:any) => att.filename)
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
    console.warn(`[WHMCS API SERVER WARN] GetTicketById for ${ticketId} did not return success. Data:`, data);
    return { ticket: undefined };
  } catch (error) {
    console.error(`[WHMCS API SERVER CATCH ERROR] Failed to fetch ticket ${ticketId}:`, error);
    return { ticket: undefined };
  }
};

export const openTicketWHMCS = async (ticketData: { clientid: string, deptid: string; subject: string; message: string; priority: 'Low' | 'Medium' | 'High'; serviceid?: string }): Promise<{ result: 'success' | 'error'; message?: string; ticketId?: string; ticketNumber?: string }> => {
  try {
    const params = {
      clientid: ticketData.clientid,
      deptid: ticketData.deptid, // Expecting department ID
      subject: ticketData.subject,
      message: ticketData.message,
      priority: ticketData.priority,
      ...(ticketData.serviceid && { serviceid: ticketData.serviceid }),
    };
    
    const data = await callWhmcsApi('OpenTicket', params);
    if (data.result === 'success' && data.id) {
      return { result: 'success', ticketId: data.id.toString(), ticketNumber: data.tid };
    }
    return { result: 'error', message: data.message || 'Failed to open ticket via WHMCS.' };
  } catch (error: any) {
    return { result: 'error', message: (error instanceof Error ? error.message : String(error)) };
  }
};

export const replyToTicketWHMCS = async (replyData: { ticketid: string, message: string, clientid?: string, adminusername?: string }): Promise<{ result: 'success' | 'error'; message?: string; reply?: TicketReply /* WHMCS doesn't return full reply, so this would be constructed */ }> => {
  try {
    const params: Record<string, any> = {
      ticketid: replyData.ticketid, 
      message: replyData.message,
    };
    if (replyData.clientid) {
        params.clientid = replyData.clientid; // If client is replying
    } else if (replyData.adminusername) {
        params.adminusername = replyData.adminusername; // If admin/staff is replying via API
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

    