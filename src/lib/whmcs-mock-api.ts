
import type { User, Service, Domain, Invoice, Ticket, TicketReply, InvoiceStatus, TicketStatus, ServiceStatus, DomainStatus, ProductGroup, Product, ProductPricing, PricingCycleDetail, DomainSearchResult, DomainConfiguration, PaymentMethod } from '@/types';
import { format, subDays, addDays, addMonths } from 'date-fns';

// --- MOCK DATA ---

const MOCK_USER: User = {
  id: '1',
  email: 'test.user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  companyName: 'Doe Enterprises',
  address1: '123 Mockingbird Lane',
  city: 'Techville',
  state: 'CA',
  postcode: '90210',
  country: 'US',
  phoneNumber: '800-555-1234',
};

const MOCK_SERVICES: Service[] = [
  {
    id: '101',
    name: 'Premium Web Hosting',
    status: 'Active',
    registrationDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    nextDueDate: format(addDays(new Date(), 20), 'yyyy-MM-dd'),
    billingCycle: 'Monthly',
    amount: '$10.00 USD',
    domain: 'my-awesome-site.com',
    diskusage: '512',
    disklimit: '2048',
    bwusage: '15360',
    bwlimit: '102400',
    lastupdate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    serverInfo: { hostname: 'server1.snbdhost.com', ipAddress: '192.168.1.1' },
    username: 'johndoe',
  },
  {
    id: '102',
    name: 'Basic VPS',
    status: 'Suspended',
    registrationDate: format(subDays(new Date(), 180), 'yyyy-MM-dd'),
    nextDueDate: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    billingCycle: 'Quarterly',
    amount: '$25.00 USD',
    domain: 'dev-server.net',
  },
   {
    id: '103',
    name: 'Sitejet Pro Builder',
    status: 'Active',
    registrationDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    nextDueDate: format(addDays(new Date(), 25), 'yyyy-MM-dd'),
    billingCycle: 'Annually',
    amount: '$99.00 USD',
    domain: 'my-portfolio.xyz',
  },
  {
    id: '104',
    name: 'Domain Registration',
    status: 'Terminated',
    registrationDate: format(subDays(new Date(), 400), 'yyyy-MM-dd'),
    nextDueDate: format(subDays(new Date(), 35), 'yyyy-MM-dd'),
    billingCycle: 'Annually',
    amount: '$15.00 USD',
    domain: 'old-project.com',
  },
];

