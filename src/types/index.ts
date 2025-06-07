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

export type ServiceStatus = 'Active' | 'Suspended' | 'Terminated' | 'Pending' | 'Cancelled';

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
}

export type DomainStatus = 'Active' | 'Pending' | 'Expired' | 'Transferred Away';

export interface Domain {
  id: string;
  domainName: string;
  status: DomainStatus;
  registrationDate: string;
  expiryDate: string;
  registrar: string;
  nameservers: string[];
}

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Cancelled' | 'Overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  dateCreated: string;
  dueDate: string;
  total: string; // e.g., "$25.00 USD"
  status: InvoiceStatus;
  items: Array<{ description: string; amount: string }>;
}

export type TicketStatus = 'Open' | 'Answered' | 'Customer-Reply' | 'Closed' | 'In Progress';

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
