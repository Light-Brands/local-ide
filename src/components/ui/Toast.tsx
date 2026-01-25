'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Toast Provider
interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

const positionStyles: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

const typeStyles: Record<ToastType, { icon: typeof CheckCircle; color: string; bg: string }> = {
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  default: {
    icon: Info,
    color: 'text-neutral-500',
    bg: 'bg-neutral-50 dark:bg-neutral-800',
  },
};

export function ToastProvider({
  children,
  position = 'bottom-right',
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  // Only render portal after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { ...toast, id };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        // Limit max toasts
        return updated.slice(0, maxToasts);
      });

      // Auto remove after duration
      if (toast.duration !== 0) {
        const duration = toast.duration || 5000;
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }

      return id;
    },
    [maxToasts]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className={cn(
              'fixed z-toast',
              'flex flex-col gap-3',
              'pointer-events-none',
              positionStyles[position]
            )}
            aria-live="polite"
            aria-label="Notifications"
          >
            <AnimatePresence mode="popLayout">
              {toasts.map((toast) => (
                <ToastItem
                  key={toast.id}
                  toast={toast}
                  onClose={() => removeToast(toast.id)}
                  position={position}
                />
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

// Toast Item
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
  position: ToastPosition;
}

function ToastItem({ toast, onClose, position }: ToastItemProps) {
  const { type, title, description, action } = toast;
  const { icon: Icon, color, bg } = typeStyles[type];

  const isLeft = position.includes('left');
  const isCenter = position.includes('center');

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        x: isCenter ? 0 : isLeft ? -100 : 100,
        y: isCenter ? (position.includes('top') ? -20 : 20) : 0,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        x: isCenter ? 0 : isLeft ? -100 : 100,
        scale: 0.95,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      className={cn(
        'pointer-events-auto',
        'w-full max-w-sm',
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200 dark:border-neutral-800',
        'rounded-xl shadow-lg',
        'overflow-hidden'
      )}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={cn('flex-shrink-0 p-1 rounded-lg', bg)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900 dark:text-white">
            {title}
          </p>
          {description && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          )}
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className={cn(
                'mt-2 text-sm font-medium',
                'text-primary-600 dark:text-primary-400',
                'hover:text-primary-700 dark:hover:text-primary-300',
                'transition-colors duration-150'
              )}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <motion.button
          type="button"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'flex-shrink-0',
            'p-1 rounded-lg',
            'text-neutral-400 hover:text-neutral-600',
            'dark:text-neutral-500 dark:hover:text-neutral-300',
            'hover:bg-neutral-100 dark:hover:bg-neutral-800',
            'transition-colors duration-150'
          )}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Progress bar for timed toasts */}
      {toast.duration !== 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{
            duration: (toast.duration || 5000) / 1000,
            ease: 'linear',
          }}
          className={cn(
            'h-1 origin-left',
            type === 'success' && 'bg-green-500',
            type === 'error' && 'bg-red-500',
            type === 'warning' && 'bg-yellow-500',
            type === 'info' && 'bg-blue-500',
            type === 'default' && 'bg-neutral-400'
          )}
        />
      )}
    </motion.div>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast, clearAll } = context;

  return {
    toast: addToast,
    dismiss: removeToast,
    clearAll,
    success: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'success', title, ...options }),
    error: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'error', title, ...options }),
    warning: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'warning', title, ...options }),
    info: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'info', title, ...options }),
  };
}

export default ToastProvider;
