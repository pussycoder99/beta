
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Palette, Bug, Shield, PlusCircle, History, ShoppingCart, CreditCard, Link as LinkIcon, Globe } from 'lucide-react';

const logData = [
    {
        icon: Globe,
        title: "Feature: Integrated Domain Ordering & Configuration",
        description: "Implemented a seamless domain ordering flow. Users can now search for a domain, configure it with addons and nameservers, select a payment method, and proceed directly to a WHMCS-generated invoice for payment, all from within the application.",
        timestamp: "2024-07-30 10:00 AM",
        tags: ["feature", "domains", "api", "billing"],
    },
    {
        icon: CreditCard,
        title: "Feature: Dynamic Payment Methods from WHMCS",
        description: "The 'Add Funds' and 'Domain Configuration' pages now fetch available payment methods directly from the WHMCS API, ensuring users always see the correct payment options.",
        timestamp: "2024-07-30 09:45 AM",
        tags: ["feature", "billing", "api"],
    },
    {
        icon: LinkIcon,
        title: "Enhancement: Add Funds to Invoice Redirect",
        description: "Improved the 'Add Funds' workflow. After submitting the amount, users are now automatically redirected to the generated WHMCS invoice to complete their payment.",
        timestamp: "2024-07-30 09:30 AM",
        tags: ["enhancement", "billing", "ui"],
    },
    {
        icon: Bug,
        title: "Fix: Domain Configuration Page Crash",
        description: "Resolved a build error on the Domain Configuration page caused by an incorrect icon import. Replaced the non-existent 'Dns' icon with the 'Database' icon.",
        timestamp: "2024-07-30 09:15 AM",
        tags: ["fix", "domains", "ui"],
    },
    {
        icon: ShoppingCart,
        title: "Feature: Integrated Service & Domain Order Pages",
        description: "Created new pages for ordering services and registering domains. The service order page fetches products from WHMCS, and the domain registration page mimics the WHMCS layout, preparing for full API integration.",
        timestamp: "2024-07-29 11:30 AM",
        tags: ["feature", "services", "domains", "ui"],
    },
    {
        icon: PlusCircle,
        title: "Feature: Changelog Page Added",
        description: "Created a new page to display a timeline of recent application updates and changes. Added a link to the main navigation.",
        timestamp: "2024-07-29 11:15 AM",
        tags: ["feature", "ui"],
    },
    {
        icon: Palette,
        title: "UI: Application Switched to Light Theme",
        description: "The entire application has been updated to use a light theme with a white background, red accents, and black text, replacing the previous dark theme.",
        timestamp: "2024-07-29 11:05 AM",
        tags: ["ui", "theme"],
    },
    {
        icon: Bug,
        title: "Fix: Dashboard Layout and Component Imports",
        description: "Resolved a runtime error by importing the Label and Input components. Re-structured the dashboard to a two-column layout to match the classic WHMCS client area design.",
        timestamp: "2024-07-29 10:50 AM",
        tags: ["fix", "dashboard", "ui"],
    },
    {
        icon: Shield,
        title: "Security: WHMCS API Connection Hardened",
        description: "Improved error handling for WHMCS API calls. Added an example environment file and refined the API utility function to prevent server crashes on failed connections.",
        timestamp: "2024-07-29 10:30 AM",
        tags: ["security", "api", "fix"],
    },
    {
        icon: FileText,
        title: "Feature: Live WHMCS API Integration",
        description: "Connected the application to a live WHMCS instance by adding a `.env.local` file for API credentials. The login flow now authenticates against the live WHMCS API.",
        timestamp: "2024-07-29 10:15 AM",
        tags: ["feature", "api", "auth"],
    }
];

const tagColors: { [key: string]: string } = {
    feature: "bg-blue-500",
    ui: "bg-purple-500",
    fix: "bg-green-600",
    security: "bg-red-600",
    api: "bg-orange-500",
    auth: "bg-yellow-500 text-black",
    dashboard: "bg-indigo-500",
    theme: "bg-pink-500",
    domains: "bg-teal-500",
    services: "bg-cyan-500",
    billing: "bg-lime-600",
    enhancement: "bg-sky-500",
};


export default function LogsPage() {
  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Application Changelog</h1>
        </div>
        <p className="text-muted-foreground">
            A timeline of recent changes and updates made to the application by the AI.
        </p>

        <div className="relative pl-6 after:absolute after:inset-y-0 after:left-9 after:w-px after:bg-border">
            {logData.map((log, index) => (
                <div key={index} className="grid grid-cols-[auto_1fr] items-start gap-x-6 gap-y-2 mb-8">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 -ml-6 z-10 border-4 border-background">
                       <log.icon className="size-6 text-primary" />
                    </div>
                    <div className="pt-1.5">
                        <h3 className="text-lg font-semibold text-foreground">{log.title}</h3>
                        <p className="text-sm text-muted-foreground">{log.timestamp}</p>
                    </div>
                    
                    <div className="col-start-2">
                        <p className="text-foreground/90">{log.description}</p>
                         <div className="mt-2 flex gap-2 flex-wrap">
                            {log.tags.map(tag => (
                                <Badge key={tag} className={`capitalize ${tagColors[tag] || 'bg-gray-500'} hover:${tagColors[tag] || 'bg-gray-500'}`}>
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
