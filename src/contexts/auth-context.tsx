
"use client";

import type { User } from '@/types';
// API functions will now point to the (modified) whmcs-mock-api.ts which contains live calls
import { validateLoginAPI, addClientAPI, getUserDetailsAPI } from '@/lib/whmcs-mock-api';
import { useRouter, usePathname } from 'next/navigation';
import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';

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
    // This token is now a placeholder like "whmcs-session-for-USERID"
    // or "mock-jwt-token-for-USERID" if login was successful
    const userIdPrefix = "whmcs-session-for-"; // Or your chosen prefix
    const mockJwtPrefix = "mock-jwt-token-for-";

    let userId: string | null = null;

    if (storedToken.startsWith(userIdPrefix)) {
      userId = storedToken.replace(userIdPrefix, '');
    } else if (storedToken.startsWith(mockJwtPrefix)) {
      userId = storedToken.replace(mockJwtPrefix, '');
    }
    
    if (userId) {
      try {
        const { user: fetchedUser } = await getUserDetailsAPI(userId);
        if (fetchedUser) {
          setUser(fetchedUser);
          setToken(storedToken); // Keep the same placeholder token
        } else {
          localStorage.removeItem('authToken');
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error("Error fetching user details from token:", error);
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
    if (!isLoading && !user && !pathname.startsWith('/login') && !pathname.startsWith('/register') && pathname !== '/') {
      router.push('/login');
    }
  }, [isLoading, user, pathname, router]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Call validateLoginAPI which now interacts with live WHMCS
      // It expects the raw password.
      const response = await validateLoginAPI(email, password);
      if (response.result === 'success' && response.userId) {
        // Fetch full user details using the userId from WHMCS
        const userDetailsResponse = await getUserDetailsAPI(response.userId);
        if (userDetailsResponse.user) {
          setUser(userDetailsResponse.user);
          // Create a placeholder token. In production, your backend might issue a real JWT/session here.
          const sessionToken = `mock-jwt-token-for-${response.userId}`;
          setToken(sessionToken);
          localStorage.setItem('authToken', sessionToken);
          router.push('/dashboard');
        } else {
          throw new Error('Failed to fetch user details after login.');
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      throw error; // Re-throw to be caught by LoginForm
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id'> & {password: string}) => {
    setIsLoading(true);
    try {
      // Pass all data including password to addClientAPI.
      // WHMCS's AddClient API handles password hashing.
      const response = await addClientAPI(userData);
      if (response.result === 'success' && response.userId) {
        // Registration successful, redirect to login
        router.push('/login');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      throw error; // Re-throw to be caught by RegisterForm
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

