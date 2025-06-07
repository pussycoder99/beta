
"use client";

import type { User } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  token: string | null; // This will be the placeholder token like "mock-jwt-token-for-USERID"
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

  const fetchUserWithToken = useCallback(async (storedToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response fetching user' }));
        throw new Error(errorData.message || `Failed to fetch user details: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        setToken(storedToken);
      } else {
        throw new Error('User data not found in /api/auth/user response');
      }
    } catch (error) {
      console.error("Error fetching user with token:", error);
      localStorage.removeItem('authToken');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      fetchUserWithToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [fetchUserWithToken]);

  useEffect(() => {
    if (!isLoading && !user && !pathname.startsWith('/login') && !pathname.startsWith('/register') && pathname !== '/') {
      router.push('/login');
    }
  }, [isLoading, user, pathname, router]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('authToken', data.token);
        router.push('/dashboard');
      } else {
        throw new Error(data.message || 'Login response missing user or token.');
      }
    } catch (error) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      let errorMessage = (error as Error).message || 'Login failed. Please try again.';
      try {
        // Check if errorMessage itself is a stringified JSON containing another 'message'
        const parsedMessageContainer = JSON.parse(errorMessage);
        if (parsedMessageContainer && parsedMessageContainer.message) {
          errorMessage = parsedMessageContainer.message;
        }
      } catch (parseError) {
        // It wasn't a JSON string, or didn't have an inner .message, so keep the original errorMessage
      }
      throw new Error(errorMessage); 
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id'> & {password: string}) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      router.push('/login');
    } catch (error) {
      let errorMessage = (error as Error).message || 'Registration failed. Please try again.';
      try {
        const parsedMessageContainer = JSON.parse(errorMessage);
        if (parsedMessageContainer && parsedMessageContainer.message) {
          errorMessage = parsedMessageContainer.message;
        }
      } catch (parseError) {
        // Not a JSON string, keep original
      }
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
