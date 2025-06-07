
import type { User, Service, Domain, Invoice, Ticket, TicketReply } from '@/types';
import { format } from 'date-fns';

const WHMCS_API_URL = process.env.NEXT_PUBLIC_WHMCS_API_URL;
const WHMCS_API_IDENTIFIER = process.env.WHMCS_API_IDENTIFIER;
const WHMCS_API_SECRET = process.env.WHMCS_API_SECRET;

// Helper function to make API requests to WHMCS
async function callWhmcsApi(action: string, params: Record<string, any> = {}): Promise<any> {
  if (!WHMCS_API_URL || !WHMCS_API_IDENTIFIER || !WHMCS_API_SECRET) {
    console.error("WHMCS API credentials or URL are not configured in environment variables.");
    throw new Error("WHMCS API not configured. Please set NEXT_PUBLIC_WHMCS_API_URL, WHMCS_API_IDENTIFIER, and WHMCS_API_SECRET in your .env.local file.");
  }

  const formData = new URLSearchParams();
  formData.append('action', action);
  formData.append('identifier', WHMCS_API_IDENTIFIER); // WHMCS uses 'identifier' and 'secret' for API auth typically
  formData.append('secret', WHMCS_API_SECRET);
  formData.append('responsetype', 'json');

  for (const key in params) {
    formData.append(key, params[key]);
  }

  try {
    const response = await fetch(WHMCS_API_URL, {
      method: 'POST',
      body: formData,
      cache: 'no-store', // Ensure fresh data from API
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`WHMCS API request failed with status ${response.status}: ${errorText}`);
      throw new Error(`WHMCS API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result === 'error') {
      console.error(`WHMCS API Error for action ${action}:`, data.message);
      throw new Error(data.message || `WHMCS API error for action ${action}.`);
    }
    return data;
  } catch (error) {
    console.error(`Error calling WHMCS action ${action}:`, error);
    throw error;
  }
}

export const validateLoginAPI = async (email: string, passwordAttempt: string): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
  try {
    // Note: WHMCS ValidateLogin might require admin credentials for 'username'/'password' if 'identifier'/'secret' don't work for this action directly.
    // Adjust `callWhmcsApi` or parameters here if needed, some WHMCS APIs prefer username/password of an admin for certain actions.
    // For ValidateLogin, it specifically expects client email and password.
    const params = { email: email, password2: passwordAttempt };
    // For ValidateLogin, we call directly without admin credentials, as it's for client auth.
    // We'll make a direct fetch here or adjust callWhmcsApi to support non-admin API user actions.
    // For now, assuming ValidateLogin can be called with specific params if your WHMCS setup allows.
    // If not, this action might need a different approach or a custom endpoint on WHMCS side.

    const directFormData = new URLSearchParams();
    directFormData.append('action', 'ValidateLogin');
    directFormData.append('email', email);
    directFormData.append('password2', passwordAttempt);
    directFormData.append('responsetype', 'json');
     // Add API credentials if your WHMCS requires them even for ValidateLogin
    if (WHMCS_API_IDENTIFIER && WHMCS_API_SECRET) {
        directFormData.append('identifier', WHMCS_API_IDENTIFIER);
        directFormData.append('secret', WHMCS_API_SECRET);
    }


    const response = await fetch(WHMCS_API_URL!, {
        method: 'POST',
        body: directFormData,
        cache: 'no-store',
    });
    if (!response.ok) throw new Error(`WHMCS ValidateLogin request failed with status ${response.status}`);
    const data = await response.json();


    if (data.result === 'success' && data.userid) {
      return { result: 'success', userId: data.userid.toString() };
    }
    return { result: 'error', message: data.message || 'Invalid email or password via WHMCS.' };
  } catch (error) {
    console.error("ValidateLogin API error:", error);
    return { result: 'error', message: (error as Error).message };
  }
};

export const addClientAPI = async (clientData: Omit<User, 'id'> & {password?: string}): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
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
      country: clientData.country || '', // WHMCS expects 2-letter country code
      phonenumber: clientData.phoneNumber || '',
    };
    const data = await callWhmcsApi('AddClient', params);
    if (data.result === 'success' && data.clientid) {
      return { result: 'success', userId: data.clientid.toString() };
    }
    return { result: 'error', message: data.message || 'Failed to add client via WHMCS.' };
  } catch (error) {
    return { result: 'error', message: (error as Error).message };
  }
};

export const getUserDetailsAPI = async (userId: string): Promise<{ user?: User }> => {
  try {
    const data = await callWhmcsApi('GetClientsDetails', { clientid: userId, stats: false });
    if (data.result === 'success') {
      const user: User = {
        id: data.client.id?.toString() || data.userid?.toString() || userId, // WHMCS response for GetClientsDetails nests user data under `client` or top level for older versions
        email: data.client?.email || data.email,
        firstName: data.client?.firstname || data.firstname,
        lastName: data.client?.lastname || data.lastname,
        companyName: data.client?.companyname || data.companyname,
        address1: data.client?.address1 || data.address1,
        city: data.client?.city || data.city,
        state: data.client?.state || data.state,
        postcode: data.client?.postcode || data.postcode,
        country: data.client?.countrycode || data.country, // WHMCS usually returns country code
        phoneNumber: data.client?.phonenumber || data.phonenumber,
      };
      return { user };
    }
    return { user: undefined };
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return { user: undefined };
  }
};


export const getClientsProductsAPI = async (userId: string): Promise<{ services: Service[] }> => {
  try {
    const data = await callWhmcsApi('GetClientsProducts', { clientid: userId, stats: true }); // stats:true can be useful
    let services: Service[] = [];
    const currency = data.currency || { code: 'USD', suffix: 'USD', prefix: '$' }; // Default currency if not provided

    if (data.products && data.products.product && Array.isArray(data.products.product)) {
        services = data.products.product.map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
            status: p.status, 
            registrationDate: p.regdate,
            nextDueDate: p.nextduedate,
            billingCycle: p.billingcycle,
            amount: `${currency.prefix}${p.recurringamount} ${currency.code}`,
            domain: p.domain,
            serverInfo: (p.serverip && p.serverhostname) ? { hostname: p.serverhostname, ipAddress: p.serverip } : undefined,
        }));
    } else if (data.products && data.products.product) { // Handle single product case
        const p = data.products.product;
         services = [{
            id: p.id.toString(),
            name: p.name,
            status: p.status, 
            registrationDate: p.regdate,
            nextDueDate: p.nextduedate,
            billingCycle: p.billingcycle,
            amount: `${currency.prefix}${p.recurringamount} ${currency.code}`,
            domain: p.domain,
            serverInfo: (p.serverip && p.serverhostname) ? { hostname: p.serverhostname, ipAddress: p.serverip } : undefined,
        }];
    }
    return { services };
  } catch (error) {
    console.error("Failed to fetch client products:", error);
    return { services: [] };
  }
};

export const getDomainsAPI = async (userId: string): Promise<{ domains: Domain[] }> => {
  try {
    const data = await callWhmcsApi('GetClientsDomains', { clientid: userId });
    let domains: Domain[] = [];
    if (data.domains && data.domains.domain && Array.isArray(data.domains.domain)) {
        domains = data.domains.domain.map((d: any) => ({
            id: d.id.toString(),
            domainName: d.domainname,
            status: d.status,
            registrationDate: d.registrationdate,
            expiryDate: d.expirydate,
            registrar: d.registrar,
            nameservers: [d.nameserver1, d.nameserver2, d.nameserver3, d.nameserver4, d.nameserver5].filter(Boolean)
        }));
    } else if (data.domains && data.domains.domain) { // Handle single domain case
        const d = data.domains.domain;
        domains = [{
            id: d.id.toString(),
            domainName: d.domainname,
            status: d.status,
            registrationDate: d.registrationdate,
            expiryDate: d.expirydate,
            registrar: d.registrar,
            nameservers: [d.nameserver1, d.nameserver2, d.nameserver3, d.nameserver4, d.nameserver5].filter(Boolean)
        }];
    }
    return { domains };
  } catch (error) {
    console.error("Failed to fetch client domains:", error);
    return { domains: [] };
  }
};

export const getInvoicesAPI = async (userId: string): Promise<{ invoices: Invoice[] }> => {
  try {
    const data = await callWhmcsApi('GetInvoices', { userid: userId, limitnum: 50, status: 'Unpaid' }); // Fetch more, maybe filter unpaid by default
    const dataPaid = await callWhmcsApi('GetInvoices', { userid: userId, limitnum: 20, status: 'Paid' }); // Fetch some paid ones too
    
    let invoices: Invoice[] = [];
    const currency = data.currency || { code: 'USD', suffix: 'USD', prefix: '$' };

    const processInvoiceData = (invData: any) => {
        if (invData.invoices && invData.invoices.invoice && Array.isArray(invData.invoices.invoice)) {
            return invData.invoices.invoice.map((inv: any) => ({
                id: inv.id.toString(),
                invoiceNumber: inv.invoicenum,
                dateCreated: inv.date,
                dueDate: inv.duedate,
                total: `${currency.prefix}${inv.total} ${currency.code}`,
                status: inv.status,
                items: inv.items && inv.items.item ? (Array.isArray(inv.items.item) ? inv.items.item : [inv.items.item]).map((it: any) => ({
                    description: it.description,
                    amount: `${currency.prefix}${it.amount} ${currency.code}`
                })) : []
            }));
        } else if (invData.invoices && invData.invoices.invoice) { // Handle single invoice
             const inv = invData.invoices.invoice;
             return [{
                id: inv.id.toString(),
                invoiceNumber: inv.invoicenum,
                dateCreated: inv.date,
                dueDate: inv.duedate,
                total: `${currency.prefix}${inv.total} ${currency.code}`,
                status: inv.status,
                items: inv.items && inv.items.item ? (Array.isArray(inv.items.item) ? inv.items.item : [inv.items.item]).map((it: any) => ({
                    description: it.description,
                    amount: `${currency.prefix}${it.amount} ${currency.code}`
                })) : []
            }];
        }
        return [];
    }

    invoices = invoices.concat(processInvoiceData(data));
    if(dataPaid.result === 'success') {
      invoices = invoices.concat(processInvoiceData(dataPaid));
    }
    
    // Sort by due date, most recent first for unpaid, most recent created for paid
    invoices.sort((a, b) => {
      if (a.status === 'Unpaid' && b.status !== 'Unpaid') return -1;
      if (a.status !== 'Unpaid' && b.status === 'Unpaid') return 1;
      if (a.status === 'Unpaid' && b.status === 'Unpaid') {
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
    });


    return { invoices };
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return { invoices: [] };
  }
};

export const getTicketsAPI = async (userId: string): Promise<{ tickets: Ticket[] }> => {
  try {
    const data = await callWhmcsApi('GetTickets', { clientid: userId, limit: 50 }); // Fetch more tickets
    let tickets: Ticket[] = [];
    if (data.tickets && data.tickets.ticket && Array.isArray(data.tickets.ticket)) {
        tickets = data.tickets.ticket.map((t: any) => ({
            id: t.id.toString(), // WHMCS Ticket ID (numeric)
            ticketNumber: t.tid, // WHMCS Ticket Number (e.g., ABC-12345)
            subject: t.subject,
            department: t.deptname,
            status: t.status,
            lastUpdated: t.lastreply,
            dateOpened: t.date,
            priority: t.priority as 'Low' | 'Medium' | 'High',
        }));
    } else if (data.tickets && data.tickets.ticket) { // Handle single ticket
        const t = data.tickets.ticket;
        tickets = [{
            id: t.id.toString(),
            ticketNumber: t.tid,
            subject: t.subject,
            department: t.deptname,
            status: t.status,
            lastUpdated: t.lastreply,
            dateOpened: t.date,
            priority: t.priority as 'Low' | 'Medium' | 'High',
        }];
    }
    return { tickets };
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return { tickets: [] };
  }
};

export const getTicketByIdAPI = async (userId: string, ticketId: string): Promise<{ ticket?: Ticket }> => {
  try {
    // WHMCS GetTicket API expects 'ticketid' which is the numeric ID.
    const data = await callWhmcsApi('GetTicket', { ticketid: ticketId });
    
    if (data.result === 'success') {
      const repliesData = data.replies && data.replies.reply ? 
        (Array.isArray(data.replies.reply) ? data.replies.reply : [data.replies.reply]) : [];
      
      const replies: TicketReply[] = repliesData.map((r: any) => ({
          id: r.replyid?.toString() || `reply-${r.id?.toString() || Math.random()}`, // replyid or id might be present
          author: r.userid?.toString() === '0' || r.admin ? 'Support Staff' : 'Client', // '0' for admin/staff, or check r.admin if available
          message: r.message,
          date: r.date,
        }));

      const ticket: Ticket = {
        id: data.ticketid.toString(),
        ticketNumber: data.tid,
        subject: data.subject,
        department: data.deptname,
        status: data.status,
        lastUpdated: data.last_reply_time || data.lastreply,
        dateOpened: data.date,
        priority: data.priority as 'Low' | 'Medium' | 'High',
        replies: replies,
      };
      return { ticket };
    }
    return { ticket: undefined };
  } catch (error) {
    console.error(`Failed to fetch ticket ${ticketId}:`, error);
    return { ticket: undefined };
  }
};

export const openTicketAPI = async (userId: string, ticketData: { subject: string; department: string; message: string; priority: 'Low' | 'Medium' | 'High' }): Promise<{ result: 'success' | 'error'; message?: string; ticketId?: string; ticketNumber?: string }> => {
  try {
    const params = {
      clientid: userId,
      deptname: ticketData.department, 
      subject: ticketData.subject,
      message: ticketData.message,
      priority: ticketData.priority,
    };
    const data = await callWhmcsApi('OpenTicket', params);
    if (data.result === 'success' && data.id) {
      return { result: 'success', ticketId: data.id.toString(), ticketNumber: data.tid };
    }
    return { result: 'error', message: data.message || 'Failed to open ticket via WHMCS.' };
  } catch (error) {
    return { result: 'error', message: (error as Error).message };
  }
};

export const replyToTicketAPI = async (userId: string, ticketId: string, message: string): Promise<{ result: 'success' | 'error'; message?: string; reply?: TicketReply }> => {
  try {
    const params = {
      ticketid: ticketId, // This should be the numeric ID
      message: message,
      clientid: userId, 
    };
    const data = await callWhmcsApi('AddTicketReply', params);
    if (data.result === 'success') {
      const newReply: TicketReply = { // WHMCS does not return the reply object, so we construct a temporary one.
        id: `temp-reply-${Date.now()}`, 
        author: 'Client',
        message,
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'), // Use current time
      };
      return { result: 'success', reply: newReply };
    }
    return { result: 'error', message: data.message || 'Failed to reply to ticket via WHMCS.' };
  } catch (error) {
    return { result: 'error', message: (error as Error).message };
  }
};
