
"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bot, Loader2, Sparkles, ShoppingCart } from 'lucide-react';
import { recommendHosting, type HostingRecommenderOutput } from '@/ai/flows/hosting-recommender-flow';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AiHosterPage() {
    const [projectDescription, setProjectDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<HostingRecommenderOutput | null>(null);
    const [recommendedProduct, setRecommendedProduct] = useState<Product | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const { toast } = useToast();

    // Pre-fetch products on component mount
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/data/products');
                if (!response.ok) {
                    throw new Error('Failed to fetch product list.');
                }
                const data = await response.json();
                if (data.products) {
                    setAllProducts(data.products);
                }
            } catch (err) {
                toast({ title: "Error", description: "Could not load hosting products. Please try again later.", variant: "destructive" });
                console.error(err);
            }
        };
        fetchProducts();
    }, [toast]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!projectDescription.trim()) {
            setError("Please describe your project before getting a recommendation.");
            return;
        }
        if (allProducts.length === 0) {
            setError("Hosting product data is not available. Cannot get a recommendation right now.");
            return;
        }

        setIsLoading(true);
        setRecommendation(null);
        setRecommendedProduct(null);
        setError(null);

        try {
            const result = await recommendHosting({
                projectDescription,
                availableProducts: allProducts.map(p => ({ pid: p.pid, name: p.name, description: p.description }))
            });
            setRecommendation(result);

            const foundProduct = allProducts.find(p => p.pid === result.recommendedProductId);
            if (foundProduct) {
                setRecommendedProduct(foundProduct);
            } else {
                 throw new Error(`AI recommended product ID ${result.recommendedProductId}, but it was not found in the product list.`);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError("Sorry, the AI assistant encountered an error. Please try again.");
            console.error("AI Recommendation Error:", errorMessage);
            toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleOrderNow = (pid: string) => {
        const whmcsAppUrl = process.env.NEXT_PUBLIC_WHMCS_APP_URL || 'https://portal.snbdhost.com';
        const cartUrl = `${whmcsAppUrl}/cart.php?a=add&pid=${pid}`;
        window.open(cartUrl, '_blank');
        toast({
            title: "Redirecting to Cart",
            description: `You are being redirected to our main store to complete your order.`
        });
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <Bot className="h-12 w-12 mx-auto text-primary" />
                <h1 className="text-3xl font-bold text-foreground mt-4">AI Hosting Advisor</h1>
                <p className="text-muted-foreground mt-2">
                    Not sure which hosting plan is right for you? Describe your project, and our AI will recommend the perfect fit.
                </p>
            </div>

            <Card className="shadow-lg">
                <form onSubmit={handleSubmit}>
                    <CardContent className="p-6 space-y-4">
                        <div>
                            <Label htmlFor="projectDescription" className="text-lg font-semibold">
                                Tell us about your project
                            </Label>
                            <p className="text-sm text-muted-foreground mb-2">
                                For example: "I'm starting an online store selling handmade jewelry with about 50 products." or "I need to host a simple portfolio website for my photography business."
                            </p>
                            <Textarea
                                id="projectDescription"
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                required
                                className="min-h-[120px] text-base"
                                placeholder="Describe your website or business needs here..."
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isLoading || allProducts.length === 0} className="w-full md:w-auto ml-auto">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Get Recommendation
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {isLoading && (
                <div className="text-center p-6">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Our AI is thinking... this may take a moment.</p>
                </div>
            )}

            {recommendation && recommendedProduct && (
                <Card className="bg-gradient-to-br from-primary/10 to-background shadow-xl border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Sparkles className="text-primary"/>
                            Our Recommendation For You
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <h3 className="text-xl font-bold text-primary">{recommendedProduct.name}</h3>
                        <p className="text-foreground/90">{recommendation.justification}</p>
                        
                        {recommendedProduct.parsedPricingCycles && recommendedProduct.parsedPricingCycles.length > 0 && (
                            <div className="text-lg font-semibold">
                                Starting from {recommendedProduct.parsedPricingCycles[0].displayPrice}
                            </div>
                        )}
                        
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleOrderNow(recommendedProduct.pid)} size="lg" className="ml-auto">
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Order Now
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
