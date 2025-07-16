
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Globe, Server, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const tldPricing = [
  { tld: '.com', newPrice: '1,099.00', transfer: '1,499.00', renewal: '1,550.00' },
  { tld: '.xyz', newPrice: '249.00', transfer: '1,499.00', renewal: '1,499.00' },
  { tld: '.org', newPrice: '899.00', transfer: '1,349.00', renewal: '1,349.00' },
  { tld: '.net', newPrice: '1,299.00', transfer: '1,499.00', renewal: '1,499.00' },
  { tld: '.me', newPrice: '1,249.99', transfer: '2,099.99', renewal: '2,099.99' },
];

export default function RegisterDomainPage() {
  const [activeCategory, setActiveCategory] = useState('Popular');

  const categories = [
    { name: 'Popular', count: 5 },
    { name: 'Business', count: 1 },
    { name: 'Shopping', count: 1 },
    { name: 'Real Estate', count: 1 },
    { name: 'Novelty', count: 1 },
    { name: 'Other', count: 1 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Register Domain</h1>
        <p className="text-muted-foreground mt-1">Find your new domain name. Enter your name or keywords below to check availability.</p>
      </div>

      <Card className="bg-amber-400/20 border-amber-500/30 overflow-hidden">
        <CardContent className="p-8 relative">
            <Globe className="absolute -right-10 -top-10 h-48 w-48 text-amber-500/20" />
            <div className="relative max-w-2xl mx-auto">
                <div className="relative">
                    <Input
                    type="search"
                    placeholder="Find your new domain name"
                    className="w-full pl-10 pr-24 h-14 text-lg rounded-full shadow-lg"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                    <Button size="lg" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-11">
                    <Search className="mr-2 h-4 w-4" /> Search
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Browse extensions by category</h2>
        <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
                <Button 
                    key={cat.name} 
                    variant={activeCategory === cat.name ? "default" : "secondary"}
                    onClick={() => setActiveCategory(cat.name)}
                    className={activeCategory === cat.name ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                    {cat.name} ({cat.count})
                </Button>
            ))}
        </div>
      </div>

      <Card>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-1/4">Domain</TableHead>
                    <TableHead className="text-center">New Price</TableHead>
                    <TableHead className="text-center">Transfer</TableHead>
                    <TableHead className="text-center">Renewal</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tldPricing.map((item) => (
                    <TableRow key={item.tld}>
                        <TableCell className="font-bold text-lg">{item.tld}</TableCell>
                        <TableCell className="text-center">
                            <p className="font-semibold text-primary">৳{item.newPrice}BDT</p>
                            <p className="text-sm text-muted-foreground">1 Year</p>
                        </TableCell>
                        <TableCell className="text-center">
                            <p className="font-semibold">৳{item.transfer}BDT</p>
                            <p className="text-sm text-muted-foreground">1 Year</p>
                        </TableCell>
                        <TableCell className="text-center">
                            <p className="font-semibold">৳{item.renewal}BDT</p>
                            <p className="text-sm text-muted-foreground">1 Year</p>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="flex items-center p-6">
            <Server className="h-16 w-16 text-primary mr-6" />
            <div>
                <h3 className="text-xl font-bold">Add Web Hosting</h3>
                <p className="text-amber-600">Choose from a range of web hosting packages</p>
                <p className="text-muted-foreground mt-1">We have packages designed to fit every budget</p>
                <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-black">Explore packages now</Button>
            </div>
        </Card>
         <Card className="flex items-center p-6">
            <Globe className="h-16 w-16 text-primary mr-6" />
            <div>
                <h3 className="text-xl font-bold">Transfer your domain to us</h3>
                <p className="text-muted-foreground mt-1">Transfer now to extend your domain by 1 year!*</p>
                <Button variant="secondary" className="mt-4">Transfer a domain</Button>
                <p className="text-xs text-muted-foreground mt-2">* Excludes certain TLDs and recently renewed domains</p>
            </div>
        </Card>
      </div>

    </div>
  );
}
