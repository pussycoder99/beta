"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { User, Shield, Lock, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Mock data for settings, in a real app this would come from API/state
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);

  const handlePasswordChange = () => {
    toast({ title: "Feature In Development", description: "Password change functionality is not yet implemented." });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile Information</CardTitle>
            <CardDescription>View and manage your personal details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Company:</strong> {user?.companyName || 'N/A'}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/settings/profile">Edit Profile</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle>
            <CardDescription>Update your account password regularly for security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" placeholder="••••••••" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" placeholder="••••••••" className="mt-1" />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handlePasswordChange} className="w-full">Update Password</Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security Settings</CardTitle>
            <CardDescription>Manage your account security options.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="2fa" className="flex flex-col space-y-1">
                <span>Two-Factor Authentication</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Enhance your account security.
                </span>
              </Label>
              <Button variant={twoFactorEnabled ? "default" : "outline"} onClick={() => { setTwoFactorEnabled(!twoFactorEnabled); toast({title: "2FA Mock", description: `2FA ${!twoFactorEnabled ? 'enabled' : 'disabled'}`})}}>
                {twoFactorEnabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </CardContent>
           <CardFooter>
             <p className="text-xs text-muted-foreground">Two-factor authentication adds an extra layer of security to your account.</p>
           </CardFooter>
        </Card>

      </div>
    </div>
  );
}
