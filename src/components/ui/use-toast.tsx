"use client";

import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
};

type State = {
  toasts: Toast[];
};

type Action =
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'UPDATE_TOAST'; toast: Partial<Toast> }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts],
      };
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case 'DISMISS_TOAST':
      const { toastId } = action;
      // Depending on how you want to handle dismiss, you might add a 'dismissed' status
      // For now, let's just mark for removal
      return {
        ...state,
        toasts: state.toasts.filter((t) => (toastId ? t.id !== toastId : true)), // Dismiss all if no id
      };
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      throw new Error();
  }
};

const toastContext = React.createContext<
  | {
      toast: ({ ...props }: Omit<Toast, 'id'>) => { id: string };
      dismiss: (toastId?: string) => void;
      toasts: Toast[];
    }
  | undefined
>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] });

  const addToast = React.useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = uuidv4();
      dispatch({ type: 'ADD_TOAST', toast: { id, ...toast } });
      return { id };
    },
    []
  );

  const dismiss = React.useCallback((toastId?: string) => {
    dispatch({ type: 'DISMISS_TOAST', toastId });
  }, []);

  const remove = React.useCallback((toastId?: string) => {
    dispatch({ type: 'REMOVE_TOAST', toastId });
  }, []);

  // Effect to automatically remove toasts after their duration
  React.useEffect(() => {
    state.toasts.forEach((t) => {
      if (t.duration !== Infinity && t.duration !== undefined) {
        const timer = setTimeout(() => remove(t.id), t.duration || 5000); // Default 5s
        return () => clearTimeout(timer);
      }
    });
  }, [state.toasts, remove]);

  return (
    <toastContext.Provider
      value={React.useMemo(
        () => ({
          toasts: state.toasts,
          toast: addToast,
          dismiss,
        }),
        [state.toasts, addToast, dismiss]
      )}
    >
      {children}
    </toastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(toastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
