'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  getRedirectResult,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Handle Google redirect result on app load
    const handleRedirectResult = async () => {
      if (!auth) return;
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // redirect sign-in handled by onAuthStateChanged
        }
      } catch (error) {
        console.warn('Error handling Google redirect result (non-critical):', error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    }, (error) => {
      console.warn('Firebase auth error (non-critical):', error);
      setUser(null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Authentication service is currently unavailable. Please try again later.');
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (!auth) {
      throw new Error('Authentication service is currently unavailable. Please try again later.');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      throw new Error('Authentication service is currently unavailable. Please try again later.');
    }
    
    try {
      const provider = new GoogleAuthProvider();
      
      // Add scopes to get profile information including photo
      provider.addScope('profile');
      provider.addScope('email');
      
      // Optional: Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account' // Forces account selection
      });

      const result = await signInWithPopup(auth, provider);
      
      // onAuthStateChanged handles the rest
      
    } catch (error: unknown) {
      console.error('Error during Google sign-in:', error);
      
      // Handle specific error cases
      const errorObj = error as { code?: string; message?: string };
      if (errorObj.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (errorObj.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (errorObj.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email using a different sign-in method.');
      } else {
        throw new Error(errorObj.message || 'Failed to sign in with Google');
      }
    }
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    if (!auth) {
      throw new Error('Authentication service is currently unavailable. Please try again later.');
    }
    
    try {
      const provider = new OAuthProvider('microsoft.com');
      
      // Add scopes to get profile information
      provider.addScope('user.read');
      provider.addScope('email');
      provider.addScope('profile');
      
      // Optional: Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      
      // onAuthStateChanged handles the rest
      
    } catch (error: unknown) {
      console.error('Error during Microsoft sign-in:', error);
      
      // Handle specific error cases
      const errorObj = error as { code?: string; message?: string };
      if (errorObj.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (errorObj.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (errorObj.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email using a different sign-in method.');
      } else {
        throw new Error(errorObj.message || 'Failed to sign in with Microsoft');
      }
    }
  }, []);

  const signInWithTwitter = useCallback(async () => {
    if (!auth) {
      throw new Error('Authentication service is currently unavailable. Please try again later.');
    }
    
    try {
      const provider = new OAuthProvider('twitter.com');
      
      // Add scopes to get profile information
      provider.addScope('email');
      provider.addScope('profile');
      
      // Optional: Set custom parameters
      provider.setCustomParameters({
        lang: 'en'
      });

      const result = await signInWithPopup(auth, provider);
      
      // onAuthStateChanged handles the rest
      
    } catch (error: unknown) {
      console.error('Error during Twitter sign-in:', error);
      
      // Handle specific error cases
      const errorObj = error as { code?: string; message?: string };
      if (errorObj.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (errorObj.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (errorObj.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email using a different sign-in method.');
      } else {
        throw new Error(errorObj.message || 'Failed to sign in with Twitter');
      }
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth) {
      throw new Error('Authentication service is currently unavailable. Please try again later.');
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithTwitter,
    logout,
  }), [user, loading, signIn, signUp, signInWithGoogle, signInWithMicrosoft, signInWithTwitter, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
