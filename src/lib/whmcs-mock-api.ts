import type { User, Service, Domain, Invoice, Ticket, TicketReply, ServiceStatus, DomainStatus, InvoiceStatus, TicketStatus } from '@/types';
import { add, format } from 'date-fns';

// Simulate API call delay
const MOCK_API_DELAY = 500; // 0.5 seconds

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let mockUsers: User[] = [
  { id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe', companyName: 'Test Inc.', address1: '123 Main St', city: 'Anytown', state: 'CA', postcode: '90210', country: 'US', phoneNumber: '555-1234' }
];

let mockServices: Service[] = [
  { id: 's1', name: 'Basic Web Hosting', status: 'Active', registrationDate: format(new Date(2023, 0, 15), 'yyyy-MM-dd'), nextDueDate: format(add(new Date(), { months: 1 }), 'yyyy-MM-dd'), billingCycle: 'Monthly', amount: '$10.00 USD', userId: '1', domain: 'example.com', serverInfo: { hostname: 'server1.snbdhost.com', ipAddress: '192.168.1.100' } },
  { id: 's2', name: 'VPS Level 2', status: 'Active', registrationDate: format(new Date(2022, 5, 10), 'yyyy-MM-dd'), nextDueDate: format(add(new Date(), { days: 15 }), 'yyyy-MM-dd'), billingCycle: 'Annually', amount: '$120.00 USD', userId: '1' },
  { id: 's3', name: 'Email Hosting', status: 'Suspended', registrationDate: format(new Date(2023, 2, 1), 'yyyy-MM-dd'), nextDueDate: format(new Date(2024, 2, 1), 'yyyy-MM-dd'), billingCycle: 'Monthly', amount: '$5.00 USD', userId: '1' },
];

let mockDomains: Domain[] = [
  { id: 'd1', domainName: 'example.com', status: 'Active', registrationDate: format(new Date(2023, 0, 1), 'yyyy-MM-dd'), expiryDate: format(add(new Date(), { years: 1, days: -30 }), 'yyyy-MM-dd'), registrar: 'SNBD Registrar', nameservers: ['ns1.snbdhost.com', 'ns2.snbdhost.com'], userId: '1' },
  { id: 'd2', domainName: 'anotherdomain.net', status: 'Expired', registrationDate: format(new Date(2022, 3, 20), 'yyyy-MM-dd'), expiryDate: format(new Date(2023, 3, 20), 'yyyy-MM-dd'), registrar: 'SNBD Registrar', nameservers: ['ns1.example.com', 'ns2.example.com'], userId: '1' },
];

let mockInvoices: Invoice[] = [
  { id: 'inv1', invoiceNumber: 'SNBD-2024-001', dateCreated: format(add(new Date(), { months: -1 }), 'yyyy-MM-dd'), dueDate: format(add(new Date(), { days: 5 }), 'yyyy-MM-dd'), total: '$10.00 USD', status: 'Unpaid', items: [{ description: 'Basic Web Hosting (01/01/2024 - 31/01/2024)', amount: '$10.00 USD' }], userId: '1' },
  { id: 'inv2', invoiceNumber: 'SNBD-2023-150', dateCreated: format(add(new Date(), { months: -2 }), 'yyyy-MM-dd'), dueDate: format(add(new Date(), { months: -2, days: 15 }), 'yyyy-MM-dd'), total: '$120.00 USD', status: 'Paid', items: [{ description: 'VPS Level 2 (01/06/2023 - 31/05/2024)', amount: '$120.00 USD' }], userId: '1' },
  { id: 'inv3', invoiceNumber: 'SNBD-2024-002', dateCreated: format(new Date(), 'yyyy-MM-dd'), dueDate: format(add(new Date(), { days: -2 }), 'yyyy-MM-dd'), total: '$5.00 USD', status: 'Overdue', items: [{ description: 'Email Hosting (01/02/2024 - 28/02/2024)', amount: '$5.00 USD' }], userId: '1' },
];

let mockTickets: Ticket[] = [
  { id: 't1', ticketNumber: 'SNBD-TKT-001', subject: 'Issue with website loading', department: 'Technical Support', status: 'Answered', lastUpdated: format(add(new Date(), { days: -1 }), 'yyyy-MM-dd HH:mm'), dateOpened: format(add(new Date(), { days: -2 }), 'yyyy-MM-dd HH:mm'), priority: 'High', userId: '1', replies: [
    { id: 'tr1-1', author: 'Client', message: 'My website is not loading, please help!', date: format(add(new Date(), { days: -2 }), 'yyyy-MM-dd HH:mm')},
    { id: 'tr1-2', author: 'Support Staff', message: 'We are looking into this for you. Can you provide more details?', date: format(add(new Date(), { days: -1 }), 'yyyy-MM-dd HH:mm')},
  ]},
  { id: 't2', ticketNumber: 'SNBD-TKT-002', subject: 'Billing query', department: 'Billing', status: 'Open', lastUpdated: format(add(new Date(), { hours: -2 }), 'yyyy-MM-dd HH:mm'), dateOpened: format(add(new Date(), { hours: -2 }), 'yyyy-MM-dd HH:mm'), priority: 'Medium', userId: '1', replies: [
     { id: 'tr2-1', author: 'Client', message: 'I have a question about my latest invoice.', date: format(add(new Date(), { hours: -2 }), 'yyyy-MM-dd HH:mm')},
  ]},
];


export const validateLoginAPI = async (email: string, passwordHash: string): Promise<{ result: 'success' | 'error'; message?: string; user?: User; token?: string }> => {
  await delay(MOCK_API_DELAY);
  const user = mockUsers.find(u => u.email === email);
  // In a real scenario, passwordHash would be validated against stored hash
  if (user && passwordHash) { // Simplified check
    return { result: 'success', user, token: `mock-jwt-token-for-${user.id}` };
  }
  return { result: 'error', message: 'Invalid email or password.' };
};

export const addClientAPI = async (clientData: Omit<User, 'id'>): Promise<{ result: 'success' | 'error'; message?: string; userId?: string }> => {
  await delay(MOCK_API_DELAY);
  if (mockUsers.some(u => u.email === clientData.email)) {
    return { result: 'error', message: 'Email address already exists.' };
  }
  const newUser: User = { ...clientData, id: (mockUsers.length + 1).toString() };
  mockUsers.push(newUser);
  return { result: 'success', userId: newUser.id };
};

export const getClientsProductsAPI = async (userId: string): Promise<{ services: Service[] }> => {
  await delay(MOCK_API_DELAY);
  return { services: mockServices.filter(s => (s as any).userId === userId) };
};

export const getDomainsAPI = async (userId: string): Promise<{ domains: Domain[] }> => {
  await delay(MOCK_API_DELAY);
  return { domains: mockDomains.filter(d => (d as any).userId === userId) };
};

export const getInvoicesAPI = async (userId: string): Promise<{ invoices: Invoice[] }> => {
  await delay(MOCK_API_DELAY);
  return { invoices: mockInvoices.filter(i => (i as any).userId === userId) };
};

export const getTicketsAPI = async (userId: string): Promise<{ tickets: Ticket[] }> => {
  await delay(MOCK_API_DELAY);
  return { tickets: mockTickets.filter(t => (t as any).userId === userId) };
};

export const getTicketByIdAPI = async (userId: string, ticketId: string): Promise<{ ticket?: Ticket }> => {
  await delay(MOCK_API_DELAY);
  const ticket = mockTickets.find(t => t.id === ticketId && (t as any).userId === userId);
  return { ticket };
};

export const openTicketAPI = async (userId: string, ticketData: { subject: string; department: string; message: string; priority: 'Low' | 'Medium' | 'High' }): Promise<{ result: 'success' | 'error'; message?: string; ticketId?: string }> => {
  await delay(MOCK_API_DELAY);
  const newTicket: Ticket = {
    id: `t${mockTickets.length + 1}`,
    ticketNumber: `SNBD-TKT-00${mockTickets.length + 1}`,
    userId,
    ...ticketData,
    status: 'Open',
    lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm'),
    dateOpened: format(new Date(), 'yyyy-MM-dd HH:mm'),
    replies: [{id: 'tr-init', author: 'Client', message: ticketData.message, date: format(new Date(), 'yyyy-MM-dd HH:mm')}]
  };
  mockTickets.push(newTicket);
  return { result: 'success', ticketId: newTicket.id };
};

export const replyToTicketAPI = async (userId: string, ticketId: string, message: string): Promise<{ result: 'success' | 'error'; message?: string; reply?: TicketReply }> => {
  await delay(MOCK_API_DELAY);
  const ticket = mockTickets.find(t => t.id === ticketId && (t as any).userId === userId);
  if (!ticket) {
    return { result: 'error', message: 'Ticket not found.' };
  }
  const newReply: TicketReply = {
    id: `tr${ticket.id}-${(ticket.replies?.length || 0) + 1}`,
    author: 'Client',
    message,
    date: format(new Date(), 'yyyy-MM-dd HH:mm'),
  };
  ticket.replies = [...(ticket.replies || []), newReply];
  ticket.lastUpdated = newReply.date;
  ticket.status = 'Customer-Reply';
  return { result: 'success', reply: newReply };
};

export const getUserDetailsAPI = async (userId: string): Promise<{ user?: User }> => {
  await delay(MOCK_API_DELAY);
  const user = mockUsers.find(u => u.id === userId);
  return { user };
};
