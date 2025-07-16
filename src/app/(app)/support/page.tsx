
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Ticket } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, PlusCircle, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const StatusBadge = ({ status }: { status: Ticket['status'] }) => {
  let className = "text-white";
  if (status === 'Open') className = "bg-blue-500 hover:bg-blue-600";
  else if (status === 'Answered') className = "bg-green-500 hover:bg-green-600";
  else if (status === 'Customer-Reply') className = "bg-yellow-500 hover:bg-yellow-600 text-black";
  else if (status === 'In Progress') className = "bg-purple-500 hover:bg-purple-600";
  else if (status === 'Closed') return <Badge variant="outline" className="border-gray-500 text-gray-500">{status}</Badge>;
  else return <Badge variant="outline">{status}</Badge>;
  
  return <Badge variant="default" className={className}>{status}</Badge>;
};

const PriorityBadge = ({ priority }: { priority: Ticket['priority'] }) => {
  let className = "text-white";
  if (priority === 'Low') className = "bg-gray-500 hover:bg-gray-600";
  else if (priority === 'Medium') className = "bg-orange-500 hover:bg-orange-600";
  else if (priority === 'High') className = "bg-red-600 hover:bg-red-700";
  else return <Badge variant="outline">{priority}</Badge>;
  
  return <Badge variant="default" className={className}>{priority}</Badge>;
};


export default function SupportPage() {
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id && token) {
      setIsLoading(true);
      fetch('/api/data/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { throw new Error(err.message || 'Failed to fetch tickets'); });
        }
        return response.json();
      })
      .then(data => {
        if (data.tickets) {
          setTickets(data.tickets);
        } else {
          setTickets([]);
          toast({ title: "Notice", description: "No tickets found or data format is unexpected."});
        }
      })
      .catch(error => {
        console.error("Failed to fetch tickets", error);
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
      })
      .finally(() => setIsLoading(false));
    }
  }, [user?.id, token, toast]);

  if (isLoading) {
     return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Support Tickets</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="text-center mt-4 text-muted-foreground">Loading your support tickets...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
        <Button asChild>
          <Link href="/support/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Open New Ticket
          </Link>
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Support Tickets</h3>
            <p className="text-muted-foreground mb-4">You haven&apos;t opened any support tickets yet. If you need help, feel free to create one.</p>
            <Button asChild>
              <Link href="/support/new">Open Your First Ticket</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>{ticket.department}</TableCell>
                    <TableCell><StatusBadge status={ticket.status} /></TableCell>
                    <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                    <TableCell>{ticket.lastUpdated}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/support/${ticket.id}`}>
                          <Eye className="mr-1 h-4 w-4" /> View
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
