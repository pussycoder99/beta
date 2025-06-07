
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
  const [allProductsMasterList, setAllProductsMasterList] = useState<Product[]>([]); // Stores all products if source is 'DerivedFromGetProducts'
  const [currentDisplayProducts, setCurrentDisplayProducts] = useState<Product[]>([]); // Products for the selected tab
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null); // 'GetProductGroups' or 'DerivedFromGetProducts'
  const { toast } = useToast();

  useEffect(() => {
    setIsLoadingGroups(true);
    setProductGroups([]);
    setAllProductsMasterList([]);
    setCurrentDisplayProducts([]);
    setSelectedGroupId(null);

    fetch('/api/data/product-groups', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) {
          // Try to parse error message from backend if available
          return res.json().then(errData => {
            throw new Error(errData.message || 'Failed to fetch product categories configuration');
          }).catch(() => { // Fallback if parsing error response fails
            throw new Error('Failed to fetch product categories configuration and error response was not valid JSON');
          });
        }
        return res.json();
      })
      .then(data => {
        setDataSource(data.source || 'unknown');
        if (data.groups && data.groups.length > 0) {
          setProductGroups(data.groups);
          setSelectedGroupId(data.groups[0].id); // Auto-select the first group

          if (data.source === 'DerivedFromGetProducts' && data.allProducts) {
            setAllProductsMasterList(data.allProducts);
            // Products for the initially selected group will be set by the other useEffect
          }
          // If source is 'GetProductGroups', the other useEffect will fetch products for selectedGroupId
        } else {
          setProductGroups([]);
          setAllProductsMasterList([]);
          setCurrentDisplayProducts([]);
          setSelectedGroupId(null);
          toast({ title: 'No Categories', description: data.message || 'No product categories found.', variant: 'default' });
        }
      })
      .catch(error => {
        console.error("Error fetching from /api/data/product-groups:", error);
        toast({ title: 'Error Loading Categories', description: (error as Error).message, variant: 'destructive' });
        setProductGroups([]);
        setAllProductsMasterList([]);
        setCurrentDisplayProducts([]);
        setSelectedGroupId(null);
      })
      .finally(() => setIsLoadingGroups(false));
  }, [token, toast]);

  useEffect(() => {
    if (!selectedGroupId) {
      setCurrentDisplayProducts([]);
      return;
    }
    setIsLoadingProducts(true);

    if (dataSource === 'DerivedFromGetProducts') {
      const productsForGroup = allProductsMasterList.filter(p => p.gid === selectedGroupId);
      setCurrentDisplayProducts(productsForGroup);
      if (productsForGroup.length === 0) {
        // toast({ title: 'Notice', description: 'No products found in this derived category.', variant: 'default'});
      }
    } else if (dataSource === 'GetProductGroups') {
      // Fetch products specifically for this group
      setCurrentDisplayProducts([]); // Clear previous products
      fetch(`/api/data/products?gid=${selectedGroupId}`, {
         headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
        .then(res => {
          if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.message || 'Failed to fetch products for this group');
            }).catch(() => {
                throw new Error('Failed to fetch products for this group and error response was not valid JSON');
            });
          }
          return res.json();
        })
        .then(data => {
          if (data.products) {
            setCurrentDisplayProducts(data.products);
          } else {
            setCurrentDisplayProducts([]);
             toast({ title: 'Notice', description: data.message || 'No products found in this category.', variant: 'default'});
          }
        })
        .catch(error => {
          console.error(`Error fetching products for group ${selectedGroupId}:`, error);
          toast({ title: 'Error Fetching Products', description: (error as Error).message, variant: 'destructive' });
          setCurrentDisplayProducts([]);
        })
        .finally(() => setIsLoadingProducts(false));
    } else {
      // If dataSource is null or unknown, or if groups are empty.
      setCurrentDisplayProducts([]);
    }
     // This effect should run whenever selectedGroupId or dataSource changes, or allProductsMasterList (for derived case)
  }, [selectedGroupId, token, toast, dataSource, allProductsMasterList]);

  const handleOrderNow = (productId: string, productName: string) => {
    toast({
      title: 'Order Initiated (Mock)',
      description: `Adding ${productName} (ID: ${productId}) to cart. You would be redirected to WHMCS.`,
    });
    // In a real app, construct the WHMCS cart URL:
    // const whmcsAppUrl = process.env.NEXT_PUBLIC_WHMCS_APP_URL || "https://your-whmcs-url.com";
    // const whmcsCartUrl = `${whmcsAppUrl}/cart.php?a=add&pid=${productId}`;
    // window.location.href = whmcsCartUrl;
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
                <p className="text-muted-foreground">We couldn't find any product categories. This could be due to your WHMCS API role missing the 'GetProductGroups' permission, or no product groups being configured in your WHMCS setup. If 'GetProductGroups' is unavailable, the system attempts to derive groups from all products, which might also result in no categories if products lack group name information in the API response.</p>
                <p className="text-muted-foreground mt-2">Please check your WHMCS API Role permissions and ensure product groups are set up. Also, check server logs for more details on API responses.</p>
            </CardContent>
        </Card>
      )}

      {productGroups.length > 0 && (
        <Tabs
            value={selectedGroupId || (productGroups.length > 0 ? productGroups[0].id : '')}
            onValueChange={setSelectedGroupId}
            className="w-full"
        >
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 h-auto flex-wrap">
            {productGroups.map(group => (
              <TabsTrigger key={group.id} value={group.id} className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-3">
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

              {!isLoadingProducts && selectedGroupId === group.id && currentDisplayProducts.length === 0 && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-3"/>
                        <p className="text-muted-foreground">No products available in this category currently.</p>
                         {dataSource === 'DerivedFromGetProducts' && <p className="text-xs text-muted-foreground mt-1">(Products filtered from all available items)</p>}
                    </CardContent>
                </Card>
              )}

              {!isLoadingProducts && selectedGroupId === group.id && currentDisplayProducts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentDisplayProducts.map(product => (
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
