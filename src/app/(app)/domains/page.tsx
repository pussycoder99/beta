
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Domain } from '@/types';
// Removed direct import from whmcs-mock-api
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Globe, PlusCircle, RefreshCw, Settings2, Loader2, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const StatusBadge = ({ status }: { status: Domain['status'] }) => {
  switch (status) {
    case 'Active':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>;
    case 'Pending':
      return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black">Pending</Badge>;
    case 'Expired':
      return <Badge variant="destructive">Expired</Badge>;
    case 'Transferred Away':
      return <Badge variant="outline" className="border-gray-500 text-gray-500">Transferred Away</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function DomainsPage() {
  const { user, token } = useAuth(); // Added token
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id && token) { // Check for token
      setIsLoading(true);
      fetch('/api/data/domains', { // Fetch from the internal API route
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw new Error(errData.message || `Failed to fetch domains: ${response.statusText}`);
          }).catch(() => { // Fallback if parsing error response fails
            throw new Error(`Failed to fetch domains: ${response.statusText}`);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.domains) {
          setDomains(data.domains);
        } else {
          console.warn("Domains data not found in API response:", data);
          setDomains([]); // Default to empty array if domains key is missing
          toast({ title: 'Notice', description: 'No domains found or data format unexpected.', variant: 'default' });
        }
      })
      .catch(error => {
        console.error("Failed to fetch domains", error);
        toast({ title: 'Error', description: (error as Error).message || 'Could not load domains.', variant: 'destructive' });
      })
      .finally(() => setIsLoading(false));
    } else if (!token && user?.id) {
        setIsLoading(false);
        console.warn("DomainsPage: User present but token is missing. Data fetching skipped.");
    } else {
        setIsLoading(false); // Not loading if no user or no token
    }
  }, [user?.id, token, toast]); // Added token to dependency array


  const handleAction = (domainId: string, action: string) => {
    toast({ title: 'Action Triggered', description: `${action} for domain ${domainId} (mocked).`});
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Domains</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="text-center mt-4 text-muted-foreground">Loading your domains...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">Your Domains</h1>
        <Button asChild>
          <Link href="/domains/register">
            <PlusCircle className="mr-2 h-4 w-4" /> Register New Domain
          </Link>
        </Button>
      </div>

      {domains.length === 0 ? (
         <Card>
          <CardContent className="p-10 text-center">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Domains Yet</h3>
            <p className="text-muted-foreground mb-4">You haven&apos;t registered or transferred any domains yet.</p>
            <Button asChild>
              <Link href="/domains/register">Register Your First Domain</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain Name</TableHead>
                  <TableHead>Registrar</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">{domain.domainName}</TableCell>
                    <TableCell>{domain.registrar}</TableCell>
                    <TableCell>{domain.expiryDate}</TableCell>
                    <TableCell><StatusBadge status={domain.status} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button asChild>
                         <Link href={`/domains/${domain.id}`}>
                            <Wrench className="mr-2 h-4 w-4"/> Manage
                         </Link>
                      </Button>
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
