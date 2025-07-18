


import type { User, Service, Domain, Invoice, Ticket, TicketReply, InvoiceStatus, TicketStatus, ServiceStatus, DomainStatus, ProductGroup, Product, ProductPricing, PricingCycleDetail, DomainSearchResult, DomainConfiguration, PaymentMethod } from '@/types';
import { format, subDays, addDays, addMonths } from 'date-fns';

// --- MOCK DATA SETUP ---
// This file is currently configured to return mock data for local development.
// This allows UI/UX development without needing a live WHMCS connection.
// To switch to a live API, replace the functions below with calls to a real WHMCS API endpoint.

const MOCK_USERS: { [key: string]: User & { passwordHash: string } } = {
  '1': {
    id: '1',
    email: 'test.user@example.com',
    passwordHash: 'hashed_password123', // In a real app, never store plain text passwords
    firstName: 'John',
    lastName: 'Doe',
    companyName: 'Doe Industries',
    address1: '123 Mockingbird Lane',
    city: 'Anytown',
    state: 'Anystate',
    postcode: '12345',
    country: 'US',
    phoneNumber: '555-123-4567',
  },
};

const MOCK_SERVICES: Service[] = [
  { id: '101', name: 'Premium Web Hosting', status: 'Active', registrationDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'), nextDueDate: format(addDays(new Date(), 20), 'yyyy-MM-dd'), billingCycle: 'Monthly', amount: '$15.00 USD', domain: 'mycoolwebsite.com', diskusage: '5120', disklimit: '20480', bwusage: '15360', bwlimit: '102400', lastupdate: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: '102', name: 'Basic VPS', status: 'Suspended', registrationDate: format(subDays(new Date(), 180), 'yyyy-MM-dd'), nextDueDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'), billingCycle: 'Quarterly', amount: '$45.00 USD', domain: 'dev.mycoolwebsite.com', diskusage: '10240', disklimit: '51200', bwusage: '81920', bwlimit: '1048576', lastupdate: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: '103', name: 'Domain Registration', status: 'Active', registrationDate: format(subDays(new Date(), 365), 'yyyy-MM-dd'), nextDueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'), billingCycle: 'Annually', amount: '$12.99 USD', domain: 'anotherdomain.net' },
  { id: '104', name: 'Business Email Hosting', status: 'Terminated', registrationDate: format(subDays(new Date(), 700), 'yyyy-MM-dd'), nextDueDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'), billingCycle: 'Monthly', amount: '$5.00 USD', domain: 'contact@anotherdomain.net' },
];

const MOCK_DOMAINS: Domain[] = [
    { id: '201', domainName: 'mycoolwebsite.com', status: 'Active', registrationDate: format(subDays(new Date(), 400), 'yyyy-MM-dd'), expiryDate: format(addDays(new Date(), 300), 'yyyy-MM-dd'), registrar: 'Enom', nameservers: ['ns1.snbdhost.com', 'ns2.snbdhost.com'], firstPaymentAmount: '৳1,547.00 BDT', recurringAmount: '৳1,547.00 BDT', paymentMethod: 'bKash Merchant', sslStatus: 'Active', registrarLock: true, registrarLockStatus: 'Locked' },
    { id: '202', domainName: 'anotherdomain.net', status: 'Expired', registrationDate: format(subDays(new Date(), 800), 'yyyy-MM-dd'), expiryDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'), registrar: 'Namecheap', nameservers: ['dns1.namecheap.com', 'dns2.namecheap.com'], firstPaymentAmount: '৳1,200.00 BDT', recurringAmount: '৳1,200.00 BDT', paymentMethod: 'Stripe', sslStatus: 'No SSL Detected', registrarLock: false, registrarLockStatus: 'Unlocked'},
    { id: '203', domainName: 'newproject.dev', status: 'Pending', registrationDate: format(new Date(), 'yyyy-MM-dd'), expiryDate: format(addDays(new Date(), 365), 'yyyy-MM-dd'), registrar: 'GoDaddy', nameservers: ['ns1.godaddy.com', 'ns2.godaddy.com', 'ns3.godaddy.com'], firstPaymentAmount: '৳0.00 BDT', recurringAmount: '৳999.00 BDT', paymentMethod: 'PayPal', sslStatus: 'No SSL Detected', registrarLock: true, registrarLockStatus: 'Locked' },
];

const MOCK_INVOICES: Invoice[] = [
    { id: '301', invoiceNumber: 'INV-001', dateCreated: format(subDays(new Date(), 45), 'yyyy-MM-dd'), dueDate: format(subDays(new Date(), 15), 'yyyy-MM-dd'), total: '$15.00 USD', status: 'Paid', items: [{description: 'Premium Web Hosting', amount: '$15.00'}] },
    { id: '302', invoiceNumber: 'INV-002', dateCreated: format(subDays(new Date(), 15), 'yyyy-MM-dd'), dueDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'), total: '$60.00 USD', status: 'Unpaid', items: [{description: 'Basic VPS', amount: '$45.00'}, {description: 'Domain Renewal', amount: '$15.00'}] },
    { id: '303', invoiceNumber: 'INV-003', dateCreated: format(subDays(new Date(), 75), 'yyyy-MM-dd'), dueDate: format(subDays(new Date(), 45), 'yyyy-MM-dd'), total: '$100.00 USD', status: 'Overdue', items: [{description: 'Dedicated Server Setup', amount: '$100.00'}] },
    { id: '304', invoiceNumber: 'INV-004', dateCreated: format(subDays(new Date(), 100), 'yyyy-MM-dd'), dueDate: format(subDays(new Date(), 70), 'yyyy-MM-dd'), total: '$25.00 USD', status: 'Cancelled', items: [{description: 'SSL Certificate', amount: '$25.00'}] },
];

const MOCK_TICKETS: { [key: string]: Ticket } = {
    '1': {
        id: '1', ticketNumber: 'ABC-12345', subject: 'My website is slow', department: 'Technical Support', status: 'Answered', lastUpdated: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm'), dateOpened: format(subDays(new Date(), 2), 'yyyy-MM-dd'), priority: 'Medium',
        replies: [
            { id: 'r1', author: 'Client', message: 'Hello, my website seems to be loading very slowly today. Can you please check?', date: format(subDays(new Date(), 2), 'yyyy-MM-dd HH:mm') },
            { id: 'r2', author: 'Support Staff', message: 'Hi John, thank you for reaching out. We have checked your server and optimized your database. Please let us know if you see an improvement.', date: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm') },
        ]
    },
    '2': { id: '2', ticketNumber: 'DEF-67890', subject: 'Billing question', department: 'Billing', status: 'Closed', lastUpdated: format(subDays(new Date(), 10), 'yyyy-MM-dd HH:mm'), dateOpened: format(subDays(new Date(), 12), 'yyyy-MM-dd'), priority: 'Low', replies: [] },
    '3': { id: '3', ticketNumber: 'GHI-11223', subject: 'New service inquiry', department: 'Sales', status: 'Customer-Reply', lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm'), dateOpened: format(new Date(), 'yyyy-MM-dd'), priority: 'High', replies: [] },
};

const MOCK_PRODUCT_GROUPS: ProductGroup[] = [
    { id: '1', name: 'Shared Hosting' },
    { id: '2', name: 'Reseller Hosting' },
    { id: '3', name: 'VPS Servers' },
];

const MOCK_PRODUCTS: Product[] = [
    { pid: '1', gid: '1', groupname: 'Shared Hosting', type: 'hostingaccount', name: 'Starter Plan', description: '<ul><li>10 GB SSD Storage</li><li>100 GB Bandwidth</li><li>5 Email Accounts</li><li>Free SSL</li></ul>', paytype: 'recurring', pricing: {} as ProductPricing, parsedPricingCycles: [{ cycleName: 'Monthly', displayPrice: '$5.00 USD', whmcsCycle: 'monthly' }] },
    { pid: '2', gid: '1', groupname: 'Shared Hosting', type: 'hostingaccount', name: 'Business Plan', description: '<ul><li>50 GB SSD Storage</li><li>1 TB Bandwidth</li><li>Unlimited Emails</li><li>Free SSL &amp; Daily Backups</li></ul>', paytype: 'recurring', pricing: {} as ProductPricing, parsedPricingCycles: [{ cycleName: 'Annually', displayPrice: '$99.00 USD', whmcsCycle: 'annually' }] },
    { pid: '3', gid: '2', groupname: 'Reseller Hosting', type: 'reselleraccount', name: 'Reseller Basic', description: '<p>Start your own hosting business!</p>', paytype: 'recurring', pricing: {} as ProductPricing, parsedPricingCycles: [{ cycleName: 'Monthly', displayPrice: '$25.00 USD', whmcsCycle: 'monthly' }] },
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
    { module: 'paypal', displayName: 'PayPal' },
    { module: 'stripe', displayName: 'Credit/Debit Card (Stripe)' },
    { module: 'banktransfer', displayName: 'Bank Transfer' },
];

// --- MOCK API FUNCTIONS ---

export const validateLoginWHMCS = async (email: string, passwordAttempt: string): Promise<{ result: 'success' | 'error'; message?: string; userid?: string }> => {
  console.log(`[MOCK] Validating login for ${email}`);
  if (email === 'test.user@example.com' && passwordAttempt === 'password123') {
    return { result: 'success', userid: '1' };
  }
  return { result: 'error', message: 'Invalid credentials. Please try again.' };
};

export const addClientWHMCS = async (clientData: Omit<User, 'id'>): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
    console.log('[MOCK] Registering new client:', clientData.email);
    const newId = (Object.keys(MOCK_USERS).length + 1).toString();
    MOCK_USERS[newId] = { ...clientData, id: newId, passwordHash: "mock_hash" };
    return { result: 'success', userId: newId };
}

export const getUserDetailsWHMCS = async (userId: string): Promise<{ user?: User }> => {
    console.log(`[MOCK] Getting user details for userId: ${userId}`);
    if (MOCK_USERS[userId]) {
        return { user: MOCK_USERS[userId] };
    }
    return {};
};

export const getClientsProductsWHMCS = async (userId: string, serviceId?: string): Promise<{ services: Service[] }> => {
    console.log(`[MOCK] Getting products for userId: ${userId}`);
    if(serviceId) {
        return { services: MOCK_SERVICES.filter(s => s.id === serviceId) };
    }
    return { services: MOCK_SERVICES };
};

export const getDomainsWHMCS = async (userId: string): Promise<{ domains: Domain[] }> => {
    console.log(`[MOCK] Getting domains for userId: ${userId}`);
    return { domains: MOCK_DOMAINS };
};

export const getDomainDetailsWHMCS = async (domainId: string): Promise<{ domain?: Domain }> => {
    console.log(`[MOCK] Getting domain details for domainId: ${domainId}`);
    const domain = MOCK_DOMAINS.find(d => d.id === domainId);
    return { domain };
}

export const updateDomainNameserversWHMCS = async (domainId: string, nameservers: { [key: string]: string | undefined }): Promise<{ result: 'success' | 'error'; message?: string }> => {
    console.log(`[MOCK] Updating nameservers for domainId ${domainId} with`, nameservers);
    const domainIndex = MOCK_DOMAINS.findIndex(d => d.id === domainId);
    if (domainIndex > -1) {
        MOCK_DOMAINS[domainIndex].nameservers = Object.values(nameservers).filter(ns => ns) as string[];
        return { result: 'success' };
    }
    return { result: 'error', message: 'Domain not found in mock data.' };
}

export const updateRegistrarLockStatusWHMCS = async (domainId: string, newLockStatus: boolean): Promise<{ result: 'success' | 'error'; message?: string; newStatus?: 'Locked' | 'Unlocked' }> => {
    console.log(`[MOCK] Updating registrar lock for domainId ${domainId} to ${newLockStatus}`);
    const domainIndex = MOCK_DOMAINS.findIndex(d => d.id === domainId);
    if (domainIndex > -1) {
        MOCK_DOMAINS[domainIndex].registrarLock = newLockStatus;
        MOCK_DOMAINS[domainIndex].registrarLockStatus = newLockStatus ? 'Locked' : 'Unlocked';
        return { result: 'success', newStatus: MOCK_DOMAINS[domainIndex].registrarLockStatus };
    }
    return { result: 'error', message: 'Domain not found in mock data.' };
};

export const getInvoicesWHMCS = async (userId: string, statusFilter?: InvoiceStatus): Promise<{ invoices: Invoice[] }> => {
    console.log(`[MOCK] Getting invoices for userId: ${userId}`);
    if (statusFilter) {
        return { invoices: MOCK_INVOICES.filter(i => i.status === statusFilter) };
    }
    return { invoices: MOCK_INVOICES };
};

export const getTicketsWHMCS = async (userId: string, statusFilter: string = 'All Active'): Promise<{ tickets: Ticket[] }> => {
    console.log(`[MOCK] Getting tickets for userId: ${userId} with status: ${statusFilter}`);
    return { tickets: Object.values(MOCK_TICKETS) };
};

export const getTicketByIdWHMCS = async (ticketId: string): Promise<{ ticket?: Ticket }> => {
    console.log(`[MOCK] Getting ticket details for ticketId: ${ticketId}`);
    return { ticket: MOCK_TICKETS[ticketId] };
};

export const openTicketWHMCS = async (ticketData: { subject: string }): Promise<{ result: 'success' | 'error'; message?: string; ticketId?: string; ticketNumber?: string; }> => {
    console.log('[MOCK] Opening new ticket:', ticketData.subject);
    const newId = (Object.keys(MOCK_TICKETS).length + 1).toString();
    const newTicketNumber = `XYZ-${Math.floor(Math.random() * 90000) + 10000}`;
    return { result: 'success', ticketId: newId, ticketNumber: newTicketNumber };
}

export const replyToTicketWHMCS = async (replyData: { ticketid: string; message: string; }): Promise<{ result: 'success' | 'error'; message?: string; reply?: TicketReply }> => {
    console.log(`[MOCK] Replying to ticket ${replyData.ticketid}`);
    const newReply: TicketReply = {
        id: `r${Math.random()}`,
        author: 'Client',
        message: replyData.message,
        date: format(new Date(), 'yyyy-MM-dd HH:mm'),
    };
    return { result: 'success', reply: newReply };
}

export const resendVerificationEmailWHMCS = async (userId: string): Promise<{ result: 'success' | 'error'; message?: string; }> => {
    console.log(`[MOCK] Resending verification email for userId: ${userId}`);
    return { result: 'success', message: 'Verification email resent successfully.' };
}

export const createSsoTokenWHMCS = async (params: { clientid?: string; service_id?: number; }): Promise<{ result: 'success' | 'error'; redirect_url?: string }> => {
    console.log(`[MOCK] Creating SSO token for service ${params.service_id}`);
    return { result: 'success', redirect_url: 'https://example.com/mock-cpanel-login' };
}

export const addFundsWHMCS = async (userId: string, amount: number, paymentMethodGateway: string): Promise<{ result: 'success' | 'error'; invoiceId?: string; paymentUrl?: string }> => {
    console.log(`[MOCK] Adding ${amount} funds for user ${userId} via ${paymentMethodGateway}`);
    const newInvoiceId = (MOCK_INVOICES.length + 400).toString();
    return { result: 'success', invoiceId: newInvoiceId, paymentUrl: `/billing` };
}

export const getProductGroupsWHMCS = async (): Promise<{ groups: ProductGroup[] }> => {
    console.log(`[MOCK] Getting product groups`);
    return { groups: MOCK_PRODUCT_GROUPS };
}

export const getProductsWHMCS = async (gid?: string): Promise<{ products: Product[] }> => {
    console.log(`[MOCK] Getting products for gid: ${gid || 'all'}`);
    if (gid) {
        return { products: MOCK_PRODUCTS.filter(p => p.gid === gid) };
    }
    return { products: MOCK_PRODUCTS };
}

export const domainWhoisWHMCS = async (domain: string): Promise<{ result: DomainSearchResult }> => {
    console.log(`[MOCK] Checking domain: ${domain}`);
    const isTaken = MOCK_DOMAINS.some(d => d.domainName.toLowerCase() === domain.toLowerCase());
    return { 
        result: {
            domainName: domain,
            status: isTaken ? 'unavailable' : 'available',
            pricing: { register: '10.99', period: '1' }
        }
    };
}

export const addDomainOrderWHMCS = async (userId: string, config: DomainConfiguration, paymentMethod: string): Promise<{ result: 'success' | 'error'; orderid?: string; invoiceid?: string }> => {
    console.log(`[MOCK] Ordering domain ${config.domainName} for user ${userId}`);
    return { result: 'success', orderid: 'ORD-555', invoiceid: 'INV-555' };
}

export const getPaymentMethodsWHMCS = async (): Promise<{ paymentMethods: PaymentMethod[] }> => {
    console.log('[MOCK] Getting payment methods');
    return { paymentMethods: MOCK_PAYMENT_METHODS };
}

// Keep the real API call function for easy switching back in the future
export async function callWhmcsApi(action: string, params: Record<string, any> = {}): Promise<any> {
    console.error("[DEV WARNING] callWhmcsApi should not be executed in mock mode. Check your logic.");
    // In mock mode, we just return an error to prevent accidental live calls.
    return { result: 'error', message: 'Function not implemented in mock mode.' };
}
