
"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bot, Loader2, Sparkles, ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { recommendHosting, type HostingRecommenderOutput, type HostingRecommenderInput } from '@/ai/flows/hosting-recommender-flow';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

type FormData = Omit<HostingRecommenderInput, 'availableProducts'>;

const questions = [
  { id: 'projectType', title: 'What kind of website are you building?', options: ['Blog / Personal', 'Portfolio / Brochure', 'Business Website', 'E-commerce Store', 'Other'] },
  { id: 'skillLevel', title: 'What is your technical comfort level?', options: ['Beginner', 'Intermediate', 'Expert'] },
  { id: 'trafficEstimate', title: 'How much monthly traffic do you expect?', options: ['Low (Under 1,000 visits)', 'Medium (1,000 - 10,000 visits)', 'High (Over 10,000 visits)'] },
  { id: 'mainPriority', title: 'What is most important to you?', options: ['Lowest Price', 'Fastest Speed', 'Top-tier Security', 'Ease of Use'] },
  { id: 'projectDescription', title: 'Briefly describe your project', type: 'textarea', placeholder: 'Tell us a bit more, like "I\'m selling handmade jewelry" or "It\'s a fan site for a TV show".' },
];

export default function AiHosterPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Partial<FormData>>({
        projectType: '',
        skillLevel: '',
        trafficEstimate: '',
        mainPriority: '',
        projectDescription: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<HostingRecommenderOutput | null>(null);
    const [recommendedProduct, setRecommendedProduct] = useState<Product | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/data/products');
                if (!response.ok) throw new Error('Failed to fetch product list.');
                const data = await response.json();
                if (data.products) setAllProducts(data.products);
            } catch (err) {
                toast({ title: "Error", description: "Could not load hosting products. Please try again later.", variant: "destructive" });
                console.error(err);
            }
        };
        fetchProducts();
    }, [toast]);

    const handleNext = () => {
        const currentQuestionId = questions[currentStep].id as keyof FormData;
        if (formData[currentQuestionId]?.trim() === '' && currentQuestionId !== 'projectDescription') {
             toast({ title: "Selection Required", description: "Please make a selection to continue.", variant: "destructive" });
             return;
        }
        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleRadioChange = (id: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, projectDescription: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (allProducts.length === 0) {
            setError("Hosting product data is not available. Cannot get a recommendation right now.");
            return;
        }

        setIsLoading(true);
        setRecommendation(null);
        setRecommendedProduct(null);
        setError(null);

        try {
            const finalData = formData as Required<Omit<FormData, 'availableProducts'>>;
            const result = await recommendHosting({
                ...finalData,
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

    const progressValue = ((currentStep + 1) / questions.length) * 100;
    const currentQuestion = questions[currentStep];
    const isLastStep = currentStep === questions.length - 1;

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center">
                <Bot className="h-12 w-12 mx-auto text-primary" />
                <h1 className="text-3xl font-bold text-foreground mt-4">AI Hosting Advisor</h1>
                <p className="text-muted-foreground mt-2">
                    Answer a few questions and our AI will recommend the perfect hosting plan for you.
                </p>
            </div>
            
            { !recommendation && !isLoading && (
                <Card className="shadow-lg transition-all">
                    <CardHeader>
                        <Progress value={progressValue} className="w-full h-2" />
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="p-6 min-h-[250px]">
                            <h2 className="text-xl font-semibold mb-4">{currentQuestion.title}</h2>
                            {currentQuestion.type === 'textarea' ? (
                                <Textarea
                                    id={currentQuestion.id}
                                    value={formData.projectDescription}
                                    onChange={handleTextChange}
                                    className="min-h-[120px] text-base"
                                    placeholder={currentQuestion.placeholder}
                                />
                            ) : (
                                <RadioGroup 
                                    value={formData[currentQuestion.id as keyof FormData]} 
                                    onValueChange={(val) => handleRadioChange(currentQuestion.id as keyof FormData, val)}
                                    className="space-y-2"
                                >
                                    {currentQuestion.options?.map(option => (
                                        <div key={option} className="flex items-center space-x-2 p-3 rounded-md border has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                                            <RadioGroupItem value={option} id={option} />
                                            <Label htmlFor={option} className="text-base font-normal flex-1 cursor-pointer">{option}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                            {isLastStep ? (
                                <Button type="submit" disabled={isLoading || allProducts.length === 0} className="w-full md:w-auto">
                                    <Sparkles className="mr-2 h-4 w-4" /> Get Recommendation
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleNext}>
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </Card>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {isLoading && (
                <div className="text-center p-6">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Our AI is analyzing your answers... this may take a moment.</p>
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
                    <CardFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setRecommendation(null); setRecommendedProduct(null); setCurrentStep(0); }} className="ml-auto">
                           Start Over
                        </Button>
                         <Button onClick={() => handleOrderNow(recommendedProduct.pid)} size="lg">
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Order Now
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
