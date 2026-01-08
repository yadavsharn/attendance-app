import React, { createContext, useContext, useEffect, useState } from 'react';

// Simplified User type
export interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for token
    const token = localStorage.getItem('facecheck_token');
    const storedUser = localStorage.getItem('facecheck_user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save session
      localStorage.setItem('facecheck_token', data.token);
      localStorage.setItem('facecheck_user', JSON.stringify(data.user));
      setUser(data.user);

      return { error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // For now, sign up is disabled or just mock logic as user requested Admin credentials
    return { error: new Error('Registration is currently disabled. Please use the Admin login.') };
  };

  const signOut = async () => {
    localStorage.removeItem('facecheck_token');
    localStorage.removeItem('facecheck_user');
    setUser(null);
  };

  // For this migration, any logged-in user is considered an Admin
  const isAdmin = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      isAdmin,
      isManager: isAdmin, // For now, treat admin as manager too
    }}>
      {children}
    </AuthContext.Provider>
  );
};
