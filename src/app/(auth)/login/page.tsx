import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - SNBD Client Hub',
};

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-2 text-foreground">Welcome Back!</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">Sign in to access your dashboard.</p>
      <LoginForm />
    </>
  );
}
