
import type { User, Service, Domain, Invoice, Ticket, TicketReply, InvoiceStatus, TicketStatus, ServiceStatus, DomainStatus, ProductGroup, Product, ProductPricing, PricingCycleDetail, DomainSearchResult, DomainConfiguration, PaymentMethod } from '@/types';
import { format, subDays, addDays, addMonths } from 'date-fns';

// This function will be the single point of contact for all real WHMCS API calls.
export async function callWhmcsApi(action: string, params: Record<string, any> = {}): Promise<any> {
    const apiUrl = process.env.NEXT_PUBLIC_WHMCS_API_URL;
    const apiIdentifier = process.env.WHMCS_API_IDENTIFIER;
    const apiSecret = process.env.WHMCS_API_SECRET;

    if (!apiUrl || !apiIdentifier || !apiSecret) {
        console.error("WHMCS API credentials are not configured in environment variables.");
        throw new Error("API credentials are not configured on the server.");
    }
    
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    const body = new URLSearchParams({
        action,
        identifier: apiIdentifier,
        secret: apiSecret,
        responsetype: 'json',
        ...params,
    });

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body,
            cache: 'no-store', // Ensure fresh data is fetched every time
        });

        if (!response.ok) {
            // Attempt to get more detailed error from response body
            const errorBody = await response.text();
            console.error(`WHMCS API Error (${response.status}):`, errorBody);
            throw new Error(`API request failed with status ${response.status}.`);
        }
        
        const data = await response.json();
        
        // WHMCS often returns result="error" in a 200 OK response
        if (data.result === 'error') {
            console.error(`WHMCS API Logic Error for action "${action}":`, data.message || 'No error message provided.');
            throw new Error(data.message || `An error occurred with the API for action: ${action}.`);
        }

        return data;

    } catch (error) {
        console.error(`Failed to execute WHMCS API action "${action}":`, error);
        // Re-throw the error so the calling function can handle it
        throw error;
    }
}


// --- API-CONNECTED FUNCTIONS ---
// These functions now use the live callWhmcsApi helper.

export const validateLoginWHMCS = async (email: string, passwordAttempt: string): Promise<{ result: 'success' | 'error'; message?: string; userid?: string }> => {
  return callWhmcsApi('ValidateLogin', { email, password2: passwordAttempt });
};

export const addClientWHMCS = async (clientData: Omit<User, 'id'> & {password?: string}): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
    const params = {
        firstname: clientData.firstName,
        lastname: clientData.lastName,
        email: clientData.email,
        address1: clientData.address1,
        city: clientData.city,
        state: clientData.state,
        postcode: clientData.postcode,
        country: clientData.country,
        phonenumber: clientData.phoneNumber,
        companyname: clientData.companyName,
        password2: clientData.password,
    };
    const response = await callWhmcsApi('AddClient', params);
    return {
        result: response.result,
        message: response.message,
        userId: response.clientid
    };
}


export const getUserDetailsWHMCS = async (userId: string): Promise<{ user?: User }> => {
  const data = await callWhmcsApi('GetClientsDetails', { clientid: userId });
  if (data && data.client) {
     const user: User = {
        id: data.client.id.toString(),
        email: data.client.email,
        firstName: data.client.firstname,
        lastName: data.client.lastname,
        companyName: data.client.companyname,
        address1: data.client.address1,
        city: data.client.city,
        state: data.client.state,
        postcode: data.client.postcode,
        country: data.client.countrycode, // Note: WHMCS returns country code
        phoneNumber: data.client.phonenumber,
     };
     return { user };
  }
  return {};
};

export const getClientsProductsWHMCS = async (userId: string, serviceId?: string): Promise<{ services: Service[] }> => {
  const params: {clientid: string, serviceid?: string} = { clientid: userId };
  if(serviceId) params.serviceid = serviceId;
  const data = await callWhmcsApi('GetClientsProducts', params);

  if (data && data.products && data.products.product) {
      const services: Service[] = data.products.product.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        registrationDate: p.regdate,
        nextDueDate: p.nextduedate,
        billingCycle: p.billingcycle,
        amount: p.recurringamount,
        domain: p.domain,
        diskusage: p.diskusage,
        disklimit: p.disklimit,
        bwusage: p.bwusage,
        bwlimit: p.bwlimit,
        lastupdate: p.lastupdate,
        username: p.username,
        serverInfo: {
            hostname: p.servername,
            ipAddress: p.serverip
        }
      }));
      return { services };
  }
  return { services: [] };
};

