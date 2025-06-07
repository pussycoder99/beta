
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell, CreditCard, Globe, Server, ShieldAlert, Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import type { Service, Invoice, Ticket, Domain } from '@/types';
import { getClientsProductsAPI, getInvoicesAPI, getTicketsAPI, getDomainsAPI } from '@/lib/whmcs-mock-api';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  activeServices: number;
  domainsCount: number;
  pendingRenewals: number; // Services due in next 30 days
  unpaidInvoices: number;
  openTickets: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingRenewals, setUpcomingRenewals] = useState<Service[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [servicesData, invoicesData, ticketsData, domainsData] = await Promise.all([
            getClientsProductsAPI(user.id),
            getInvoicesAPI(user.id),
            getTicketsAPI(user.id),
            getDomainsAPI(user.id),
          ]);

          const activeServices = servicesData.services.filter(s => s.status === 'Active').length;
          
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          const pending = servicesData.services.filter(s => 
            s.status === 'Active' && new Date(s.nextDueDate) <= thirtyDaysFromNow
          );
          setUpcomingRenewals(pending.slice(0,3));
          
          const unpaid = invoicesData.invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').length;
          setRecentInvoices(invoicesData.invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').slice(0,3));

          const open = ticketsData.tickets.filter(t => t.status === 'Open' || t.status === 'Answered' || t.status === 'Customer-Reply').length;
          setRecentTickets(ticketsData.tickets.filter(t => t.status === 'Open' || t.status === 'Answered' || t.status === 'Customer-Reply').slice(0,3));

          const activeDomains = domainsData.domains.filter(d => d.status === 'Active').length;

          setStats({
            activeServices,
            domainsCount: activeDomains,
            pendingRenewals: pending.length,
            unpaidInvoices: unpaid,
            openTickets: open,
          });
        } catch (error) {
          console.error("Failed to fetch dashboard data", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }
  
  const StatCard = ({ title, value, icon: Icon, link, linkText }: { title: string, value: string | number, icon: React.ElementType, link?: string, linkText?: string}) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {link && linkText && (
           <Link href={link} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            {linkText}
          </Link>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.firstName}!</h1>
      
      {stats && stats.unpaidInvoices > 0 && (
        <Alert variant="destructive" className="shadow-md">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="font-semibold">You have {stats.unpaidInvoices} unpaid invoice(s)!</AlertTitle>
          <AlertDescription>
            Please settle your outstanding invoices to avoid service interruption.
            <Link href="/billing" className="ml-2 font-medium text-destructive-foreground underline">
              View Invoices
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {stats && stats.pendingRenewals > 0 && ! (stats.unpaidInvoices > 0) && (
         <Alert variant="default" className="border-primary/50 text-primary shadow-md bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold text-primary">Upcoming Renewals</AlertTitle>
          <AlertDescription className="text-primary/80">
            You have {stats.pendingRenewals} service(s) due for renewal soon.
            <Link href="/services" className="ml-2 font-medium text-primary underline">
              Manage Services
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Services" value={stats?.activeServices ?? 0} icon={Server} link="/services" linkText="View services" />
        <StatCard title="Active Domains" value={stats?.domainsCount ?? 0} icon={Globe} link="/domains" linkText="Manage domains" />
        <StatCard title="Unpaid Invoices" value={stats?.unpaidInvoices ?? 0} icon={CreditCard} link="/billing" linkText="Pay invoices" />
        <StatCard title="Open Tickets" value={stats?.openTickets ?? 0} icon={TicketIcon} link="/support" linkText="View tickets" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upcoming Renewals</CardTitle>
            <CardDescription>Services nearing their renewal date.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingRenewals.length > 0 ? (
              <ul className="space-y-3">
                {upcomingRenewals.map(service => (
                  <li key={service.id} className="flex justify-between items-center p-3 bg-card-foreground/5 rounded-md">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">Due: {service.nextDueDate} - {service.amount}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/services/${service.id}`}>Renew</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No upcoming renewals in the next 30 days.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest invoices and support tickets.</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-md font-semibold mb-2">Outstanding Invoices</h3>
            {recentInvoices.length > 0 ? (
              <ul className="space-y-3 mb-4">
                {recentInvoices.map(invoice => (
                  <li key={invoice.id} className={`flex justify-between items-center p-3 rounded-md ${invoice.status === 'Overdue' ? 'bg-destructive/10' : 'bg-card-foreground/5'}`}>
                    <div>
                      <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                      <p className={`text-sm ${invoice.status === 'Overdue' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        Due: {invoice.dueDate} - {invoice.total} ({invoice.status})
                      </p>
                    </div>
                     <Button variant={invoice.status === 'Overdue' ? 'destructive' : 'outline'} size="sm" asChild>
                      <Link href={`/billing`}>Pay Now</Link> {/* Simplified link to billing page */}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mb-4">No outstanding invoices.</p>
            )}
             <h3 className="text-md font-semibold mb-2 mt-4">Active Support Tickets</h3>
            {recentTickets.length > 0 ? (
              <ul className="space-y-3">
                {recentTickets.map(ticket => (
                  <li key={ticket.id} className="flex justify-between items-center p-3 bg-card-foreground/5 rounded-md">
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-muted-foreground">Status: {ticket.status} - Last Update: {ticket.lastUpdated}</p>
                    </div>
                     <Button variant="outline" size="sm" asChild>
                      <Link href={`/support/${ticket.id}`}>View</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No active support tickets.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

