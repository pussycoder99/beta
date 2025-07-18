
import type { User, Service, Domain, Invoice, Ticket, TicketReply, InvoiceStatus, TicketStatus, ServiceStatus, DomainStatus, ProductGroup, Product, ProductPricing, PricingCycleDetail, DomainSearchResult, DomainConfiguration, PaymentMethod } from '@/types';
import { format, subDays, addDays, addMonths } from 'date-fns';

// --- LIVE WHMCS API CONFIGURATION ---
// This file is now configured to make LIVE calls to your WHMCS API.
// It uses the credentials stored in your environment variables (.env.local).

// Helper function to call the WHMCS API
async function callWhmcsApi(action: string, params: Record<string, any> = {}): Promise<any> {
    const apiUrl = process.env.NEXT_PUBLIC_WHMCS_API_URL;
    const identifier = process.env.WHMCS_API_IDENTIFIER;
    const secret = process.env.WHMCS_API_SECRET;

    if (!apiUrl || !identifier || !secret) {
        console.error("WHMCS API credentials are not configured in environment variables.");
        throw new Error("API credentials are not configured on the server.");
    }

    const body = new URLSearchParams({
        ...params,
        action,
        identifier,
        secret,
        responsetype: 'json',
    });

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
            cache: 'no-store', // Ensure fresh data is always fetched
        });

        if (!response.ok) {
            // Try to get a meaningful error from the response body if possible
            const errorText = await response.text();
            console.error(`WHMCS API call failed with status ${response.status}:`, errorText);
            throw new Error(`API request failed with status ${response.status}.`);
        }
        
        const data = await response.json();

        if (data.result === 'error') {
            console.warn(`WHMCS API returned an error for action '${action}':`, data.message);
        }

        return data;

    } catch (error) {
        console.error(`Error calling WHMCS API action '${action}':`, error);
        throw error;
    }
}

// --- LIVE API FUNCTIONS ---

export const validateLoginWHMCS = async (email: string, passwordAttempt: string): Promise<{ result: 'success' | 'error'; message?: string; userid?: string }> => {
    return callWhmcsApi('ValidateLogin', { email, password2: passwordAttempt });
};

export const addClientWHMCS = async (clientData: Omit<User, 'id'> & { password?: string }): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
    return callWhmcsApi('AddClient', {
        firstname: clientData.firstName,
        lastname: clientData.lastName,
        email: clientData.email,
        password2: clientData.password,
        address1: clientData.address1,
        city: clientData.city,
        state: clientData.state,
        postcode: clientData.postcode,
        country: clientData.country,
        phonenumber: clientData.phoneNumber,
        companyname: clientData.companyName,
    });
};

export const getUserDetailsWHMCS = async (userId: string): Promise<{ user?: User }> => {
    const data = await callWhmcsApi('GetClientsDetails', { clientid: userId, stats: false });
    if (data.result === 'success') {
        const user: User = {
            id: data.userid,
            firstName: data.firstname,
            lastName: data.lastname,
            email: data.email,
            companyName: data.companyname,
            address1: data.address1,
            city: data.city,
            state: data.state,
            postcode: data.postcode,
            country: data.country,
            phoneNumber: data.phonenumber,
        };
        return { user };
    }
    return {};
};

export const getClientsProductsWHMCS = async (userId: string, serviceId?: string): Promise<{ services: Service[] }> => {
    const params = serviceId ? { serviceid: serviceId } : { clientid: userId };
    const data = await callWhmcsApi('GetClientsProducts', params);
    if (data && data.products && data.products.product) {
        // WHMCS returns a single object if there's one result, and an array if there are multiple.
        const productsArray = Array.isArray(data.products.product) ? data.products.product : [data.products.product];
        
        const services = productsArray.map((p: any): Service => ({
          id: p.id,
          name: p.name,
          status: p.status,
          registrationDate: p.regdate,
          nextDueDate: p.nextduedate,
          billingCycle: p.billingcycle,
          amount: p.recurringamount,
          domain: p.domain,
          // Include usage stats
          diskusage: p.diskusage,
          disklimit: p.disklimit,
          bwusage: p.bwusage,
          bwlimit: p.bwlimit,
          lastupdate: p.lastupdate,
          username: p.username,
        }));
        return { services };
    }
    return { services: [] };
};

