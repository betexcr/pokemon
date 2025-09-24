'use client';

import { createContext, useContext, ReactNode } from 'react';
import { ToastContainer, useToast } from './Toast';

interface ToastContextType {
  addToast: (toast: Parameters<ReturnType<typeof useToast>['addToast']>[0]) => void;
  removeToast: (id: string) => void;
  showChatNotification: (message: string, onClick?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, addToast, removeToast, showChatNotification } = useToast();

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showChatNotification }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}
