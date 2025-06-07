"use client";

import type { User } from '@/types';
import { validateLoginAPI, addClientAPI, getUserDetailsAPI } from '@/lib/whmcs-mock-api';
import { useRouter, usePathname } from 'next/navigation';
import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// Helper to simulate password hashing (very basic)
const simpleHash = async (password: string) => {
  // In a real app, use a proper hashing library like bcrypt or argon2
  // This is just a placeholder and NOT secure.
  return `hashed_${password}`;
};


interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id'> & {password: string}) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserFromToken = useCallback(async (storedToken: string) => {
    setIsLoading(true);
    // In a real JWT scenario, you'd validate the token with a backend
    // and fetch user details. Here, we extract userId from mock token.
    const userId = storedToken.replace('mock-jwt-token-for-', '');
    if (userId) {
      const { user: fetchedUser } = await getUserDetailsAPI(userId);
      if (fetchedUser) {
        setUser(fetchedUser);
        setToken(storedToken);
      } else {
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
      }
    } else {
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
    }
    setIsLoading(false);
  }, []);


  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      fetchUserFromToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [fetchUserFromToken]);

  useEffect(() => {
    if (!isLoading && !user && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      router.push('/login');
    }
  }, [isLoading, user, pathname, router]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const hashedPassword = await simpleHash(password); // Simulate hashing
    const response = await validateLoginAPI(email, hashedPassword);
    if (response.result === 'success' && response.user && response.token) {
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('authToken', response.token);
      router.push('/dashboard');
    } else {
      throw new Error(response.message || 'Login failed');
    }
    setIsLoading(false);
  };

  const register = async (userData: Omit<User, 'id'> & {password: string}) => {
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...clientData } = userData; 
    // In real WHMCS, password is sent directly, not pre-hashed by client usually
    // For AddClient, WHMCS handles password hashing.
    // However, our mock API doesn't use password, so we just pass clientData.
    const response = await addClientAPI(clientData);
    if (response.result === 'success' && response.userId) {
      // Optionally auto-login or redirect to login page
      router.push('/login');
    } else {
      throw new Error(response.message || 'Registration failed');
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
