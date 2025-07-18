
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    Bell, 
    CreditCard, 
    Globe, 
    Server, 
    ShieldAlert, 
    Ticket as TicketIcon, 
    Loader2,
    HardDrive,
    MessagesSquare,
    LogOut,
    ShoppingCart,
    Pencil,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { Service, Invoice, Ticket, Domain, Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { summarizeClient, type SummarizeClientOutput } from '@/ai/flows/summarize-client-flow';
import Image from 'next/image';

interface DashboardStats {
  activeServices: number;
  domainsCount: number;
  unpaidInvoices: number;
  openTickets: number;
}

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string; value: number; icon: React.ElementType; colorClass: string }) => (
    <div className="flex-1 bg-card p-4 rounded-lg shadow-sm border-b-4" style={{ borderBottomColor: colorClass }}>
        <div className="flex items-center justify-between">
            <div>
                <div className="text-3xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground uppercase">{title}</div>
            </div>
            <Icon className="h-10 w-10 text-muted-foreground/50" />
        </div>
    </div>
);


export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeServices, setActiveServices] = useState<Service[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<SummarizeClientOutput | null>(null);
  const [isAiSummaryLoading, setIsAiSummaryLoading] = useState(true);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id && token) {
      const fetchData = async () => {
        setIsLoading(true);
        setIsAiSummaryLoading(true);
        try {
          const fetchFromApi = async (endpoint: string) => {
            const response = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: `Failed to parse error from ${endpoint}` }));
              throw new Error(errorData.message || `Failed to fetch from ${endpoint}`);
            }
            return response.json();
          };
          
          const [servicesData, invoicesData, ticketsData, domainsData, productsData] = await Promise.all([
            fetchFromApi('/api/data/services'),
            fetchFromApi('/api/data/invoices'),
            fetchFromApi('/api/data/tickets'),
            fetchFromApi('/api/data/domains'),
            fetchFromApi('/api/data/products'), // Fetch all products for AI summary
          ]);

          const active = servicesData.services.filter((s: Service) => s.status === 'Active');
          setActiveServices(active);

          const unpaid = invoicesData.invoices.filter((i: Invoice) => i.status === 'Unpaid' || i.status === 'Overdue').length;
          
          const openTickets = ticketsData.tickets.filter((t: Ticket) => t.status === 'Open' || t.status === 'Answered' || t.status === 'Customer-Reply');
          setRecentTickets(openTickets.slice(0, 1));

          const activeDomains = domainsData.domains.filter((d: Domain) => d.status === 'Active').length;

          setStats({
            activeServices: active.length,
            domainsCount: activeDomains,
            unpaidInvoices: unpaid,
            openTickets: openTickets.length,
          });

          // Once data is fetched, call the AI flow
          if (productsData.products) {
            const clientServiceNames = active.map(s => s.name);
            const allProductNames = productsData.products.map((p: Product) => p.name);
            const summary = await summarizeClient({ clientServices: clientServiceNames, allProducts: allProductNames });
            setAiSummary(summary);
          }

        } catch (error) {
          console.error("Failed to fetch dashboard data", error);
          toast({
            title: 'Error Loading Dashboard',
            description: (error as Error).message,
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
          setIsAiSummaryLoading(false);
        }
      };
      fetchData();
    } else if (!user && !token) {
        setIsLoading(false);
        setIsAiSummaryLoading(false);
    }
  }, [user?.id, token, toast]);

  const handleResendVerification = async () => {
    if (!token) {
        toast({ title: 'Error', description: 'Authentication token not found.', variant: 'destructive' });
        return;
    }
    setIsSendingVerification(true);
    try {
        const response = await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to resend email.');
        }
        toast({ title: 'Email Sent', description: 'A new verification email has been sent to your address.' });
    } catch (error) {
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
        setIsSendingVerification(false);
    }
  };

  const handleEditWithSitejet = (service: Service) => {
    toast({
        title: 'Opening Sitejet Editor...',
        description: `You would now be redirected to the Sitejet editor for ${service.domain}. (This is a mock action)`
    });
    // In a real app, you would generate a SSO link via API and redirect:
    // const ssoUrl = await getSitejetSsoUrl(service.id);
    // window.open(ssoUrl, '_blank');
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64 rounded-lg" />
            </div>
        </div>
      </div>
    );
  }
  
  if (!user) {
     return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  const sitejetServices = activeServices.filter(s => s.name.toLowerCase().includes('hosting'));

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Client Area</h1>
            <p className="text-sm text-muted-foreground">Portal Home / Client Area</p>
        </div>

        <Alert variant="default" className="bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500/50 text-yellow-800 dark:text-yellow-200">
            <ShieldAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="font-semibold">Please check your email and follow the link to verify your email address.</AlertTitle>
            <Button 
                variant="outline" 
                size="sm" 
                className="absolute top-3 right-3"
                onClick={handleResendVerification}
                disabled={isSendingVerification}
            >
                {isSendingVerification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend Verification Email
            </Button>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column */}
            <aside className="lg:col-span-3 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Your Info</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <p className="font-bold">{user.firstName} {user.lastName}</p>
                        <p>{user.address1}</p>
                        <p>{user.city}, {user.state} {user.postcode}</p>
                        <p>{user.country}</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="secondary" className="w-full bg-green-600 hover:bg-green-700 text-white">
                            <Link href="/settings/profile">
                                <Pencil className="mr-2 h-4 w-4"/>Update
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No Contacts Found</p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">+ New Contact...</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Shortcuts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                         <Link href="/services/order" className="flex items-center gap-2 text-sm hover:text-primary"><ShoppingCart/> Order New Services</Link>
                         <Link href="/domains/register" className="flex items-center gap-2 text-sm hover:text-primary"><Globe/> Register a New Domain</Link>
                         <button onClick={logout} className="flex items-center gap-2 text-sm hover:text-primary w-full"><LogOut/> Logout</button>
                    </CardContent>
                </Card>
            </aside>

            {/* Right Column */}
            <main className="lg:col-span-9 space-y-6">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Services" value={stats?.activeServices ?? 0} icon={HardDrive} colorClass="#4CAF50" />
                    <StatCard title="Domains" value={stats?.domainsCount ?? 0} icon={Globe} colorClass="#2196F3" />
                    <StatCard title="Tickets" value={stats?.openTickets ?? 0} icon={MessagesSquare} colorClass="#FF5722" />
                    <StatCard title="Invoices" value={stats?.unpaidInvoices ?? 0} icon={CreditCard} colorClass="#FFC107" />
                </div>

                <Card className="bg-gradient-to-br from-primary/10 to-background">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="text-primary"/>
                            AI Account Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isAiSummaryLoading ? (
                             <div className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ) : aiSummary ? (
                            <div className="space-y-1">
                                <p className="text-foreground/90">{aiSummary.summary}</p>
                                <p className="text-muted-foreground">{aiSummary.upsellSuggestion}</p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Could not generate an AI summary at this time.</p>
                        )}
                    </CardContent>
                </Card>

                {sitejetServices.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Sitejet Builder</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-6">
                            <div className="w-1/3">
                               <Image src="https://assets.sitejet.io/images/temp/logo-sitejet-500.png" alt="Sitejet Logo" width={500} height={150} />
                            </div>
                            <div className="flex-1">
                                <p className="text-muted-foreground mb-4">You have {sitejetServices.length} service(s) with our powerful Sitejet website builder. Select a site below to start editing.</p>
                                {sitejetServices.map(service => (
                                    <div key={service.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                        <p className="font-semibold">{service.domain}</p>
                                        <Button onClick={() => handleEditWithSitejet(service)}>Edit with Sitejet</Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}


                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Your Active Products/Services</CardTitle>
                         <Button variant="outline" size="sm" asChild><Link href="/services">My Services</Link></Button>
                    </CardHeader>
                    <CardContent>
                        {activeServices.length > 0 ? (
                            activeServices.slice(0, 3).map(service => (
                                <div key={service.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md mb-2 last:mb-0">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">Active</span>
                                        <div>
                                            <p className="font-semibold">{service.name}</p>
                                            <p className="text-sm text-muted-foreground">{service.domain}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {service.name.toLowerCase().includes('hosting') && (
                                            <Button variant="secondary" onClick={() => handleEditWithSitejet(service)}>Edit with Sitejet</Button>
                                        )}
                                        <Button variant="outline">Log in to cPanel</Button>
                                        <Button variant="outline" asChild><Link href={`/services/${service.id}`}>View Details</Link></Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-sm">No active services found.</p>
                        )}
                        {activeServices.length > 3 && (
                             <Link href="/services" className="text-sm text-primary hover:underline mt-2 inline-block">View All Services...</Link>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Recent Support Tickets</CardTitle>
                            <Button variant="outline" size="sm" asChild><Link href="/support/new">+ Open New Ticket</Link></Button>
                        </CardHeader>
                        <CardContent>
                           {recentTickets.length > 0 ? (
                               recentTickets.map(ticket => (
                                   <div key={ticket.id} className="text-sm">
                                       <Link href={`/support/${ticket.id}`} className="font-semibold text-primary hover:underline">{ticket.subject}</Link>
                                       <p className="text-muted-foreground">Last Updated: {ticket.lastUpdated}</p>
                                   </div>
                               ))
                           ) : (
                                <p className="text-sm text-muted-foreground">No Recent Tickets Found. If you need any help, please <Link href="/support/new" className="text-primary underline">open a ticket</Link>.</p>
                           )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Register a New Domain</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2">
                            <Input placeholder="yourdomain.com" />
                            <Button variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">Register</Button>
                            <Button variant="outline">Transfer</Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    </div>
  );
}
