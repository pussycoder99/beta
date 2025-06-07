
import type { User, Service, Domain, Invoice, Ticket, TicketReply, InvoiceStatus, TicketStatus } from '@/types';
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

  console.log(`[WHMCS API SERVER DEBUG] Calling action: ${action}`);
  // console.log(`[WHMCS API SERVER DEBUG] Request URL: ${WHMCS_API_URL}`);
  // console.log(`[WHMCS API SERVER DEBUG] Request FormData (masked secrets): ${formData.toString().replace(WHMCS_API_SECRET, '********')}`);


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
      // Try to parse as JSON to see if WHMCS returned a structured error
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

export const validateLoginWHMCS = async (email: string, passwordAttempt: string): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
  const directFormData = new URLSearchParams();
  directFormData.append('action', 'ValidateLogin');
  directFormData.append('email', email);
  directFormData.append('password2', passwordAttempt);
  directFormData.append('responsetype', 'json');
  
  // If your WHMCS needs API IDENTIFIER/SECRET even for ValidateLogin, add them here.
  // However, ValidateLogin typically works by just providing client email and password.
  // If WHMCS_API_URL itself requires admin auth for any hit, then the global callWhmcsApi pattern might be needed even for this,
  // but ValidateLogin is often an exception that doesn't use the admin API secret *within its own parameters*.

  console.log(`[WHMCS API SERVER DEBUG] Attempting ValidateLogin action (direct)`);
  console.log(`[WHMCS API SERVER DEBUG] Target URL: ${WHMCS_API_URL}`);
  console.log(`[WHMCS API SERVER DEBUG] ValidateLogin FormData to be sent:`);
  for (const [key, value] of directFormData.entries()) {
    if (key.toLowerCase().includes('password')) {
      console.log(`  ${key}: ********`); // Mask password in logs
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
        // Try to parse as JSON to see if WHMCS returned a structured error
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
      return { result: 'success', userId: data.userid.toString() };
    }
    // Ensure a message is returned even if WHMCS doesn't provide one
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
      country: clientData.country || '', // WHMCS expects country code (e.g., US, GB)
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
    if (data.result === 'success' && data.client) { // WHMCS often nests user details under 'client'
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
        country: client.countrycode || client.country, // Prefer countrycode
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


export const getClientsProductsWHMCS = async (userId: string): Promise<{ services: Service[], whmcsData?: any }> => {
  try {
    const data = await callWhmcsApi('GetClientsProducts', { clientid: userId, stats: false }); // stats:false is often cleaner
    let services: Service[] = [];
    
    if (data.result === 'success' && data.products?.product) {
      const productsArray = Array.isArray(data.products.product) ? data.products.product : [data.products.product];
      const currency = data.currency || { code: productsArray[0]?.currencycode || 'USD', suffix: productsArray[0]?.currencysuffix || 'USD', prefix: productsArray[0]?.currencyprefix || '$' };
      
      services = productsArray.map((p: any) => ({
          id: p.id.toString(),
          name: p.name || p.productinfo?.name || p.productname, // WHMCS uses 'name' for service display name, 'productname' for package name
          status: p.status as ServiceStatus, 
          registrationDate: p.regdate,
          nextDueDate: p.nextduedate,
          billingCycle: p.billingcycle,
          amount: `${p.currencyprefix || currency.prefix}${p.recurringamount} ${p.currencycode || currency.code}`,
          domain: p.domain,
          // serverInfo: (p.serverip && p.serverhostname) ? { hostname: p.serverhostname, ipAddress: p.serverip } : undefined,
      }));
    } else if (data.result !== 'success') {
        console.warn(`[WHMCS API SERVER WARN] GetClientsProducts for user ${userId} API call failed. Data:`, data);
    } else {
        console.log(`[WHMCS API SERVER INFO] No products found for user ${userId}. Data:`, data);
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
          domainName: d.domain, // WHMCS often uses 'domain' for the domain name itself
          status: d.status as DomainStatus,
          registrationDate: d.regdate || d.registrationdate,
          expiryDate: d.nextduedate || d.expirydate, // nextduedate is often the renewal date for domains
          registrar: d.registrar,
          nameservers: [d.ns1, d.ns2, d.ns3, d.ns4, d.ns5].filter(Boolean) // WHMCS uses ns1, ns2, etc.
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
    if (statusFilter && statusFilter !== "Overdue") { // WHMCS 'Overdue' status might be special, handle if needed or use default 'Unpaid' for it
        params.status = statusFilter;
    } else if (statusFilter === "Overdue") {
        params.status = "Unpaid"; // Overdue invoices are typically a subset of Unpaid
    }
    
    const invData = await callWhmcsApi('GetInvoices', params);
    
    let invoices: Invoice[] = [];
    
    if (invData.result === 'success' && invData.invoices?.invoice) {
      const defaultCurrency = { code: 'USD', suffix: 'USD', prefix: '$' }; // Fallback
      const currency = invData.currency || defaultCurrency;
      const invoicesArray = Array.isArray(invData.invoices.invoice) ? invData.invoices.invoice : [invData.invoices.invoice];
      invoices = invoicesArray.map((inv: any) => ({
          id: inv.id.toString(),
          invoiceNumber: inv.invoicenum || inv.id.toString(),
          dateCreated: inv.date,
          dueDate: inv.duedate,
          total: `${inv.currencyprefix || currency.prefix}${inv.total} ${inv.currencycode || currency.code}`,
          status: inv.status as InvoiceStatus, // Ensure this matches your type's possible values
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
    // WHMCS API status filter: 'Open', 'Answered', 'Customer-Reply', 'Closed', 'In Progress'.
    // 'All Active' is not a direct WHMCS filter value. You might need multiple calls or broader filter.
    // For simplicity, let's try 'Open' or remove status filter to get more if 'All Active' doesn't work.
    // Or, let user pass specific WHMCS statuses.
    if (statusFilter && statusFilter !== 'All Active' && statusFilter !== 'All') {
        params.status = statusFilter;
    } else if (statusFilter === 'All Active') {
        params.status_custom_operator = 'OR'; // This is a guess, check WHMCS docs
        params.status = 'Open,Answered,Customer-Reply,In Progress'; // WHMCS might take comma-separated list
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
            lastUpdated: t.lastreply.includes('0000-00-00') ? t.date : t.lastreply, // WHMCS returns "0000-00-00 00:00:00" if no reply
            dateOpened: t.date,
            priority: t.priority as 'Low' | 'Medium' | 'High',
        }));
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
          // WHMCS uses 'userid' (0 for staff) and 'admin' field for staff name.
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

// Note: For OpenTicket, deptid should be the ID of the department, not its name.
// You might need a helper function or a map to convert department names to IDs if your UI uses names.
export const openTicketWHMCS = async (ticketData: { clientid: string, deptid: string; subject: string; message: string; priority: 'Low' | 'Medium' | 'High'; serviceid?: string }): Promise<{ result: 'success' | 'error'; message?: string; ticketId?: string; ticketNumber?: string }> => {
  try {
    const params = {
      clientid: ticketData.clientid,
      deptid: ticketData.deptid,
      subject: ticketData.subject,
      message: ticketData.message,
      priority: ticketData.priority,
      ...(ticketData.serviceid && { serviceid: ticketData.serviceid }),
      // You can also add other params like 'contactid', 'name', 'email' if not relying on clientid context
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

export const replyToTicketWHMCS = async (replyData: { ticketid: string, message: string, clientid?: string, adminusername?: string /* for admin replies */ }): Promise<{ result: 'success' | 'error'; message?: string; reply?: TicketReply }> => {
  try {
    const params: Record<string, any> = {
      ticketid: replyData.ticketid, 
      message: replyData.message,
    };
    if (replyData.clientid) {
        params.clientid = replyData.clientid;
        // If client is replying, WHMCS might also want 'name' and 'email' if not inferring from clientid
        // params.name = "Client Name"; // Needs to be fetched or passed
        // params.email = "client.email@example.com"; // Needs to be fetched or passed
    } else if (replyData.adminusername) {
        params.adminusername = replyData.adminusername;
    }
    
    const data = await callWhmcsApi('AddTicketReply', params);
    if (data.result === 'success') {
      // WHMCS AddTicketReply usually just returns {result: "success"}. 
      // We construct a temporary reply object for immediate UI update.
      const newReply: TicketReply = { 
        id: `temp-reply-${Date.now()}-${Math.random().toString(16).slice(2)}`, // Placeholder ID
        author: replyData.clientid ? 'Client' : 'Support Staff',
        message: replyData.message,
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'), // Current time as placeholder
      };
      return { result: 'success', reply: newReply };
    }
    return { result: 'error', message: data.message || 'Failed to reply to ticket via WHMCS.' };
  } catch (error: any) {
    return { result: 'error', message: (error instanceof Error ? error.message : String(error)) };
  }
};
