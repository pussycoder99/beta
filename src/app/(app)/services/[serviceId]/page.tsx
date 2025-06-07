
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Service } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Server,
  Settings,
  Mail,
  MailForward,
  FileArchive,
  FolderKanban,
  Database,
  Network,
  Timer,
  BarChartBig,
  DatabaseZap,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface ServiceDetails extends Service {
  diskUsagePercent?: number;
  bandwidthUsagePercent?: number;
  diskUsageRaw?: string;
  bandwidthUsageRaw?: string;
  controlPanelLink?: string;
}

const ServiceStatusBadge = ({ status }: { status: Service['status'] }) => {
  switch (status) {
    case 'Active':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>;
    case 'Suspended':
      return <Badge variant="destructive">Suspended</Badge>;
    case 'Terminated':
      return <Badge variant="outline" className="border-gray-500 text-gray-500">Terminated</Badge>;
    case 'Pending':
      return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black">Pending</Badge>;
    case 'Cancelled':
        return <Badge variant="outline" className="border-gray-400 text-gray-400">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const QuickShortcutItem = ({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick?: () => void }) => (
  <Button variant="outline" className="flex flex-col items-center justify-center h-24 w-full shadow-sm hover:shadow-md transition-shadow" onClick={onClick}>
    <Icon className="h-8 w-8 mb-1 text-primary" />
    <span className="text-xs text-center">{label}</span>
  </Button>
);


export default function ServiceDetailPage() {
  const { user, token } = useAuth();
  const params = useParams();
  const serviceId = params.serviceId as string;
  const { toast } = useToast();
  const router = useRouter();

  const [service, setService] = useState<ServiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id && serviceId && token) {
      setIsLoading(true);
      fetch(`/api/data/service-details/${serviceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw new Error(errData.message || `Failed to fetch service details: ${response.statusText}`);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.service) {
          setService(data.service);
        } else {
          toast({ title: 'Error', description: 'Service not found or access denied.', variant: 'destructive' });
          // router.push('/services');
        }
      })
      .catch(error => {
        console.error("Failed to fetch service details", error);
        toast({ title: 'Error', description: (error as Error).message || 'Could not load service details.', variant: 'destructive' });
      })
      .finally(() => setIsLoading(false));
    }
  }, [user?.id, serviceId, token, toast, router]);

  const handleControlPanelLogin = () => {
    if (service?.controlPanelLink) {
      window.open(service.controlPanelLink, '_blank');
    } else {
      toast({title: "Control Panel Access", description: "SSO link not available or not configured for this service."})
    }
  };
  
  const handleShortcutClick = (shortcutName: string) => {
    // In a real app, this would open an SSO link to the specific section if available
    // For now, it could redirect to the main control panel link or show a message
    toast({ title: "Shortcut Clicked", description: `${shortcutName} shortcut clicked. (Functionality to be implemented with deep SSO links)` });
    if(shortcutName === "Login to cPanel" && service?.controlPanelLink) {
        window.open(service.controlPanelLink, '_blank');
    }
  }


  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild disabled>
            <Link href="/services">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="h-8 w-1/2 bg-muted rounded animate-pulse"></div>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="h-6 w-1/3 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-4 w-1/4 bg-muted rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Usage Statistics</CardTitle></CardHeader>
            <CardContent className="p-6 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="text-center mt-4 text-muted-foreground">Loading usage data...</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6">
         <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/services">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Service Not Found</h1>
        </div>
        <Card>
            <CardContent className="p-6 text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
                <p className="text-muted-foreground">The requested service could not be loaded or you do not have permission to view it.</p>
                <Button asChild className="mt-4">
                    <Link href="/services">Go to Services</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  const usageAvailable = typeof service.diskUsagePercent === 'number' || typeof service.bandwidthUsagePercent === 'number';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate max-w-xl">{service.name}</h1>
        <ServiceStatusBadge status={service.status} />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Service Overview</CardTitle>
          <CardDescription>Details for your service: {service.domain || 'N/A'}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <p><strong>Status:</strong> <ServiceStatusBadge status={service.status} /></p>
          <p><strong>Registration Date:</strong> {service.registrationDate}</p>
          <p><strong>Next Due Date:</strong> {service.nextDueDate}</p>
          <p><strong>Billing Cycle:</strong> {service.billingCycle}</p>
          <p><strong>Price:</strong> {service.amount}</p>
          {service.serverInfo && <p><strong>Server IP:</strong> {service.serverInfo.ipAddress}</p>}
        </CardContent>
        {service.controlPanelLink && (
          <CardFooter>
            <Button onClick={handleControlPanelLogin} className="ml-auto">
              <ExternalLink className="mr-2 h-4 w-4"/>
              Login to Control Panel
            </Button>
          </CardFooter>
        )}
      </Card>

      {usageAvailable ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Last updated: {service.lastupdate || 'N/A'}</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Disk Usage</h3>
              {typeof service.diskUsagePercent === 'number' ? (
                <>
                  <div className="relative w-32 h-32 mx-auto mb-2">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        className="text-muted/20"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeWidth="3"
                      />
                      <path
                        className="text-primary"
                        strokeDasharray={`${service.diskUsagePercent}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                     <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                      {Math.round(service.diskUsagePercent)}%
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{service.diskUsageRaw || 'N/A'}</p>
                </>
              ) : (
                <p className="text-muted-foreground p-4">Disk usage data not available.</p>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Bandwidth Usage</h3>
               {typeof service.bandwidthUsagePercent === 'number' ? (
                <>
                   <div className="relative w-32 h-32 mx-auto mb-2">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        className="text-muted/20"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeWidth="3"
                      />
                      <path
                        className="text-primary"
                        strokeDasharray={`${service.bandwidthUsagePercent}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                     <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                       {Math.round(service.bandwidthUsagePercent)}%
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{service.bandwidthUsageRaw || 'N/A'}</p>
                </>
              ) : (
                <p className="text-muted-foreground p-4">Bandwidth usage data not available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
         <Card className="shadow-lg">
          <CardHeader><CardTitle>Usage Statistics</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground p-4">Usage statistics are not available for this service or are still loading.</p></CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Shortcuts</CardTitle>
          <CardDescription>Access common control panel features.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
          {service.controlPanelLink && 
            <QuickShortcutItem icon={ExternalLink} label="Login to cPanel" onClick={() => handleShortcutClick("Login to cPanel")} />
          }
          <QuickShortcutItem icon={Mail} label="Email Accounts" onClick={() => handleShortcutClick("Email Accounts")} />
          <QuickShortcutItem icon={MailForward} label="Forwarders" onClick={() => handleShortcutClick("Forwarders")} />
          <QuickShortcutItem icon={FileArchive} label="Autoresponders" onClick={() => handleShortcutClick("Autoresponders")} />
          <QuickShortcutItem icon={FolderKanban} label="File Manager" onClick={() => handleShortcutClick("File Manager")} />
          <QuickShortcutItem icon={Settings} label="Backup" onClick={() => handleShortcutClick("Backup")} />
          <QuickShortcutItem icon={Network} label="Domains" onClick={() => handleShortcutClick("Domains")} />
          <QuickShortcutItem icon={Timer} label="Cron Jobs" onClick={() => handleShortcutClick("Cron Jobs")} />
          <QuickShortcutItem icon={Database} label="MySQL Databases" onClick={() => handleShortcutClick("MySQL Databases")} />
          <QuickShortcutItem icon={DatabaseZap} label="phpMyAdmin" onClick={() => handleShortcutClick("phpMyAdmin")} />
          <QuickShortcutItem icon={BarChartBig} label="Awstats" onClick={() => handleShortcutClick("Awstats")} />
        </CardContent>
      </Card>
    </div>
  );
}

