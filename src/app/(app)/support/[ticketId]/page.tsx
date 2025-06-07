"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Ticket, TicketReply } from '@/types';
import { getTicketByIdAPI, replyToTicketAPI } from '@/lib/whmcs-mock-api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Send, User, MessageSquare, Clock, Tag, Loader2 } from 'lucide-react';

const TicketStatusBadge = ({ status }: { status: Ticket['status'] }) => {
  let className = "text-white";
  if (status === 'Open') className = "bg-blue-500 hover:bg-blue-600";
  else if (status === 'Answered') className = "bg-green-500 hover:bg-green-600";
  else if (status === 'Customer-Reply') className = "bg-yellow-500 hover:bg-yellow-600 text-black";
  else if (status === 'In Progress') className = "bg-purple-500 hover:bg-purple-600";
  else if (status === 'Closed') return <Badge variant="outline" className="border-gray-500 text-gray-500">{status}</Badge>;
  else return <Badge variant="outline">{status}</Badge>;
  
  return <Badge variant="default" className={className}>{status}</Badge>;
};

export default function ViewTicketPage() {
  const { user } = useAuth();
  const params = useParams();
  const ticketId = params.ticketId as string;
  const { toast } = useToast();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    if (user?.id && ticketId) {
      setIsLoading(true);
      getTicketByIdAPI(user.id, ticketId)
        .then(({ ticket: fetchedTicket }) => {
          if (fetchedTicket) {
            setTicket(fetchedTicket);
          } else {
            toast({ title: 'Error', description: 'Ticket not found or access denied.', variant: 'destructive' });
            router.push('/support');
          }
        })
        .catch(error => {
          console.error("Failed to fetch ticket", error);
          toast({ title: 'Error', description: 'Could not load ticket details.', variant: 'destructive' });
        })
        .finally(() => setIsLoading(false));
    }
  }, [user?.id, ticketId, toast, router]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !user?.id || !ticket) return;

    setIsReplying(true);
    try {
      const response = await replyToTicketAPI(user.id, ticket.id, replyMessage);
      if (response.result === 'success' && response.reply) {
        setTicket(prevTicket => prevTicket ? {
          ...prevTicket,
          replies: [...(prevTicket.replies || []), response.reply!],
          status: 'Customer-Reply',
          lastUpdated: response.reply!.date,
        } : null);
        setReplyMessage('');
        toast({ title: 'Reply Sent', description: 'Your reply has been added to the ticket.' });
      } else {
        throw new Error(response.message || 'Failed to send reply.');
      }
    } catch (error) {
      toast({ title: 'Error Sending Reply', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsReplying(false);
    }
  };
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
         <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-1/2" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="text-center mt-4 text-muted-foreground">Loading ticket details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) {
    return <p className="text-center text-muted-foreground">Ticket not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/support">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate max-w-xl">{ticket.subject}</h1>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ticket #{ticket.ticketNumber}</span>
            <Badge variant="secondary">{ticket.priority} Priority</Badge>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Opened on {ticket.dateOpened} in {ticket.department} &bull; Last updated: {ticket.lastUpdated}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {ticket.replies?.map((reply, index) => (
            <div key={reply.id} className={`flex gap-3 ${reply.author === 'Client' ? 'justify-end' : ''}`}>
              {reply.author !== 'Client' && (
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src="https://placehold.co/100x100.png?text=SH" alt="Support Staff" data-ai-hint="support staff avatar" />
                  <AvatarFallback>SH</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[75%] p-3 rounded-lg ${reply.author === 'Client' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                <p className={`text-xs mt-1 ${reply.author === 'Client' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {reply.author} - {reply.date}
                </p>
              </div>
              {reply.author === 'Client' && user && (
                 <Avatar className="h-10 w-10 border">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(user.firstName)}`} alt={user.firstName} data-ai-hint="user avatar" />
                    <AvatarFallback>{getInitials(user.firstName + ' ' + user.lastName)}</AvatarFallback>
                  </Avatar>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {ticket.status !== 'Closed' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Reply to Ticket</CardTitle>
          </CardHeader>
          <form onSubmit={handleReplySubmit}>
            <CardContent>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[120px]"
                required
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              {/* Add file attachment button if needed */}
              <Button type="submit" disabled={isReplying} className="ml-auto">
                {isReplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Reply
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
       {ticket.status === 'Closed' && (
         <Alert className="shadow-md">
            <MessageSquare className="h-4 w-4"/>
            <AlertTitle>This ticket is closed.</AlertTitle>
            <AlertDescription>
              If your issue persists or you have a new question, please <Link href="/support/new" className="underline hover:text-primary">open a new ticket</Link>.
            </AlertDescription>
          </Alert>
       )}
    </div>
  );
}