export const getDomainsWHMCS = async (userId: string): Promise<{ domains: Domain[] }> => {
  const data = await callWhmcsApi('GetClientsDomains', { clientid: userId });
  if (data && data.domains && data.domains.domain) {
      const domains: Domain[] = data.domains.domain.map((d: any) => ({
          id: d.id,
          domainName: d.domainname,
          status: d.status,
          registrationDate: d.regdate,
          expiryDate: d.nextduedate,
          registrar: d.registrar,
          nameservers: [d.ns1, d.ns2, d.ns3, d.ns4].filter(Boolean)
      }));
      return { domains };
  }
  return { domains: [] };
};

export const getInvoicesWHMCS = async (userId: string, statusFilter?: InvoiceStatus): Promise<{ invoices: Invoice[] }> => {
  const params: {userid: string, status?: InvoiceStatus} = { userid: userId };
  if(statusFilter) params.status = statusFilter;
  const data = await callWhmcsApi('GetInvoices', params);
  
  if (data && data.invoices && data.invoices.invoice) {
      const invoices: Invoice[] = data.invoices.invoice.map((i: any) => ({
          id: i.id,
          invoiceNumber: i.invoicenum,
          dateCreated: i.date,
          dueDate: i.duedate,
          total: i.total,
          status: i.status,
          items: i.items.item.map((item: any) => ({ description: item.description, amount: item.amount })),
      }));
      return { invoices };
  }
  return { invoices: [] };
};

export const getTicketsWHMCS = async (userId: string, statusFilter: string = 'All Active'): Promise<{ tickets: Ticket[] }> => {
    const data = await callWhmcsApi('GetTickets', { clientid: userId, status: statusFilter });
    if(data && data.tickets && data.tickets.ticket) {
        const tickets: Ticket[] = data.tickets.ticket.map((t: any) => ({
            id: t.id,
            ticketNumber: t.tid,
            subject: t.subject,
            department: t.deptname,
            status: t.status,
            lastUpdated: t.lastreply,
            dateOpened: t.date,
            priority: t.priority
        }));
        return { tickets };
    }
    return { tickets: [] };
};

export const getTicketByIdWHMCS = async (ticketId: string): Promise<{ ticket?: Ticket }> => {
  const data = await callWhmcsApi('GetTicket', { ticketid: ticketId });
  if(data && data.ticketid) {
    const ticket: Ticket = {
        id: data.ticketid,
        ticketNumber: data.tid,
        subject: data.subject,
        department: data.deptname,
        status: data.status,
        lastUpdated: data.last_reply,
        dateOpened: data.date,
        priority: data.priority,
        replies: data.replies.reply.map((r: any) => ({
            id: r.replyid,
            author: r.name, // Will be "Client Name" or "Staff Name"
            message: r.message,
            date: r.date,
        }))
    };
    return { ticket };
  }
  return {};
};

export const openTicketWHMCS = async (ticketData: { clientid: string; deptname: string; subject: string; message: string; priority: 'Low' | 'Medium' | 'High'; }): Promise<{ result: 'success' | 'error'; message?: string; ticketId?: string; ticketNumber?: string; }> => {
    const data = await callWhmcsApi('OpenTicket', { ...ticketData, deptname: ticketData.deptname });
    return {
        result: data.result,
        message: data.message,
        ticketId: data.id,
        ticketNumber: data.tid
    };
}

export const replyToTicketWHMCS = async (replyData: { ticketid: string; message: string; }): Promise<{ result: 'success' | 'error'; message?: string; reply?: TicketReply }> => {
    const data = await callWhmcsApi('UpdateTicketReply', { ticketid: replyData.ticketid, message: replyData.message });
    // This API call does not return the reply details, so we can't populate it here.
    // The UI will need to re-fetch the ticket to see the new reply.
    return { result: data.result, message: data.message };
}

export const resendVerificationEmailWHMCS = async (userId: string): Promise<{ result: 'success' | 'error'; message?: string; }> => {
    return callWhmcsApi('SendEmail', { id: userId, messagename: 'Client Email Address Verification' });
}

export const createSsoTokenWHMCS = async (params: { clientid?: string; service_id?: number; }): Promise<{ result: 'success' | 'error'; redirect_url?: string }> => {
    const data = await callWhmcsApi('CreateSsoToken', params);
    return { result: data.result, redirect_url: data.redirect_url };
}