export const getDomainsWHMCS = async (userId: string): Promise<{ domains: Domain[] }> => {
    const data = await callWhmcsApi('GetClientsDomains', { clientid: userId });
     if (data && data.domains && data.domains.domain) {
        const domainsArray = Array.isArray(data.domains.domain) ? data.domains.domain : [data.domains.domain];
        const domains = domainsArray.map((d: any): Domain => ({
            id: d.id,
            domainName: d.domainname,
            status: d.status,
            registrationDate: d.regdate,
            expiryDate: d.nextduedate,
            registrar: d.registrar,
            nameservers: [d.ns1, d.ns2, d.ns3, d.ns4, d.ns5].filter(Boolean),
            // These need to be fetched via getDomainDetails if not available here
            firstPaymentAmount: d.firstpaymentamount,
            recurringAmount: d.recurringamount,
            paymentMethod: d.paymentmethodname, 
            sslStatus: 'No SSL Detected', // This would require a separate check
            registrarLock: d.registrarlock,
            registrarLockStatus: d.registrarlock ? 'Locked' : 'Unlocked'
        }));
        return { domains };
    }
    return { domains: [] };
};

export const getDomainDetailsWHMCS = async (domainId: string): Promise<{ domain?: Domain }> => {
    const data = await callWhmcsApi('GetDomain', { domainid: domainId });
    if (data.result === 'success') {
        const d = data;
        const domain: Domain = {
            id: d.id,
            domainName: d.domain,
            status: d.status,
            registrationDate: d.regdate,
            expiryDate: d.nextduedate,
            registrar: d.registrar,
            nameservers: [d.ns1, d.ns2, d.ns3, d.ns4, d.ns5].filter(Boolean),
            firstPaymentAmount: d.firstpaymentamount,
            recurringAmount: d.recurringamount,
            paymentMethod: d.paymentmethod,
            sslStatus: d.sslstatus ? 'Active' : 'No SSL Detected',
            registrarLock: d.registrarlock == "1",
            registrarLockStatus: d.registrarlock == "1" ? 'Locked' : 'Unlocked',
        };
        return { domain };
    }
    return {};
}

export const updateDomainNameserversWHMCS = async (domainId: string, nameservers: { [key: string]: string | undefined }): Promise<{ result: 'success' | 'error'; message?: string }> => {
    return callWhmcsApi('UpdateDomainNameservers', { domainid: domainId, ...nameservers });
}

export const updateRegistrarLockStatusWHMCS = async (domainId: string, newLockStatus: boolean): Promise<{ result: 'success' | 'error'; message?: string; newStatus?: 'Locked' | 'Unlocked' }> => {
    const result = await callWhmcsApi('UpdateDomainRegistrarLock', { domainid: domainId, lockstatus: newLockStatus ? 1 : 0 });
    if(result.result === 'success') {
        return { ...result, newStatus: newLockStatus ? 'Locked' : 'Unlocked' }
    }
    return result;
};


export const getInvoicesWHMCS = async (userId: string, statusFilter?: InvoiceStatus): Promise<{ invoices: Invoice[] }> => {
    const params = { userid: userId, ...(statusFilter && {status: statusFilter}) };
    const data = await callWhmcsApi('GetInvoices', params);
    if (data && data.invoices && data.invoices.invoice) {
         const invoicesArray = Array.isArray(data.invoices.invoice) ? data.invoices.invoice : [data.invoices.invoice];
        const invoices = invoicesArray.map((i: any): Invoice => ({
            id: i.id,
            invoiceNumber: i.invoicenum,
            dateCreated: i.date,
            dueDate: i.duedate,
            total: `${i.total} ${i.currencycode}`,
            status: i.status as InvoiceStatus,
            items: i.items.item.map((item: any) => ({ description: item.description, amount: item.amount })),
        }));
        return { invoices };
    }
    return { invoices: [] };
};

