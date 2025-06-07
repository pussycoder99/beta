"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { openTicketAPI } from '@/lib/whmcs-mock-api';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

type Priority = 'Low' | 'Medium' | 'High';

export default function NewTicketPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !department || !message) {
      toast({ title: 'Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    if (!user?.id) {
      toast({ title: 'Error', description: 'User not authenticated.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await openTicketAPI(user.id, { subject, department, message, priority });
      if (response.result === 'success' && response.ticketId) {
        toast({ title: 'Ticket Created', description: 'Your support ticket has been opened successfully.' });
        router.push(`/support/${response.ticketId}`);
      } else {
        throw new Error(response.message || 'Failed to open ticket.');
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/support">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Open New Support Ticket</h1>
      </div>

      <Card className="shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="subject">Subject <span className="text-primary">*</span></Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="mt-1"
                placeholder="e.g., Website downtime issue"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department <span className="text-primary">*</span></Label>
                <Select value={department} onValueChange={(value) => setDepartment(value)} required>
                  <SelectTrigger id="department" className="mt-1">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical Support">Technical Support</SelectItem>
                    <SelectItem value="Billing">Billing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority <span className="text-primary">*</span></Label>
                <Select value={priority} onValueChange={(value: Priority) => setPriority(value)} required>
                  <SelectTrigger id="priority" className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="message">Message <span className="text-primary">*</span></Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="mt-1 min-h-[150px]"
                placeholder="Describe your issue in detail..."
              />
            </div>
            {/* Add file attachment input if needed in future */}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isLoading} className="ml-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Ticket
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
