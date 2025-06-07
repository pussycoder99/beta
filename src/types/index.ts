
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

// This represents a more abstract view of features for display,
// but GetProducts returns customfields and configoptions directly.
// For the order page, we will primarily rely on the product's main description.
export interface ProductFeature {
  [featureName: string]: string; 
}


export interface Product {
  pid: string;
  gid: string;
  type: string; 
  name: string;
  slug?: string; // Added from WHMCS GetProducts API example
  "product-url"?: string; // Added from WHMCS GetProducts API example
  description: string; // HTML content
  module: string; 
  paytype: 'free' | 'onetime' | 'recurring';
  pricing: ProductPricing; 
  // Custom fields and config options can be complex; for now, focusing on main description
  // features?: ProductFeature; // Simplified: rely on description
  displayPrice?: string; 
  allowqty?: number; // Added from WHMCS GetProducts API example
  quantity_available?: number; // Added from WHMCS GetProducts API example
  // customfields and configoptions are available in the raw WHMCS data if needed for deep parsing
}
