
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Product, PricingCycleDetail } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface GroupedProducts {
  [groupName: string]: Product[];
}

export default function OrderServicePage() {
  const { token } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // State to manage selected billing cycle for each product
  const [selectedBillingCycles, setSelectedBillingCycles] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/data/products', { // Fetch all products
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.message || 'Failed to fetch products');
          }).catch(() => {
            throw new Error('Failed to fetch products and error response was not valid JSON');
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.products && data.products.length > 0) {
          setAllProducts(data.products);
          // Initialize selected billing cycle for each product to its first available cycle
          const initialCycles: Record<string, string | undefined> = {};
          data.products.forEach((product: Product) => {
            if (product.parsedPricingCycles && product.parsedPricingCycles.length > 0) {
              initialCycles[product.pid] = product.parsedPricingCycles[0].whmcsCycle;
            }
          });
          setSelectedBillingCycles(initialCycles);
        } else {
          setAllProducts([]);
          toast({ title: 'No Products Found', description: data.message || 'No products are currently available.', variant: 'default' });
        }
      })
      .catch(error => {
        console.error("Error fetching from /api/data/products:", error);
        toast({ title: 'Error Loading Products', description: (error as Error).message, variant: 'destructive' });
        setAllProducts([]);
      })
      .finally(() => setIsLoading(false));
  }, [token, toast]);

  const groupedProducts = useMemo(() => {
    return allProducts.reduce((acc, product) => {
      const groupName = product.groupname || 'Other Products';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(product);
      return acc;
    }, {} as GroupedProducts);
  }, [allProducts]);

  const handleOrderNow = (productId: string, productName: string) => {
    const selectedCycle = selectedBillingCycles[productId];
    toast({
      title: 'Order Initiated (Mock)',
      description: `Adding ${productName} (ID: ${productId}) with cycle ${selectedCycle || 'default'} to cart. You would be redirected to WHMCS.`,
    });
    // In a real app, construct the WHMCS cart URL:
    // const whmcsAppUrl = process.env.NEXT_PUBLIC_WHMCS_APP_URL || "https://your-whmcs-url.com";
    // let whmcsCartUrl = `${whmcsAppUrl}/cart.php?a=add&pid=${productId}`;
    // if (selectedCycle) {
    //   whmcsCartUrl += `&billingcycle=${selectedCycle}`;
    // }
    // window.location.href = whmcsCartUrl;
  };

  const handleCycleChange = (productId: string, cycle: string) => {
    setSelectedBillingCycles(prev => ({ ...prev, [productId]: cycle }));
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="h-8 w-8" /> Order New Services
        </h1>
        <Card>
            <CardContent className="p-6 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground mt-4">Loading available services...</p>
            </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="h-8 w-8" /> Order New Services
        </h1>
         <Button variant="outline" asChild>
            <Link href="/services">
                <ArrowRight className="mr-2 h-4 w-4 transform rotate-180"/> Back to My Services
            </Link>
        </Button>
      </div>
      
      {!isLoading && allProducts.length === 0 && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-yellow-500"/>No Services Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">We couldn't find any services available for order at the moment. Please check back later or contact support.</p>
            </CardContent>
        </Card>
      )}

      {Object.entries(groupedProducts).map(([groupName, productsInGroup]) => (
        <div key={groupName} className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">{groupName}</h2>
          {productsInGroup.length === 0 ? (
            <p className="text-muted-foreground">No products in this category.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsInGroup.map(product => (
                <Card key={product.pid} className="shadow-lg flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    {product.description && (
                       <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-h-24 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.description }} />
                    )}
                    
                    {product.parsedPricingCycles && product.parsedPricingCycles.length > 0 ? (
                      <div className="pt-2 space-y-1">
                        <label htmlFor={`cycle-${product.pid}`} className="text-sm font-medium text-muted-foreground">Billing Cycle:</label>
                        <Select
                          value={selectedBillingCycles[product.pid] || product.parsedPricingCycles[0]?.whmcsCycle}
                          onValueChange={(value) => handleCycleChange(product.pid, value)}
                        >
                          <SelectTrigger id={`cycle-${product.pid}`}>
                            <SelectValue placeholder="Select billing cycle" />
                          </SelectTrigger>
                          <SelectContent>
                            {product.parsedPricingCycles.map(cycle => (
                              <SelectItem key={cycle.whmcsCycle} value={cycle.whmcsCycle}>
                                {cycle.displayPrice} {cycle.setupFee && `(+ ${cycle.setupFee})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-foreground pt-2">Contact Us for Pricing</p>
                    )}
                  </CardContent>
                  <CardFooter className="mt-auto border-t pt-4">
                    <Button className="w-full" onClick={() => handleOrderNow(product.pid, product.name)} disabled={product.parsedPricingCycles.length === 0}>
                      <ShoppingCart className="mr-2 h-4 w-4" /> Order Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
