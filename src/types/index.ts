





export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  address1?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phoneNumber?: string;
}

export type ServiceStatus = 'Active' | 'Suspended' | 'Terminated' | 'Pending' | 'Cancelled' | 'Fraud';

export interface Service {
  id: string;
  name: string;
  status: ServiceStatus;
  registrationDate: string;
  nextDueDate: string;
  billingCycle: string;
  amount: string; // e.g., "$10.00 USD"
  serverInfo?: {
    hostname: string;
    ipAddress: string;
  };
  domain?: string;
  // For usage statistics, directly from WHMCS GetClientsProducts
  diskusage?: string; // e.g., "100 MB" or "100"
  disklimit?: string; // e.g., "1000 MB" or "1000" or "0" (Unlimited)
  bwusage?: string;   // e.g., "5000 MB" or "5000"
  bwlimit?: string;   // e.g., "100000 MB" or "100000" or "0" (Unlimited)
  lastupdate?: string; // Timestamp of last usage update
  username?: string; // Control panel username
  // Calculated fields for UI
  diskUsagePercent?: number;
  bandwidthUsagePercent?: number;
  diskUsageRaw?: string;
  bandwidthUsageRaw?: string;
  controlPanelLink?: string; // For SSO
}

export type DomainStatus = 'Active' | 'Pending' | 'Expired' | 'Transferred Away' | 'Grace' | 'Redemption';

export interface Domain {
  id: string;
  domainName: string;
  status: DomainStatus;
  registrationDate: string;
  expiryDate: string;
  registrar: string;
  nameservers: string[];
  // New fields for Overview page
  firstPaymentAmount: string;
  recurringAmount: string;
  paymentMethod: string;
  sslStatus: 'Active' | 'No SSL Detected';
  registrarLock: boolean;
  registrarLockStatus: 'Locked' | 'Unlocked';
}

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Cancelled' | 'Overdue' | 'Refunded' | 'Collections';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  dateCreated: string;
  dueDate: string;
  total: string; // e.g., "$25.00 USD"
  status: InvoiceStatus;
  items: Array<{ description: string; amount: string }>;
}

export type TicketStatus = 'Open' | 'Answered' | 'Customer-Reply' | 'Closed' | 'In Progress' | 'On Hold';

export interface TicketReply {
  id: string;
  author: 'Client' | 'Support Staff';
  message: string;
  date: string;
  attachments?: string[];
}
export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  department: string;
  status: TicketStatus;
  lastUpdated: string;
  dateOpened: string;
  priority: 'Low' | 'Medium' | 'High';
  replies?: TicketReply[];
}

export interface ProductGroup {
  id: string; // This will be the 'gid'
  name: string; // This will be the 'groupname'
  headline?: string; 
  tagline?: string; 
  order?: number; 
}

export interface ProductPricing {
  [currencyCode: string]: {
    prefix: string;
    suffix: string;
    msetupfee: string;
    qsetupfee: string;
    ssetupfee: string;
    asetupfee: string;
    bsetupfee: string;
    tsetupfee: string;
    monthly: string;
    quarterly: string;
    semiannually: string;
    annually: string;
    biennially: string;
    triennially: string;
  };
}

export interface PricingCycleDetail {
  cycleName: string; // e.g., "Monthly", "Annually"
  displayPrice: string; // e.g., "$10.00 USD /mo"
  whmcsCycle: string; // e.g., "monthly", "annually" - for cart link
  setupFee?: string; // e.g., "$5.00 Setup"
}

export interface Product {
  pid: string;
  gid: string;
  groupname?: string; // Important for deriving groups
  type: string;
  name: string;
  slug?: string;
  "product-url"?: string;
  description: string; // HTML content
  module: string;
  paytype: 'free' | 'onetime' | 'recurring';
  pricing: ProductPricing;
  parsedPricingCycles: PricingCycleDetail[]; // For the pricing dropdown
  allowqty?: number;
  quantity_available?: number;
}

export interface DomainSearchResult {
  domainName: string;
  status: 'available' | 'unavailable' | 'error';
  pricing?: {
    register: string; // "10.99"
    period: string; // "1"
  };
  errorMessage?: string;
}

export interface DomainConfiguration {
    domainName: string;
    registrationPeriod: number; // in years, e.g., 1, 2
    idProtection: boolean;
    dnsManagement: boolean;
    emailForwarding: boolean;
    nameservers: {
        ns1: string;
        ns2: string;
        ns3?: string;
        ns4?: string;
    };
}

export interface PaymentMethod {
  module: string;
  displayName: string;
}
