'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { ToastContainer, useToast } from './Toast';

interface ToastContextType {
  addToast: (toast: Parameters<ReturnType<typeof useToast>['addToast']>[0]) => void;
  removeToast: (id: string) => void;
  showChatNotification: (message: string, onClick?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, addToast, removeToast, showChatNotification } = useToast();

  const value = useMemo(() => ({ addToast, removeToast, showChatNotification }), [addToast, removeToast, showChatNotification]);

  return (
    <ToastContext.Provider value={value}>
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
