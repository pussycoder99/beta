"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { User } from '@/types';

export default function ProfileSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email, // Usually email is not editable or requires verification
        companyName: user.companyName,
        address1: user.address1,
        city: user.city,
        state: user.state,
        postcode: user.postcode,
        country: user.country,
        phoneNumber: user.phoneNumber,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Updated profile data (mock):", formData);
    toast({ title: 'Profile Updated', description: 'Your profile information has been saved (mocked).' });
    setIsSaving(false);
    // Potentially refetch user data or update context if API was real
  };

  if (authLoading) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <h1 className="text-3xl font-bold">Loading Profile...</h1>
            </div>
        </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
      </div>

      <Card className="shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Keep your personal details up to date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={formData.firstName || ''} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={formData.lastName || ''} onChange={handleChange} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} className="mt-1" disabled />
              <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed here.</p>
            </div>
            <div>
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input id="companyName" value={formData.companyName || ''} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" type="tel" value={formData.phoneNumber || ''} onChange={handleChange} className="mt-1" />
            </div>
          </CardContent>
          
          <CardHeader className="border-t pt-6">
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
              <Label htmlFor="address1">Address Line 1</Label>
              <Input id="address1" value={formData.address1 || ''} onChange={handleChange} className="mt-1" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={formData.city || ''} onChange={handleChange} className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="state">State/Region</Label>
                    <Input id="state" value={formData.state || ''} onChange={handleChange} className="mt-1" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="postcode">Zip/Postal Code</Label>
                    <Input id="postcode" value={formData.postcode || ''} onChange={handleChange} className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={formData.country || ''} onChange={handleChange} className="mt-1" />
                    {/* Ideally this would be a select dropdown with country codes */}
                </div>
            </div>
          </CardContent>

          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving} className="ml-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