export const getTicketsWHMCS = async (userId: string, statusFilter: string = 'All Active'): Promise<{ tickets: Ticket[] }> => {
    const data = await callWhmcsApi('GetTickets', { clientid: userId, status: statusFilter });
    if (data && data.tickets && data.tickets.ticket) {
        const ticketsArray = Array.isArray(data.tickets.ticket) ? data.tickets.ticket : [data.tickets.ticket];
        const tickets = ticketsArray.map((t: any): Ticket => ({
            id: t.id,
            ticketNumber: t.tid,
            subject: t.subject,
            department: t.deptname,
            status: t.status as TicketStatus,
            lastUpdated: t.lastreply,
            dateOpened: t.date,
            priority: t.priority as 'Low' | 'Medium' | 'High',
        }));
        return { tickets };
    }
    return { tickets: [] };
};

export const getTicketByIdWHMCS = async (ticketId: string): Promise<{ ticket?: Ticket }> => {
    const data = await callWhmcsApi('GetTicket', { ticketid: ticketId });
    if (data.result === 'success') {
        const repliesArray = (data.replies && data.replies.reply) ? (Array.isArray(data.replies.reply) ? data.replies.reply : [data.replies.reply]) : [];
        const ticket: Ticket = {
            id: data.ticketid,
            ticketNumber: data.tid,
            subject: data.subject,
            department: data.deptname,
            status: data.status,
            lastUpdated: data.last_reply,
            dateOpened: data.date,
            priority: data.priority,
            replies: repliesArray.map((r: any): TicketReply => ({
                id: r.replyid,
                author: r.userid > 0 ? 'Client' : 'Support Staff',
                message: r.message,
                date: r.date,
            })),
        };
        return { ticket };
    }
    return {};
};

export const openTicketWHMCS = async (ticketData: { clientid: string; deptname: string; subject: string; message: string; priority: string; serviceid?: string; }): Promise<{ result: 'success' | 'error'; message?: string; ticketId?: string; ticketNumber?: string; }> => {
    const result = await callWhmcsApi('OpenTicket', ticketData);
    if(result.result === 'success') {
        return { ...result, ticketId: result.id, ticketNumber: result.tid };
    }
    return result;
}

export const replyToTicketWHMCS = async (replyData: { ticketid: string; message: string; clientid: string }): Promise<{ result: 'success' | 'error'; message?: string; reply?: TicketReply }> => {
    const result = await callWhmcsApi('AddTicketReply', replyData);
     if (result.result === 'success') {
        const newReply: TicketReply = {
            id: `temp-${Math.random()}`, // The API doesn't return the new reply ID, so we create a temporary one
            author: 'Client',
            message: replyData.message,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        };
        return { ...result, reply: newReply };
    }
    return result;
}

export const resendVerificationEmailWHMCS = async (userId: string): Promise<{ result: 'success' | 'error'; message?: string; }> => {
    return callWhmcsApi('SendEmail', { id: userId, messagename: 'Client Email Address Verification' });
}

export const createSsoTokenWHMCS = async (params: { clientid?: string; service_id?: number; }): Promise<{ result: 'success' | 'error'; redirect_url?: string, message?: string }> => {
    return callWhmcsApi('CreateSsoToken', params);
}

export const addFundsWHMCS = async (userId: string, amount: number, paymentMethodGateway: string): Promise<{ result: 'success' | 'error'; invoiceId?: string; paymentUrl?: string, message?: string }> => {
    const whmcsAppUrl = process.env.NEXT_PUBLIC_WHMCS_APP_URL || '';
    const result = await callWhmcsApi('AddCredit', { clientid: userId, amount, description: 'Add Funds Deposit', type: 'addfunds', paymentmethod: paymentMethodGateway });
    if(result.result === 'success' && result.invoiceid) {
        return { ...result, invoiceId: result.invoiceid, paymentUrl: `${whmcsAppUrl}/viewinvoice.php?id=${result.invoiceid}` };
    }
    return result;
}

