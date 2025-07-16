
"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ShoppingCart, ShieldCheck, Database, Forward } from 'lucide-react';
import Link from 'next/link';

function ConfigureDomainContent() {
    const searchParams = useSearchParams();
    const domainName = searchParams.get('domain');

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

            <form>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Configuration */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Registration Period</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select defaultValue="1">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select registration period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Year</SelectItem>
                                        <SelectItem value="2">2 Years</SelectItem>
                                        <SelectItem value="3">3 Years</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Nameservers</CardTitle>
                                <CardDescription>By default, new domains will use our nameservers for hosting on our network. If you want to use custom nameservers, enter them below.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="ns1">Nameserver 1</Label>
                                    <Input id="ns1" placeholder="ns1.snbdhost.com" />
                                </div>
                                <div>
                                    <Label htmlFor="ns2">Nameserver 2</Label>
                                    <Input id="ns2" placeholder="ns2.snbdhost.com" />
                                </div>
                                <div>
                                    <Label htmlFor="ns3">Nameserver 3 (Optional)</Label>
                                    <Input id="ns3" />
                                </div>
                                <div>
                                    <Label htmlFor="ns4">Nameserver 4 (Optional)</Label>
                                    <Input id="ns4" />
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
                                    <Checkbox id="dnsManagement" />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor="dnsManagement" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                            <Database className="h-4 w-4 text-primary"/> DNS Management
                                        </label>
                                        <p className="text-sm text-muted-foreground">Free - Host your own DNS with us.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-4 border rounded-md">
                                    <Checkbox id="idProtection" />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor="idProtection" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-primary"/> ID Protection
                                        </label>
                                        <p className="text-sm text-muted-foreground">Protect your personal information.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-4 border rounded-md">
                                    <Checkbox id="emailForwarding" />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor="emailForwarding" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                            <Forward className="h-4 w-4 text-primary"/> Email Forwarding
                                        </label>
                                        <p className="text-sm text-muted-foreground">Free - Forward emails to another address.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Domain Registration (1 Year)</span>
                                    <span className="font-medium">$10.99</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ID Protection</span>
                                    <span className="font-medium">$2.50</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>$13.49</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                                    <span>Total Due Today</span>
                                    <span>$13.49</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full">
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Continue to Checkout
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

    
