'use client';

import { useState, useEffect } from 'react';
import { X, MessageCircle, Bell } from 'lucide-react';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastComponent({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastStyles = () => {
    // Base uses design tokens for dark/light modes
    const base = 'bg-surface border border-border text-text';
    return base;
  };

  const getAccentBg = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-rose-500';
      default:
        return 'bg-primary/80';
    }
  };

  const getAccentText = () => {
    switch (toast.type) {
      case 'success':
        return 'text-emerald-400';
      case 'warning':
        return 'text-amber-400';
      case 'error':
        return 'text-rose-400';
      default:
        return 'text-primary';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`
        relative transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        w-[320px] rounded-xl shadow-xl pointer-events-auto
        ${getToastStyles()}
      `}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${getAccentBg()}`} />
      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 text-xl ${getAccentText()}`}>
            {typeof getIcon() === 'string' ? (
              <span className="leading-none">{getIcon()}</span>
            ) : (
              getIcon()
            )}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-base font-semibold leading-5 tracking-tight text-text">{toast.title}</p>
            {toast.message && (
              <p className="mt-1 text-sm leading-5 text-muted">{toast.message}</p>
            )}
            {toast.action && (
              <div className="mt-2">
                <button
                  onClick={toast.action.onClick}
                  className={`text-sm font-medium underline hover:no-underline ${getAccentText()}`}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleRemove}
              className="inline-flex text-muted hover:text-text focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showChatNotification = (message: string, onClick?: () => void) => {
    addToast({
      type: 'info',
      title: 'New Chat Message',
      message,
      duration: 4000,
      action: onClick ? {
        label: 'View Chat',
        onClick
      } : undefined
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    showChatNotification,
  };
}
