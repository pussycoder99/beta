"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { User } from '@/types';
import { Loader2 } from 'lucide-react';

export function RegisterForm() {
  const [formData, setFormData] = useState<Omit<User, 'id'> & { password: string; confirmPassword: string }>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    address1: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    phoneNumber: '',
  });
  const { register, isLoading } = useAuth();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    // Basic validation
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password) {
       toast({ title: 'Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
      toast({ title: 'Registration Successful', description: 'Please login to continue.' });
    } catch (error) {
      toast({ title: 'Registration Failed', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name <span className="text-primary">*</span></Label>
          <Input id="firstName" value={formData.firstName} onChange={handleChange} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name <span className="text-primary">*</span></Label>
          <Input id="lastName" value={formData.lastName} onChange={handleChange} required className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email Address <span className="text-primary">*</span></Label>
        <Input id="email" type="email" value={formData.email} onChange={handleChange} required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="companyName">Company Name (Optional)</Label>
        <Input id="companyName" value={formData.companyName || ''} onChange={handleChange} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="password">Password <span className="text-primary">*</span></Label>
        <Input id="password" type="password" value={formData.password} onChange={handleChange} required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm Password <span className="text-primary">*</span></Label>
        <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required className="mt-1" />
      </div>
      
      {/* Optional fields can be added here similarly: address, city, state, postcode, country, phoneNumber */}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
