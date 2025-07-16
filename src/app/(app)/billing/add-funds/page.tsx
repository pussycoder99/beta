
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, CreditCard, DollarSign, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { PaymentMethod } from '@/types';

export default function AddFundsPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('10.00'); // Default amount
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  useEffect(() => {
    if (token) {
      setIsLoadingMethods(true);
      fetch('/api/billing/payment-methods', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.paymentMethods) {
          setAvailableMethods(data.paymentMethods);
        } else {
          toast({ title: 'Error', description: 'Could not load payment methods.', variant: 'destructive' });
        }
      })
      .catch(err => {
        toast({ title: 'Error', description: 'Failed to fetch payment methods.', variant: 'destructive' });
        console.error(err);
      })
      .finally(() => setIsLoadingMethods(false));
    }
  }, [token, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({ title: 'Error', description: 'You must be logged in to add funds.', variant: 'destructive' });
      return;
    }
    if (parseFloat(amount) <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid amount greater than zero.', variant: 'destructive' });
      return;
    }
    if (!paymentMethod) {
      toast({ title: 'Payment Method Required', description: 'Please select a payment method.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/billing/add-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(amount), paymentMethod }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create funds invoice.');
      
      toast({ title: 'Funds Invoice Created', description: `Invoice ${data.invoiceId} created. Redirecting to payment...` });
      
      // Redirect to the WHMCS invoice payment page
      if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
      }

    } catch (error) {
      toast({ title: 'Error Adding Funds', description: (error as Error).message, variant: 'destructive' });
      setIsProcessing(false);
    }
  };

  const getIconForMethod = (methodModule: string) => {
    if (methodModule.toLowerCase().includes('paypal')) {
       return (
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.124 15.903c.564-.566.936-1.362.936-2.318 0-.927-.336-1.692-.959-2.298-.641-.634-1.542-.983-2.704-.983h-2.349v5.441h2.423c1.203 0 2.036-.348 2.653-.842z"/><path d="M21.929 15.158c-.115-1.203-.878-2.232-2.05-2.668-.12-.043-.245-.08-.371-.113v-.008c-.023-.008-.046-.017-.069-.026l-.008-.004a193.51 193.51 0 0 0-1.282-.368c-.234-.063-.478-.12-.73-.171l-.023-.004c-.26-.052-.527-.1-.8-.141l-.032-.005c-.242-.035-.489-.064-.74-.087l-.038-.004c-.246-.023-.493-.04-.74-.052l-.043-.002c-.26-.012-.528-.017-.795-.017h-3.021v6.749h3.583c1.177 0 2.135-.189 2.865-.575.738-.39 1.238-.968 1.479-1.729.173-.548.204-1.141.109-1.753zM10.043 3.001H6.497L4.433 17.575c-.115.804.12 1.529.611 2.069.478.528 1.114.81 1.865.81h1.602c.379 0 .73-.068 1.04-.21.323-.143.594-.348.794-.609l.307-.397.773-4.98.901-5.815.115-.739.008-.057c.023-.155.038-.311.038-.467V3.001z"/><path d="M17.166 8.647c.287-.324.445-.738.445-1.216 0-.504-.172-.927-.498-1.252-.329-.329-.744-.5-1.221-.5H12.75v3.008h2.819c.595 0 1.076-.189 1.392-.519.009-.008.018-.017.026-.025l.004-.004c.095-.092.173-.195.235-.302.056-.102.092-.21.114-.321l.004-.018z"/></svg>
       );
    }
    // Generic icon for credit cards
    if (methodModule.toLowerCase().includes('stripe') || methodModule.toLowerCase().includes('cc')) {
      return <CreditCard className="h-5 w-5" />;
    }
    // Fallback icon
    return <DollarSign className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/billing">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Add Funds to Your Account</h1>
      </div>

      <Card className="shadow-lg max-w-lg mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Deposit Funds</CardTitle>
            <CardDescription>Add credit to your account balance to pay for services and invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="5.00" // Example minimum
                  step="0.01"
                  required
                  className="pl-10 text-lg"
                  placeholder="e.g., 25.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required disabled={isLoadingMethods}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder={isLoadingMethods ? "Loading methods..." : "Select a payment method"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingMethods ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    availableMethods.map(method => (
                       <SelectItem key={method.module} value={method.module}>
                         <div className="flex items-center gap-2">
                           {getIconForMethod(method.module)}
                           {method.displayName}
                         </div>
                       </SelectItem>
                    ))
                  )}
                  {(!isLoadingMethods && availableMethods.length === 0) &&
                     <SelectItem value="no-methods" disabled>No payment methods available</SelectItem>
                  }
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isProcessing || isLoadingMethods} className="w-full">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
              Proceed to Add Funds
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
