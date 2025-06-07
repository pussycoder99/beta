
import type { User, Service, Domain, Invoice, Ticket, TicketReply } from '@/types';
import { format, add } from 'date-fns';

const WHMCS_API_URL = process.env.NEXT_PUBLIC_WHMCS_API_URL;
const WHMCS_API_IDENTIFIER = process.env.WHMCS_API_IDENTIFIER;
const WHMCS_API_SECRET = process.env.WHMCS_API_SECRET;

// Helper function to make API requests to WHMCS
async function callWhmcsApi(action: string, params: Record<string, any> = {}): Promise<any> {
  if (!WHMCS_API_URL || !WHMCS_API_IDENTIFIER || !WHMCS_API_SECRET) {
    console.error("WHMCS API credentials or URL are not configured in environment variables.");
    throw new Error("WHMCS API not configured.");
  }

  const formData = new URLSearchParams();
  formData.append('action', action);
  formData.append('username', WHMCS_API_IDENTIFIER);
  formData.append('password', WHMCS_API_SECRET); // WHMCS typically expects the raw secret or an md5 hash depending on config. Adjust if needed.
  formData.append('responsetype', 'json');

  for (const key in params) {
    formData.append(key, params[key]);
  }

  try {
    const response = await fetch(WHMCS_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
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

export const validateLoginAPI = async (email: string, passwordAttempt: string): Promise<{ result: 'success' | 'error'; message?: string; user?: Partial<User>; userId?: string }> => {
  try {
    const data = await callWhmcsApi('ValidateLogin', { email: email, password2: passwordAttempt });
    if (data.result === 'success' && data.userid) {
      // WHMCS ValidateLogin returns userid. We'll fetch full user details separately.
      return { result: 'success', userId: data.userid.toString() };
    }
    return { result: 'error', message: data.message || 'Invalid email or password via WHMCS.' };
  } catch (error) {
    return { result: 'error', message: (error as Error).message };
  }
};

export const addClientAPI = async (clientData: Omit<User, 'id'> & {password?: string}): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
  try {
    // WHMCS AddClient requires specific parameters. Map clientData to those.
    // Example: client_firstname, client_lastname, client_email, password2, etc.
    const params = {
      firstname: clientData.firstName,
      lastname: clientData.lastName,
      email: clientData.email,
      password2: clientData.password, // WHMCS handles hashing
      companyname: clientData.companyName,
      address1: clientData.address1,
      city: clientData.city,
      state: clientData.state,
      postcode: clientData.postcode,
      country: clientData.country, // WHMCS expects 2-letter country code
      phonenumber: clientData.phoneNumber,
      // Add any other required fields by WHMCS
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
      // TODO: Process WHMCS JSON response and map to User type.
      // WHMCS GetClientsDetails returns a lot of info. Map the relevant fields.
      // Example: data.firstname, data.lastname, data.email, etc.
      const user: User = {
        id: data.userid.toString(),
        email: data.email,
        firstName: data.firstname,
        lastName: data.lastname,
        companyName: data.companyname,
        address1: data.address1,
        city: data.city,
        state: data.state,
        postcode: data.postcode,
        country: data.country, // WHMCS returns 2-letter code, UI might want full name
        phoneNumber: data.phonenumber,
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
    const data = await callWhmcsApi('GetClientsProducts', { clientid: userId });
    // TODO: Process WHMCS JSON response and map data.products.product array to Service[] type.
    // Ensure dates are formatted as strings (e.g., 'yyyy-MM-dd').
    // Example item: { id, name, status, nextduedate, billingcycle, recurringamount, domain }
    let services: Service[] = [];
    if (data.products && data.products.product) {
        services = data.products.product.map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
            status: p.status, // WHMCS status might need mapping to your ServiceStatus type
            registrationDate: p.regdate, // format if needed
            nextDueDate: p.nextduedate, // format if needed
            billingCycle: p.billingcycle,
            amount: `${p.recurringamount} ${data.currency?.suffix || 'USD'}`, // Construct amount string
            domain: p.domain,
            // serverInfo might require another API call or be part of product details
        }));
    }
    return { services };
  } catch (error) {
    return { services: [] };
  }
};

export const getDomainsAPI = async (userId: string): Promise<{ domains: Domain[] }> => {
  try {
    const data = await callWhmcsApi('GetClientsDomains', { clientid: userId });
    // TODO: Process WHMCS JSON response and map data.domains.domain array to Domain[] type.
    // Example item: { id, domainname, status, registrationdate, expirydate, registrar, nameserver1, nameserver2, ... }
     let domains: Domain[] = [];
    if (data.domains && data.domains.domain) {
        domains = data.domains.domain.map((d: any) => ({
            id: d.id.toString(),
            domainName: d.domainname,
            status: d.status, // WHMCS status might need mapping
            registrationDate: d.registrationdate,
            expiryDate: d.expirydate,
            registrar: d.registrar,
            nameservers: [d.nameserver1, d.nameserver2, d.nameserver3, d.nameserver4, d.nameserver5].filter(Boolean)
        }));
    }
    return { domains };
  } catch (error) {
    return { domains: [] };
  }
};

export const getInvoicesAPI = async (userId: string): Promise<{ invoices: Invoice[] }> => {
  try {
    const data = await callWhmcsApi('GetInvoices', { userid: userId }); // WHMCS uses userid for GetInvoices
    // TODO: Process WHMCS JSON response and map data.invoices.invoice array to Invoice[] type.
    // Example item: { id, invoicenum, date, duedate, total, status, items: { item: [...] } }
    let invoices: Invoice[] = [];
    if (data.invoices && data.invoices.invoice) {
        invoices = data.invoices.invoice.map((inv: any) => ({
            id: inv.id.toString(),
            invoiceNumber: inv.invoicenum,
            dateCreated: inv.date,
            dueDate: inv.duedate,
            total: `${inv.total} ${data.currency?.suffix || 'USD'}`,
            status: inv.status, // WHMCS status might need mapping
            items: inv.items.item ? (Array.isArray(inv.items.item) ? inv.items.item : [inv.items.item]).map((it: any) => ({
                description: it.description,
                amount: `${it.amount} ${data.currency?.suffix || 'USD'}`
            })) : []
        }));
    }
    return { invoices };
  } catch (error) {
    return { invoices: [] };
  }
};

export const getTicketsAPI = async (userId: string): Promise<{ tickets: Ticket[] }> => {
  try {
    const data = await callWhmcsApi('GetTickets', { clientid: userId });
    // TODO: Process WHMCS JSON response and map data.tickets.ticket array to Ticket[] type.
    // Example item: { id, tid, subject, deptname, status, lastreply, date, priority }
    let tickets: Ticket[] = [];
    if (data.tickets && data.tickets.ticket) {
        tickets = data.tickets.ticket.map((t: any) => ({
            id: t.id.toString(),
            ticketNumber: t.tid,
            subject: t.subject,
            department: t.deptname,
            status: t.status, // WHMCS status might need mapping
            lastUpdated: t.lastreply, // format if needed
            dateOpened: t.date, // format if needed
            priority: t.priority, // WHMCS priority might need mapping
            // replies are fetched separately with GetTicket
        }));
    }
    return { tickets };
  } catch (error) {
    return { tickets: [] };
  }
};

export const getTicketByIdAPI = async (userId: string, ticketIdOrTid: string): Promise<{ ticket?: Ticket }> => {
  try {
    // WHMCS GetTicket uses 'ticketid' (the auto-increment ID) or 'ticketnum' (TID). Assuming ticketIdOrTid is the auto-increment ID.
    // If it's TID, use 'ticketnum' parameter.
    // For this example, let's assume ticketIdOrTid is the numeric ID (id from getTicketsAPI).
    // The WHMCS API 'GetTicket' uses 'ticketid' which is the numeric id, not the TID (ticket number string).
    // If you are storing ticket.id as the numeric ID, this is fine. If ticket.id is the TID (e.g. "ABC-12345"),
    // you'll need to adjust or use 'ticketnum' param. Let's assume 'ticketid' is the numeric one.
    const data = await callWhmcsApi('GetTicket', { ticketid: ticketIdOrTid });
    
    if (data.result === 'success') {
      // TODO: Process WHMCS JSON response and map to Ticket type.
      // Example: data.tid, data.subject, data.deptname, data.status, data.lastreply, data.opened, data.priority
      // Replies are in data.replies.reply
      const replies: TicketReply[] = data.replies && data.replies.reply ? 
        (Array.isArray(data.replies.reply) ? data.replies.reply : [data.replies.reply]).map((r: any) => ({
          id: r.replyid?.toString() || `reply-${Math.random()}`, // WHMCS reply might not have a unique ID easily accessible or might be message_id
          author: r.userid.toString() === userId ? 'Client' : 'Support Staff', // Check r.admin if it's an admin reply
          message: r.message,
          date: r.date, // format if needed
        })) : [];

      const ticket: Ticket = {
        id: data.ticketid.toString(),
        ticketNumber: data.tid,
        subject: data.subject,
        department: data.deptname,
        status: data.status, // Map status
        lastUpdated: data.last_reply_time || data.lastreply, // format if needed
        dateOpened: data.date, // format if needed
        priority: data.priority, // Map priority
        replies: replies,
      };
      return { ticket };
    }
    return { ticket: undefined };
  } catch (error) {
    console.error(`Failed to fetch ticket ${ticketIdOrTid}:`, error);
    return { ticket: undefined };
  }
};

export const openTicketAPI = async (userId: string, ticketData: { subject: string; department: string; message: string; priority: 'Low' | 'Medium' | 'High' }): Promise<{ result: 'success' | 'error'; message?: string; ticketId?: string; ticketNumber?: string }> => {
  try {
    // WHMCS OpenTicket needs deptid or deptname. If deptname, it will try to find it.
    // Priority also needs to match WHMCS defined priorities.
    const params = {
      clientid: userId,
      deptname: ticketData.department, // Or use deptid if you know it
      subject: ticketData.subject,
      message: ticketData.message,
      priority: ticketData.priority,
      // serviceid, contactid, etc. can also be passed
    };
    const data = await callWhmcsApi('OpenTicket', params);
    if (data.result === 'success' && data.id) { // WHMCS returns 'id' (numeric) and 'tid' (string ticket number)
      return { result: 'success', ticketId: data.id.toString(), ticketNumber: data.tid };
    }
    return { result: 'error', message: data.message || 'Failed to open ticket via WHMCS.' };
  } catch (error) {
    return { result: 'error', message: (error as Error).message };
  }
};

export const replyToTicketAPI = async (userId: string, ticketId: string, message: string): Promise<{ result: 'success' | 'error'; message?: string; reply?: TicketReply }> => {
  try {
    // WHMCS AddTicketReply needs 'ticketid' (the numeric ID).
    const params = {
      ticketid: ticketId, // This should be the numeric ID
      message: message,
      clientid: userId, // Optional: WHMCS can infer from ticket if user owns it. Good for validation.
      // adminusername: if replying as admin, not client
    };
    const data = await callWhmcsApi('AddTicketReply', params);
    if (data.result === 'success') {
      // AddTicketReply doesn't return the full reply object in the same way GetTicket does.
      // We might need to re-fetch the ticket or construct a partial reply.
      // For simplicity, let's assume success means the UI will re-fetch or update locally.
      const newReply: TicketReply = {
        id: `reply-${Math.random().toString(36).substr(2, 9)}`, // Placeholder ID
        author: 'Client',
        message,
        date: format(new Date(), 'yyyy-MM-dd HH:mm'),
      };
      return { result: 'success', reply: newReply };
    }
    return { result: 'error', message: data.message || 'Failed to reply to ticket via WHMCS.' };
  } catch (error) {
    return { result: 'error', message: (error as Error).message };
  }
};

// Note: The mock data below is no longer used if the API calls are implemented correctly.
// It can be removed or kept for fallback/testing if desired, but the functions above should be prioritized.
let mockUsers: User[] = [
  { id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe', companyName: 'Test Inc.', address1: '123 Main St', city: 'Anytown', state: 'CA', postcode: '90210', country: 'US', phoneNumber: '555-1234' }
];
// ... (keep other mock data arrays if needed for reference during development, but they won't be called by the live functions)
