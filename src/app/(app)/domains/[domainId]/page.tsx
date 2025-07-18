
"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Domain } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Globe,
  RefreshCw,
  PlusCircle,
  Lock,
  Book,
  MoveRight,
  ShieldAlert,
  Save,
  Info
} from 'lucide-react';

type Nameservers = {
  ns1: string;
  ns2: string;
  ns3?: string;
  ns4?: string;
  ns5?: string;
};

const SidebarLink = ({ children, active = false }: { children: React.ReactNode, active?: boolean }) => (
    <Button variant={active ? "secondary" : "ghost"} className="w-full justify-start">
        {children}
    </Button>
);

const ActionButton = ({ icon: Icon, children }: { icon: React.ElementType, children: React.ReactNode }) => (
    <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
        <Icon className="h-4 w-4" /> {children}
    </Button>
);

export default function ManageDomainPage() {
  const { user, token } = useAuth();
  const params = useParams();
  const domainId = params.domainId as string;
  const { toast } = useToast();
  const router = useRouter();

  const [domain, setDomain] = useState<Domain | null>(null);
  const [nameservers, setNameservers] = useState<Nameservers>({ ns1: '', ns2: '' });
  const [nsOption, setNsOption] = useState('custom');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id && domainId && token) {
      setIsLoading(true);
      fetch(`/api/domains/${domainId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.message || "Failed to fetch domain details") });
        }
        return res.json();
      })
      .then(data => {
        if (data.domain) {
          setDomain(data.domain);
          const currentNs = data.domain.nameservers || [];
          setNameservers({
            ns1: currentNs[0] || '',
            ns2: currentNs[1] || '',
            ns3: currentNs[2] || '',
            ns4: currentNs[3] || '',
            ns5: currentNs[4] || '',
          });
        } else {
          toast({ title: "Error", description: "Domain not found.", variant: "destructive" });
          router.push('/domains');
        }
      })
      .catch(error => {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      })
      .finally(() => setIsLoading(false));
    }
  }, [user, domainId, token, toast, router]);

  const handleNsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNameservers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // In a real scenario, you might have different logic for 'default' nameservers
    // For now, we'll just submit the values in the text boxes regardless of the radio button
    
    try {
        const response = await fetch(`/api/domains/${domainId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(nameservers)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to update nameservers.");
        }
        toast({ title: "Success", description: "Nameservers have been updated successfully." });
    } catch(error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
            <div className="lg:col-span-3">
                <Skeleton className="h-96" />
            </div>
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Domain Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested domain could not be loaded.</p>
        <Button asChild className="mt-4"><Link href="/domains">Back to Domains</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/domains">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
            <p className="text-sm text-muted-foreground">Managing Domain</p>
            <h1 className="text-2xl font-bold text-foreground">{domain.domainName}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebars */}
        <aside className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manage</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              <SidebarLink>Overview</SidebarLink>
              <SidebarLink>Auto Renew</SidebarLink>
              <SidebarLink active>Nameservers</SidebarLink>
              <SidebarLink>Registrar Lock</SidebarLink>
              <SidebarLink>Addons</SidebarLink>
              <SidebarLink>Push Domain</SidebarLink>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
                <ActionButton icon={RefreshCw}>Renew Domain</ActionButton>
                <ActionButton icon={PlusCircle}>Register a New Domain</ActionButton>
                <ActionButton icon={MoveRight}>Transfer in a Domain</ActionButton>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">
            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Nameservers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <Alert>
                           <Info className="h-4 w-4" />
                           <AlertTitle>Heads up!</AlertTitle>
                           <AlertDescription>
                             You can change where your domain points to here. Please be aware changes can take up to 24 hours to propagate.
                           </AlertDescription>
                         </Alert>
                         <RadioGroup value={nsOption} onValueChange={setNsOption}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="default" id="default-ns" />
                                <Label htmlFor="default-ns">Use default nameservers</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="custom-ns" />
                                <Label htmlFor="custom-ns">Use custom nameservers (enter below)</Label>
                            </div>
                         </RadioGroup>
                         <div className="space-y-4 pl-6 border-l-2 ml-2">
                            <div>
                                <Label htmlFor="ns1">Nameserver 1</Label>
                                <Input id="ns1" value={nameservers.ns1} onChange={handleNsChange} disabled={nsOption === 'default'} />
                            </div>
                             <div>
                                <Label htmlFor="ns2">Nameserver 2</Label>
                                <Input id="ns2" value={nameservers.ns2} onChange={handleNsChange} disabled={nsOption === 'default'} />
                            </div>
                             <div>
                                <Label htmlFor="ns3">Nameserver 3</Label>
                                <Input id="ns3" value={nameservers.ns3} onChange={handleNsChange} disabled={nsOption === 'default'} />
                            </div>
                             <div>
                                <Label htmlFor="ns4">Nameserver 4</Label>
                                <Input id="ns4" value={nameservers.ns4} onChange={handleNsChange} disabled={nsOption === 'default'} />
                            </div>
                             <div>
                                <Label htmlFor="ns5">Nameserver 5</Label>
                                <Input id="ns5" value={nameservers.ns5} onChange={handleNsChange} disabled={nsOption === 'default'} />
                            </div>
                         </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Change Nameservers
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </main>
      </div>
    </div>
  );
}
