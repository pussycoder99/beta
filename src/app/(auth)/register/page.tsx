import { RegisterForm } from '@/components/auth/register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - SNBD Client Hub',
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-2 text-foreground">Create your Account</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">Join SNBD Host and manage your services with ease.</p>
      <RegisterForm />
    </>
  );
}