export const addFundsWHMCS = async (userId: string, amount: number, paymentMethodGateway: string): Promise<{ result: 'success' | 'error'; invoiceId?: string; paymentUrl?: string }> => {
    const data = await callWhmcsApi('AddInvoicePayment', { invoiceid: '0', amount, gateway: paymentMethodGateway }); // This is a simplification; a specific funds invoice is better
    // The above call is not ideal for funds. A better approach is to create a specific invoice.
    // Let's use AddInvoice.
    const invoiceData = await callWhmcsApi('AddInvoice', {
        userid: userId,
        status: 'Unpaid',
        sendinvoice: 'true', // Send email to user
        'itemdescription1': 'Add Funds Deposit',
        'itemamount1': amount.toFixed(2),
        'itemtaxed1': '0',
        'paymentmethod': paymentMethodGateway
    });
    
    if (invoiceData.result === 'success' && invoiceData.invoiceid) {
         const whmcsUrl = process.env.NEXT_PUBLIC_WHMCS_API_URL?.replace('/includes/api.php', '');
         return { 
            result: 'success', 
            invoiceId: invoiceData.invoiceid, 
            paymentUrl: `${whmcsUrl}/viewinvoice.php?id=${invoiceData.invoiceid}` 
        };
    }
    return { result: 'error', message: invoiceData.message || "Failed to create funds invoice." };
}

export const getProductGroupsWHMCS = async (): Promise<{ groups: ProductGroup[] }> => {
    const data = await callWhmcsApi('GetProducts');
    if (data && data.products && data.products.product) {
        const groupMap = new Map<string, ProductGroup>();
        data.products.product.forEach((p: any) => {
            if (p.gid && !groupMap.has(p.gid)) {
                groupMap.set(p.gid, {
                    id: p.gid,
                    name: p.groupname,
                });
            }
        });
        return { groups: Array.from(groupMap.values()) };
    }
    return { groups: [] };
}

export const getProductsWHMCS = async (gid?: string): Promise<{ products: Product[] }> => {
    const data = await callWhmcsApi('GetProducts', { gid });
    if (data && data.products && data.products.product) {
        const products: Product[] = data.products.product.map((p: any) => ({
            pid: p.pid,
            gid: p.gid,
            groupname: p.groupname,
            type: p.type,
            name: p.name,
            description: p.description,
            module: p.module,
            paytype: p.paytype,
            pricing: p.pricing,
            // Logic to parse pricing needs to be added here.
            parsedPricingCycles: Object.entries(p.pricing.USD)
                .filter(([cycle, price]) => parseFloat(price as string) >= 0 && !cycle.includes('setupfee'))
                .map(([cycle, price]) => ({
                    cycleName: cycle.charAt(0).toUpperCase() + cycle.slice(1),
                    displayPrice: `${p.pricing.USD.prefix}${price} ${p.pricing.USD.suffix}`,
                    whmcsCycle: cycle,
                })),
        }));
        return { products };
    }
    return { products: [] };
}

export const domainWhoisWHMCS = async (domain: string): Promise<{ result: DomainSearchResult }> => {
    const data = await callWhmcsApi('DomainWhois', { domain });
    return { result: {
        domainName: domain,
        status: data.status, // "available" or "unavailable"
        pricing: data.pricing ? { register: data.pricing[1].register, period: '1' } : undefined
    }};
}

export const addDomainOrderWHMCS = async (userId: string, config: DomainConfiguration, paymentMethod: string): Promise<{ result: 'success' | 'error'; orderid?: string; invoiceid?: string }> => {
    const params = {
        clientid: userId,
        domain: config.domainName,
        regperiod: config.registrationPeriod,
        paymentmethod: paymentMethod,
        dnsmanagement: config.dnsManagement ? '1' : '0',
        emailforwarding: config.emailForwarding ? '1' : '0',
        idprotection: config.idProtection ? '1' : '0',
        ns1: config.nameservers.ns1,
        ns2: config.nameservers.ns2,
    };
    const data = await callWhmcsApi('AddOrder', params);
    return { result: data.result, orderid: data.orderid, invoiceid: data.invoiceid };
}

export const getPaymentMethodsWHMCS = async (): Promise<{ paymentMethods: PaymentMethod[] }> => {
    const data = await callWhmcsApi('GetPaymentMethods');
    if (data && data.paymentmethods && data.paymentmethods.paymentmethod) {
        const methods: PaymentMethod[] = data.paymentmethods.paymentmethod.map((m: any) => ({
            module: m.module,
            displayName: m.displayname,
        }));
        return { paymentMethods: methods };
    }
    return { paymentMethods: [] };
}
