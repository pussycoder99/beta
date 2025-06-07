
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Invoice } from '@/types';
// Removed direct import of getInvoicesAPI
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, DollarSign, Download, FileText, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const StatusBadge = ({ status }: { status: Invoice['status'] }) => {
  switch (status) {
    case 'Paid':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Paid</Badge>;
    case 'Unpaid':
      return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black">Unpaid</Badge>;
    case 'Overdue':
      return <Badge variant="destructive">Overdue</Badge>;
    case 'Cancelled':
      return <Badge variant="outline" className="border-gray-500 text-gray-500">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function BillingPage() {
  const { user, token } = useAuth(); // Added token
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id && token) { // Check for token
      setIsLoading(true);
      fetch('/api/data/invoices', { // Fetch from the internal API route
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw new Error(errData.message || `Failed to fetch invoices: ${response.statusText}`);
          }).catch(() => { // Fallback if parsing error response fails
            throw new Error(`Failed to fetch invoices: ${response.statusText}`);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.invoices) {
          setInvoices(data.invoices);
        } else {
          console.warn("Invoices data not found in API response:", data);
          setInvoices([]); // Default to empty array if invoices key is missing
          toast({ title: 'Notice', description: 'No invoices found or data format unexpected.', variant: 'default' });
        }
      })
      .catch(error => {
        console.error("Failed to fetch invoices", error);
        toast({ title: 'Error', description: (error as Error).message || 'Could not load invoices.', variant: 'destructive' });
      })
      .finally(() => setIsLoading(false));
    } else if (!token && user?.id) {
        setIsLoading(false);
        console.warn("BillingPage: User present but token is missing. Data fetching skipped.");
    } else {
        setIsLoading(false); // Not loading if no user or no token
    }
  }, [user?.id, token, toast]); // Added token to dependency array


  const handlePayInvoice = (invoiceId: string) => {
    // In a real app, redirect to WHMCS payment gateway or a payment page
    // Example: window.open(`https://portal.snbdhost.com/viewinvoice.php?id=${invoiceId}`, '_blank');
    toast({ title: 'Payment Action', description: `Redirecting to pay invoice ${invoiceId} (mocked).`});
  };

  const handleDownloadPdf = (invoiceId: string) => {
    // In a real app, this would link to the WHMCS PDF download URL
    // Example: window.open(`https://portal.snbdhost.com/dl.php?type=i&id=${invoiceId}`, '_blank');
    toast({ title: 'Download Action', description: `Downloading PDF for invoice ${invoiceId} (mocked).`});
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Billing Center</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="text-center mt-4 text-muted-foreground">Loading your invoices...</p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">Billing Center</h1>
        <Button asChild>
          <Link href="/billing/add-funds">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Funds
          </Link>
        </Button>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Invoices Yet</h3>
            <p className="text-muted-foreground mb-4">You currently don&apos;t have any invoices. Once you order a service, they will appear here.</p>
            <Button asChild>
              <Link href="/services">Browse Services</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.dateCreated}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>{invoice.total}</TableCell>
                    <TableCell><StatusBadge status={invoice.status} /></TableCell>
                    <TableCell className="text-right space-x-1">
                       <Button variant="ghost" size="icon" title="Download PDF" onClick={() => handleDownloadPdf(invoice.id)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {(invoice.status === 'Unpaid' || invoice.status === 'Overdue') && (
                        <Button variant="outline" size="sm" onClick={() => handlePayInvoice(invoice.id)}>
                          <DollarSign className="mr-1 h-4 w-4" /> Pay Now
                        </Button>
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