const MOCK_DOMAINS: Domain[] = [
    { id: '201', domainName: 'my-awesome-site.com', status: 'Active', registrationDate: format(subDays(new Date(), 300), 'yyyy-MM-dd'), expiryDate: format(addDays(new Date(), 65), 'yyyy-MM-dd'), registrar: 'Enom', nameservers: ['ns1.snbdhost.com', 'ns2.snbdhost.com']},
    { id: '202', domainName: 'dev-server.net', status: 'Expired', registrationDate: format(subDays(new Date(), 730), 'yyyy-MM-dd'), expiryDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'), registrar: 'Enom', nameservers: ['ns1.expired.com', 'ns2.expired.com']},
    { id: '203', domainName: 'my-portfolio.xyz', status: 'Active', registrationDate: format(subDays(new Date(), 50), 'yyyy-MM-dd'), expiryDate: format(addDays(new Date(), 315), 'yyyy-MM-dd'), registrar: 'ResellerClub', nameservers: ['ns1.snbdhost.com', 'ns2.snbdhost.com']},
];

const MOCK_INVOICES: Invoice[] = [
    { id: '301', invoiceNumber: 'INV-2024-001', dateCreated: format(subDays(new Date(), 40), 'yyyy-MM-dd'), dueDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'), total: '$25.00 USD', status: 'Paid', items: [{description: 'Basic VPS - Quarterly', amount: '$25.00 USD'}] },
    { id: '302', invoiceNumber: 'INV-2024-002', dateCreated: format(subDays(new Date(), 15), 'yyyy-MM-dd'), dueDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'), total: '$10.00 USD', status: 'Unpaid', items: [{description: 'Premium Web Hosting - Monthly', amount: '$10.00 USD'}] },
    { id: '303', invoiceNumber: 'INV-2024-003', dateCreated: format(subDays(new Date(), 5), 'yyyy-MM-dd'), dueDate: format(addDays(new Date(), 25), 'yyyy-MM-dd'), total: '$10.99 USD', status: 'Unpaid', items: [{description: 'Domain Registration - mynewdomain.com', amount: '$10.99 USD'}] },
    { id: '304', invoiceNumber: 'INV-2023-105', dateCreated: format(subDays(new Date(), 90), 'yyyy-MM-dd'), dueDate: format(subDays(new Date(), 60), 'yyyy-MM-dd'), total: '$150.00 USD', status: 'Cancelled', items: [{description: 'Dedicated Server - Annual', amount: '$150.00 USD'}] },
];

const MOCK_TICKETS: Ticket[] = [
    { id: '401', ticketNumber: 'ABC-12345', subject: 'My website is running slow', department: 'Technical Support', status: 'Answered', lastUpdated: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'), dateOpened: format(subDays(new Date(), 2), 'yyyy-MM-dd'), priority: 'Medium'},
    { id: '402', ticketNumber: 'DEF-67890', subject: 'Question about billing', department: 'Billing', status: 'Closed', lastUpdated: format(subDays(new Date(), 10), 'yyyy-MM-dd HH:mm:ss'), dateOpened: format(subDays(new Date(), 12), 'yyyy-MM-dd'), priority: 'Low'},
    { id: '403', ticketNumber: 'GHI-11223', subject: 'Urgent: Cannot access cPanel', department: 'Technical Support', status: 'Open', lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss'), dateOpened: format(new Date(), 'yyyy-MM-dd'), priority: 'High'},
];

const MOCK_PRODUCT_GROUPS: ProductGroup[] = [
    { id: '1', name: 'Shared Hosting', headline: 'Powerful & Affordable', tagline: 'Perfect for getting started.', order: 1 },
    { id: '2', name: 'Reseller Hosting', headline: 'Start Your Own Business', tagline: 'Host multiple clients.', order: 2 },
    { id: '3', name: 'VPS Hosting', headline: 'Dedicated Power', tagline: 'For high-traffic sites.', order: 3 },
];

const MOCK_PRODUCTS: Product[] = [
    // Shared Hosting
    { pid: '1', gid: '1', groupname: 'Shared Hosting', type: 'hostingaccount', name: 'Starter Plan', description: '<p>Great for small websites and blogs.</p><ul><li>10GB SSD Storage</li><li>100GB Bandwidth</li><li>10 Email Accounts</li></ul>', module: 'cpanel', paytype: 'recurring', pricing: {}, parsedPricingCycles: [{ cycleName: 'Monthly', displayPrice: '$5.00 USD Monthly', whmcsCycle: 'monthly' }, { cycleName: 'Annually', displayPrice: '$50.00 USD Annually', whmcsCycle: 'annually' }] },
    { pid: '2', gid: '1', groupname: 'Shared Hosting', type: 'hostingaccount', name: 'Business Plan', description: '<p>More power for growing businesses.</p><ul><li>50GB SSD Storage</li><li>500GB Bandwidth</li><li>Unlimited Email Accounts</li></ul>', module: 'cpanel', paytype: 'recurring', pricing: {}, parsedPricingCycles: [{ cycleName: 'Monthly', displayPrice: '$10.00 USD Monthly', whmcsCycle: 'monthly' }, { cycleName: 'Annually', displayPrice: '$100.00 USD Annually', whmcsCycle: 'annually' }] },
    // Reseller Hosting
    { pid: '3', gid: '2', groupname: 'Reseller Hosting', type: 'reselleraccount', name: 'Reseller Alpha', description: '<p>Start your hosting business.</p><ul><li>100GB SSD Storage</li><li>1TB Bandwidth</li><li>25 cPanel Accounts</li></ul>', module: 'cpanel', paytype: 'recurring', pricing: {}, parsedPricingCycles: [{ cycleName: 'Monthly', displayPrice: '$25.00 USD Monthly', whmcsCycle: 'monthly' }] },
    // VPS Hosting
    { pid: '4', gid: '3', groupname: 'VPS Hosting', type: 'hostingaccount', name: 'VPS Level 1', description: '<p>Full root access and dedicated resources.</p><ul><li>2 Core CPU</li><li>4GB RAM</li><li>100GB NVMe SSD</li></ul>', module: 'cpanel', paytype: 'recurring', pricing: {}, parsedPricingCycles: [{ cycleName: 'Monthly', displayPrice: '$40.00 USD Monthly', whmcsCycle: 'monthly' }] },
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
    { module: 'paypalcheckout', displayName: 'PayPal' },
    { module: 'stripe', displayName: 'Credit Card (Stripe)' },
    { module: 'mailinpayment', displayName: 'Bank Transfer' },
];


// --- MOCK API FUNCTIONS ---

export const validateLoginWHMCS = async (email: string, passwordAttempt: string): Promise<{ result: 'success' | 'error'; message?: string; userid?: string }> => {
  console.log('[MOCK API] Validating login for:', email);
  if (email === 'test.user@example.com' && passwordAttempt === 'password123') {
    return { result: 'success', userid: MOCK_USER.id };
  }
  return { result: 'error', message: 'Invalid credentials. Use test.user@example.com and password123.' };
};

export const addClientWHMCS = async (clientData: Omit<User, 'id'> & {password?: string}): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
    console.log('[MOCK API] Adding client:', clientData.email);
    return { result: 'success', userId: `mock-${Date.now()}`};
}


export const getUserDetailsWHMCS = async (userId: string): Promise<{ user?: User }> => {
  console.log('[MOCK API] Getting details for user:', userId);
  return { user: MOCK_USER };
};

export const getClientsProductsWHMCS = async (userId: string, serviceId?: string): Promise<{ services: Service[] }> => {
  console.log(`[MOCK API] Getting products for user: ${userId}, service: ${serviceId || 'all'}`);
  if (serviceId) {
    const service = MOCK_SERVICES.find(s => s.id === serviceId);
    return { services: service ? [service] : [] };
  }
  return { services: MOCK_SERVICES };
};

export const getDomainsWHMCS = async (userId: string): Promise<{ domains: Domain[] }> => {
  console.log('[MOCK API] Getting domains for user:', userId);
  return { domains: MOCK_DOMAINS };
};

export const getInvoicesWHMCS = async (userId: string, statusFilter?: InvoiceStatus): Promise<{ invoices: Invoice[] }> => {
  console.log(`[MOCK API] Getting invoices for user: ${userId}, status: ${statusFilter || 'all'}`);
  if (statusFilter) {
    return { invoices: MOCK_INVOICES.filter(i => i.status === statusFilter) };
  }
  return { invoices: MOCK_INVOICES };
};

export const getTicketsWHMCS = async (userId: string, statusFilter: string = 'All Active'): Promise<{ tickets: Ticket[] }> => {
    console.log(`[MOCK API] Getting tickets for user: ${userId}, status: ${statusFilter}`);
    if (statusFilter === 'All Active') {
        const activeStatuses: TicketStatus[] = ['Open', 'Answered', 'Customer-Reply', 'In Progress', 'On Hold'];
        return { tickets: MOCK_TICKETS.filter(t => activeStatuses.includes(t.status)) };
    }
    return { tickets: MOCK_TICKETS };
};

export const getTicketByIdWHMCS = async (ticketId: string): Promise<{ ticket?: Ticket }> => {
  console.log('[MOCK API] Getting ticket by ID:', ticketId);
  const ticket = MOCK_TICKETS.find(t => t.id === ticketId);
  if (ticket) {
    return {
      ticket: {
        ...ticket,
        replies: [
          { id: 'r1', author: 'Client', message: 'Hello, my website is running very slow today. Can you please check?', date: format(subDays(new Date(), 2), 'yyyy-MM-dd HH:mm:ss') },
          { id: 'r2', author: 'Support Staff', message: 'Hello John,\n\nWe are looking into this for you. We have identified a heavy process running on the server and are working to resolve it. We will update you shortly.\n\nThanks,\nSupport Team', date: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss') },
        ]
      }
    };
  }
  return { ticket: undefined };
};

export const openTicketWHMCS = async (ticketData: { clientid: string; deptname: string; subject: string; message: string; priority: 'Low' | 'Medium' | 'High'; }): Promise<{ result: 'success' | 'error'; message?: string; ticketId?: string; ticketNumber?: string; }> => {
    console.log('[MOCK API] Opening new ticket:', ticketData.subject);
    const newTicketId = `mock-${Date.now()}`;
    const newTicketNum = `MOC-${Math.floor(Math.random() * 90000) + 10000}`;
    return { result: 'success', ticketId: newTicketId, ticketNumber: newTicketNum };
}

export const replyToTicketWHMCS = async (replyData: { ticketid: string; message: string; }): Promise<{ result: 'success' | 'error'; message?: string; reply?: TicketReply }> => {
    console.log(`[MOCK API] Replying to ticket ${replyData.ticketid}`);
    const newReply: TicketReply = {
        id: `mock-reply-${Date.now()}`,
        author: 'Client',
        message: replyData.message,
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
    return { result: 'success', reply: newReply };
}

export const resendVerificationEmailWHMCS = async (userId: string): Promise<{ result: 'success' | 'error'; message?: string; }> => {
    console.log(`[MOCK API] Resending verification email for user ${userId}`);
    // Simulate a successful API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return { result: 'success', message: 'Verification email sent successfully from mock API.' };
}

export const createSsoTokenWHMCS = async (params: { clientid?: string; service_id?: number; }): Promise<{ result: 'success' | 'error'; redirect_url?: string }> => {
    console.log(`[MOCK API] Creating SSO token for service ${params.service_id}`);
    return { result: 'success', redirect_url: `https://your-cpanel-url.com/mock-sso-login/${Date.now()}`};
}

export const addFundsWHMCS = async (userId: string, amount: number, paymentMethodGateway: string): Promise<{ result: 'success' | 'error'; invoiceId?: string; paymentUrl?: string }> => {
    console.log(`[MOCK API] Adding funds for user ${userId}, amount ${amount}, via ${paymentMethodGateway}`);
    const newInvoiceId = `mock-inv-${Date.now()}`;
    return { result: 'success', invoiceId: newInvoiceId, paymentUrl: `/billing` };
}

export const getProductGroupsWHMCS = async (): Promise<{ groups: ProductGroup[] }> => {
    console.log(`[MOCK API] Getting product groups.`);
    return { groups: MOCK_PRODUCT_GROUPS };
}

export const getProductsWHMCS = async (gid?: string): Promise<{ products: Product[] }> => {
    console.log(`[MOCK API] Getting products for GID: ${gid || 'all'}`);
    if (gid) {
        return { products: MOCK_PRODUCTS.filter(p => p.gid === gid) };
    }
    return { products: MOCK_PRODUCTS };
}

export const domainWhoisWHMCS = async (domain: string): Promise<{ result: DomainSearchResult }> => {
    console.log(`[MOCK API] Checking WHOIS for domain: ${domain}`);
    const isTaken = MOCK_DOMAINS.some(d => d.domainName.toLowerCase() === domain.toLowerCase());
    if (isTaken) {
        return { result: { domainName: domain, status: 'unavailable' } };
    }
    return { result: { domainName: domain, status: 'available', pricing: { register: '10.99', period: '1' } } };
}

export const addDomainOrderWHMCS = async (userId: string, config: DomainConfiguration, paymentMethod: string): Promise<{ result: 'success' | 'error'; orderid?: string; invoiceid?: string }> => {
    console.log(`[MOCK API] Adding domain order for ${config.domainName} by user ${userId}`);
    const orderId = `mock-ord-${Date.now()}`;
    const invoiceId = `mock-inv-${Date.now()}`;
    return { result: 'success', orderid: orderId, invoiceid: invoiceId };
}

export const getPaymentMethodsWHMCS = async (): Promise<{ paymentMethods: PaymentMethod[] }> => {
    console.log(`[MOCK API] Getting payment methods.`);
    return { paymentMethods: MOCK_PAYMENT_METHODS };
}

// Keep the real callWhmcsApi function in case you want to switch back easily,
// but it won't be called by any of the mock functions above.
export async function callWhmcsApi(action: string, params: Record<string, any> = {}): Promise<any> {
    // This is the real implementation, but it will not be used while mocks are active.
    // We can keep it here for easy switching back to live mode.
    console.warn(`[MOCK API MODE] Real callWhmcsApi called for action "${action}", but it's disabled. Returning empty success to prevent crashes.`);
    return { result: 'success' };
}
