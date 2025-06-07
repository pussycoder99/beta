
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
  id: string;
  name: string;
  headline?: string;
  tagline?: string;
  order: number;
  // Add other fields as returned by WHMCS GetProductGroups
}

// Represents the pricing for a single currency and cycle
export interface ProductPrice {
  cycle: string; // e.g., 'monthly', 'annually', 'biennially'
  price: string; // e.g., "10.00"
  setupfee: string; // e.g., "0.00"
}

// Pricing details for a product, keyed by currency code
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

export interface ProductFeature {
  [featureName: string]: string; // WHMCS often returns features as key-value pairs
}


export interface Product {
  pid: string;
  gid: string;
  type: string; // e.g., 'hostingaccount', 'reselleraccount', 'server', 'other'
  name: string;
  description: string; // HTML content
  module: string; // Server module, e.g., 'cpanel', 'plesk'
  paytype: 'free' | 'onetime' | 'recurring';
  pricing: ProductPricing; // Complex object, see WHMCS GetProducts API response
  features?: ProductFeature; // Features array/object from WHMCS (e.g. disk space, bandwidth)
  // Store a more structured simple price for display
  displayPrice?: string; // e.g., "$10.00/month"
  featureDescription?: string[]; // Parsed features for easier display
  // Add other fields as needed from WHMCS GetProducts response
  // e.g., hidden, showdomainoptions, welcomeemail, stockcontrol, qty, etc.
}
