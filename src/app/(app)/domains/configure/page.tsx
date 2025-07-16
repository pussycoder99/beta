
"use client";

import React, { Suspense, useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ShoppingCart, ShieldCheck, Database, Forward, Loader2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { DomainConfiguration, PaymentMethod } from '@/types';

// Mock pricing, in a real scenario this would come from the API
const PRICING = {
    register: 10.99,
    idProtection: 2.50,
};

function ConfigureDomainContent() {
    const { user, token } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const domainName = searchParams.get('domain');

    const [config, setConfig] = useState<DomainConfiguration>({
        domainName: domainName || '',
        registrationPeriod: 1,
        idProtection: true,
        dnsManagement: true,
        emailForwarding: true,
        nameservers: { ns1: '', ns2: '' },
    });
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [total, setTotal] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('');
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
              // Set default payment method if available
              if (data.paymentMethods.length > 0) {
                setPaymentMethod(data.paymentMethods[0].module);
              }
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

    useEffect(() => {
        if (domainName) {
            setConfig(prev => ({ ...prev, domainName }));
        }
    }, [domainName]);

    useEffect(() => {
        let currentTotal = PRICING.register * config.registrationPeriod;
        if (config.idProtection) {
            currentTotal += PRICING.idProtection;
        }
        setTotal(currentTotal);
    }, [config.registrationPeriod, config.idProtection]);

    const handleCheckboxChange = (id: 'idProtection' | 'dnsManagement' | 'emailForwarding', checked: boolean | 'indeterminate') => {
        if (typeof checked === 'boolean') {
            setConfig(prev => ({ ...prev, [id]: checked }));
        }
    };

    const handleNsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setConfig(prev => ({ ...prev, nameservers: { ...prev.nameservers, [id]: value } }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !token) {
            toast({ title: 'Not Authenticated', description: 'You must be logged in to place an order.', variant: 'destructive' });
            return;
        }
         if (!paymentMethod) {
            toast({ title: 'Payment Method Required', description: 'Please select a payment method.', variant: 'destructive' });
            return;
        }
        setIsProcessing(true);
        try {
            const response = await fetch('/api/domains/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...config, paymentMethod }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create domain order.');
            }
            toast({
                title: 'Order Created!',
                description: `Invoice #${data.invoiceid} has been generated. Redirecting to payment...`,
            });
            // Redirect to WHMCS invoice page
            window.location.href = data.invoiceUrl;
        } catch (error) {
            toast({ title: 'Order Failed', description: (error as Error).message, variant: 'destructive' });
            setIsProcessing(false);
        }
    };


    if (!domainName) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">No domain name was provided. Please go back and search for a domain.</p>
                    <Button asChild variant="outline" className="mt-4">
                        <Link href="/domains/register">Back to Domain Search</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/domains/register">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Configure Your Domain</h1>
                    <p className="text-muted-foreground text-lg">{domainName}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Configuration */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Registration Period</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select 
                                    value={config.registrationPeriod.toString()} 
                                    onValueChange={(val) => setConfig(prev => ({...prev, registrationPeriod: parseInt(val)}))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select registration period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Year - ${PRICING.register.toFixed(2)}</SelectItem>
                                        <SelectItem value="2">2 Years - ${(PRICING.register * 2).toFixed(2)}</SelectItem>
                                        <SelectItem value="3">3 Years - ${(PRICING.register * 3).toFixed(2)}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Nameservers</CardTitle>
                                <CardDescription>By default, new domains will use our nameservers. If you want to use custom nameservers, enter them below.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="ns1">Nameserver 1</Label>
                                    <Input id="ns1" value={config.nameservers.ns1} onChange={handleNsChange} placeholder="ns1.snbdhost.com" />
                                </div>
                                <div>
                                    <Label htmlFor="ns2">Nameserver 2</Label>
                                    <Input id="ns2" value={config.nameservers.ns2} onChange={handleNsChange} placeholder="ns2.snbdhost.com" />
                                </div>
                                <div>
                                    <Label htmlFor="ns3">Nameserver 3 (Optional)</Label>
                                    <Input id="ns3" value={config.nameservers.ns3 || ''} onChange={handleNsChange} />
                                </div>
                                <div>
                                    <Label htmlFor="ns4">Nameserver 4 (Optional)</Label>
                                    <Input id="ns4" value={config.nameservers.ns4 || ''} onChange={handleNsChange} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Addons and Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Available Addons</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start space-x-3 p-4 border rounded-md">
                                    <Checkbox id="dnsManagement" checked={config.dnsManagement} onCheckedChange={(c) => handleCheckboxChange('dnsManagement', c)} />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor="dnsManagement" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                            <Database className="h-4 w-4 text-primary"/> DNS Management
                                        </label>
                                        <p className="text-sm text-muted-foreground">Free</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-4 border rounded-md">
                                    <Checkbox id="idProtection" checked={config.idProtection} onCheckedChange={(c) => handleCheckboxChange('idProtection', c)} />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor="idProtection" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-primary"/> ID Protection
                                        </label>
                                        <p className="text-sm text-muted-foreground">${PRICING.idProtection.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-4 border rounded-md">
                                    <Checkbox id="emailForwarding" checked={config.emailForwarding} onCheckedChange={(c) => handleCheckboxChange('emailForwarding', c)} />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor="emailForwarding" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                            <Forward className="h-4 w-4 text-primary"/> Email Forwarding
                                        </label>
                                        <p className="text-sm text-muted-foreground">Free</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span>Domain Registration ({config.registrationPeriod} Year/s)</span>
                                    <span className="font-medium">${(PRICING.register * config.registrationPeriod).toFixed(2)}</span>
                                </div>
                                {config.idProtection && (
                                    <div className="flex justify-between">
                                        <span>ID Protection</span>
                                        <span className="font-medium">${PRICING.idProtection.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="space-y-2 pt-2 border-t mt-2">
                                    <Label htmlFor="paymentMethod" className="font-semibold">Payment Method</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod} required disabled={isLoadingMethods}>
                                        <SelectTrigger id="paymentMethod">
                                        <SelectValue placeholder={isLoadingMethods ? "Loading..." : "Select a method"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                        {availableMethods.map(method => (
                                            <SelectItem key={method.module} value={method.module}>
                                                {method.displayName}
                                            </SelectItem>
                                        ))}
                                        {(!isLoadingMethods && availableMethods.length === 0) &&
                                            <SelectItem value="no-methods" disabled>No methods available</SelectItem>
                                        }
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-between font-bold text-lg pt-4 border-t mt-4">
                                    <span>Total Due Today</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full" disabled={isProcessing || isLoadingMethods}>
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                                    Continue to Checkout
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function ConfigureDomainPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConfigureDomainContent />
        </Suspense>
    );
}
