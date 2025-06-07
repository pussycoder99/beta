
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { ProductGroup, Product } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Loader2, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function OrderServicePage() {
  const { token } = useAuth(); 
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoadingGroups(true);
    fetch('/api/data/product-groups', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch product groups');
        return res.json();
      })
      .then(data => {
        if (data.groups) {
          setProductGroups(data.groups);
          if (data.groups.length > 0 && !selectedGroupId) { 
            setSelectedGroupId(data.groups[0].id);
          } else if (data.groups.length === 0) {
            setSelectedGroupId(null); 
            setProducts([]); 
          }
        } else {
          setProductGroups([]);
          setSelectedGroupId(null);
          setProducts([]);
          toast({ title: 'Error', description: data.message || 'Could not load product categories.', variant: 'destructive'});
        }
      })
      .catch(error => {
        console.error("Error fetching product groups:", error);
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        setProductGroups([]);
        setSelectedGroupId(null);
        setProducts([]);
      })
      .finally(() => setIsLoadingGroups(false));
  }, [token, toast]); // Only re-fetch groups if token changes or on initial load

  useEffect(() => {
    if (selectedGroupId) {
      setIsLoadingProducts(true);
      setProducts([]); 
      fetch(`/api/data/products?gid=${selectedGroupId}`, {
         headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch products for this group');
          return res.json();
        })
        .then(data => {
          if (data.products) {
            setProducts(data.products);
          } else {
            setProducts([]);
             toast({ title: 'Notice', description: data.message || 'No products found in this category.', variant: 'default'});
          }
        })
        .catch(error => {
          console.error(`Error fetching products for group ${selectedGroupId}:`, error);
          toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
          setProducts([]);
        })
        .finally(() => setIsLoadingProducts(false));
    } else {
      setProducts([]);
      setIsLoadingProducts(false);
    }
  }, [selectedGroupId, token, toast]);

  const handleOrderNow = (productId: string, productName: string) => {
    toast({
      title: 'Order Initiated (Mock)',
      description: `Adding ${productName} (ID: ${productId}) to cart. You would be redirected to WHMCS.`,
    });
  };

  if (isLoadingGroups && productGroups.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="h-8 w-8" /> Order New Services
        </h1>
        <Card>
            <CardContent className="p-6 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground mt-4">Loading product categories...</p>
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
      
      {!isLoadingGroups && productGroups.length === 0 && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-yellow-500"/>No Product Categories Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">We couldn&apos;t find any product categories at the moment. This might be due to a configuration issue or no products being available. Please check your server logs for more details from the WHMCS API, or contact support if this issue persists.</p>
            </CardContent>
        </Card>
      )}

      {productGroups.length > 0 && (
        <Tabs 
            value={selectedGroupId || (productGroups[0] ? productGroups[0].id : '')} 
            onValueChange={setSelectedGroupId} 
            className="w-full"
        >
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {productGroups.map(group => (
              <TabsTrigger key={group.id} value={group.id} className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {productGroups.map(group => (
            <TabsContent key={group.id} value={group.id} className="mt-6">
              <div className="mb-4">
                {group.headline && <h2 className="text-2xl font-semibold text-foreground">{group.headline}</h2>}
                {group.tagline && <p className="text-muted-foreground">{group.tagline}</p>}
              </div>

              {isLoadingProducts && selectedGroupId === group.id && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="shadow-lg">
                      <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                      <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-8 w-1/2" />
                      </CardContent>
                      <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {!isLoadingProducts && selectedGroupId === group.id && products.length === 0 && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-3"/>
                        <p className="text-muted-foreground">No products available in this category currently.</p>
                    </CardContent>
                </Card>
              )}

              {!isLoadingProducts && selectedGroupId === group.id && products.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <Card key={product.pid} className="shadow-lg flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-xl text-primary">{product.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-3">
                        {product.description && (
                           <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-h-24 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.description }} />
                        )}
                         <p className="text-2xl font-bold text-foreground pt-2">{product.displayPrice}</p>
                      </CardContent>
                      <CardFooter className="mt-auto border-t pt-4">
                        <Button className="w-full" onClick={() => handleOrderNow(product.pid, product.name)}>
                          <ShoppingCart className="mr-2 h-4 w-4" /> Order Now
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
