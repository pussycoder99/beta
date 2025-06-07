
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Service } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpCircle, RefreshCw, Server, XCircle, Eye, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const StatusBadge = ({ status }: { status: Service['status'] }) => {
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

export default function ServicesPage() {
  const { user, token } = useAuth(); 
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id && token) { 
      setIsLoading(true);
      fetch('/api/data/services', { 
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw new Error(errData.message || `Failed to fetch services: ${response.statusText}`);
          }).catch(() => {
            throw new Error(`Failed to fetch services: ${response.statusText}`);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.services) {
          setServices(data.services);
        } else {
          console.warn("Services data not found in API response:", data);
          setServices([]); 
          toast({ title: 'Notice', description: 'No services found or data format unexpected.', variant: 'default' });
        }
      })
      .catch(error => {
        console.error("Failed to fetch services", error);
        toast({ title: 'Error', description: (error as Error).message || 'Could not load services.', variant: 'destructive' });
      })
      .finally(() => setIsLoading(false));
    } else if (!token && user?.id) {
        setIsLoading(false);
        console.warn("ServicesPage: User present but token is missing. Data fetching skipped.");
    } else {
        setIsLoading(false); 
    }
  }, [user?.id, token, toast]); 

  const handleOtherAction = (serviceId: string, action: string) => {
    // Mock action - In a real app, these would likely be API calls too
    toast({ title: 'Action Triggered', description: `${action} for service ${serviceId} (mocked).`});
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Services</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="text-center mt-4 text-muted-foreground">Loading your services...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">Your Services</h1>
        <Button asChild>
          <Link href="/services/order"> {/* This would be a link to a new order page */}
            <PlusCircle className="mr-2 h-4 w-4" /> Order New Service
          </Link>
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Services Yet</h3>
            <p className="text-muted-foreground mb-4">You currently don&apos;t have any active services. Explore our offerings!</p>
            <Button asChild>
              <Link href="/services/order">Order Your First Service</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service/Domain</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Next Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <Link href={`/services/${service.id}`} className="font-medium hover:underline text-primary">
                        {service.name}
                      </Link>
                      {service.domain && <div className="text-sm text-muted-foreground">{service.domain}</div>}
                    </TableCell>
                    <TableCell>{service.amount} {service.billingCycle}</TableCell>
                    <TableCell>{service.nextDueDate}</TableCell>
                    <TableCell><StatusBadge status={service.status} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/services/${service.id}`}>
                          <Eye className="mr-1 h-4 w-4" /> View Details
                        </Link>
                      </Button>
                      {service.status === 'Active' && (
                        <>
                          <Button variant="ghost" size="icon" title="Renew" onClick={() => handleOtherAction(service.id, 'Renew')}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Upgrade" onClick={() => handleOtherAction(service.id, 'Upgrade')}>
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Cancel" className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90" onClick={() => handleOtherAction(service.id, 'Cancel Request')}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