const parsePricing = (pricingData: any): PricingCycleDetail[] => {
    const cycles: PricingCycleDetail[] = [];
    const cycleMap: { [key: string]: string } = {
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        semiannually: 'Semi-Annually',
        annually: 'Annually',
        biennially: 'Biennially',
        triennially: 'Triennially',
    };
    
    // Assuming the first currency is the one to use
    const currency = pricingData[Object.keys(pricingData)[0]];

    for (const key in cycleMap) {
        if (parseFloat(currency[key]) >= 0) { // Price of -1.00 means not available
            cycles.push({
                cycleName: cycleMap[key],
                displayPrice: `${currency.prefix}${currency[key]}${currency.suffix} ${cycleMap[key]}`,
                whmcsCycle: key,
                setupFee: parseFloat(currency[`${key.charAt(0)}setupfee`]) > 0 ? `${currency.prefix}${currency[`${key.charAt(0)}setupfee`]}${currency.suffix} Setup` : undefined,
            });
        }
    }
    return cycles;
}


export const getProductGroupsWHMCS = async (): Promise<{ groups: ProductGroup[] }> => {
    const data = await callWhmcsApi('GetProductGroups');
    if (data && data.groups && data.groups.group) {
        return { groups: data.groups.group.map((g: any) => ({ id: g.id, name: g.name })) };
    }
    return { groups: [] };
}


export const getProductsWHMCS = async (gid?: string): Promise<{ products: Product[] }> => {
    const params = gid ? { gid } : {};
    const data = await callWhmcsApi('GetProducts', params);
    if (data && data.products && data.products.product) {
        const productsArray = Array.isArray(data.products.product) ? data.products.product : [data.products.product];
        const products = productsArray.map((p: any): Product => ({
            pid: p.pid,
            gid: p.gid,
            groupname: p.groupname,
            type: p.type,
            name: p.name,
            description: p.description,
            module: p.module,
            paytype: p.paytype,
            pricing: p.pricing,
            parsedPricingCycles: parsePricing(p.pricing),
        }));
        return { products };
    }
    return { products: [] };
};

export const domainWhoisWHMCS = async (domain: string): Promise<{ result: DomainSearchResult }> => {
    const data = await callWhmcsApi('DomainWhois', { domain });
    if(data.status === 'error') { // The API might return status:"error" in the top-level response
        return { result: { domainName: domain, status: 'error', errorMessage: data.message } };
    }
    return {
        result: {
            domainName: domain,
            status: data.status === 'available' ? 'available' : 'unavailable',
            pricing: data.pricing ? { register: data.pricing['1'].register, period: '1' } : undefined
        }
    };
}

export const addDomainOrderWHMCS = async (userId: string, config: DomainConfiguration, paymentMethod: string): Promise<{ result: 'success' | 'error'; orderid?: string; invoiceid?: string, message?: string }> => {
    return callWhmcsApi('AddOrder', {
        clientid: userId,
        domain: config.domainName,
        billingcycle: 'annually', // Reg period is separate
        regperiod: config.registrationPeriod,
        dnsmanagement: config.dnsManagement ? 1 : 0,
        emailforwarding: config.emailForwarding ? 1 : 0,
        idprotection: config.idProtection ? 1 : 0,
        nameserver1: config.nameservers.ns1,
        nameserver2: config.nameservers.ns2,
        nameserver3: config.nameservers.ns3,
        nameserver4: config.nameservers.ns4,
        paymentmethod: paymentMethod,
    });
}

export const getPaymentMethodsWHMCS = async (): Promise<{ paymentMethods: PaymentMethod[] }> => {
    const data = await callWhmcsApi('GetPaymentMethods');
    if (data && data.paymentmethods && data.paymentmethods.paymentmethod) {
        const methodsArray = Array.isArray(data.paymentmethods.paymentmethod) ? data.paymentmethods.paymentmethod : [data.paymentmethods.paymentmethod];
        return { paymentMethods: methodsArray.map((m: any) => ({ module: m.module, displayName: m.displayname })) };
    }
    return { paymentMethods: [] };
};
