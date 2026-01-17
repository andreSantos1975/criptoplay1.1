'use client';

import * as React from 'react';
import { useToast } from './use-toast.tsx';
import styles from './toast.module.css';
import { X } from 'lucide-react'; // Importar o ícone X

export function Toaster() {
  const { toasts, dismiss } = useToast(); // Obter a função dismiss

  return (
    <div className={styles.toasterContainer}>
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            className={`${styles.toast} ${
              toast.variant === 'destructive' ? styles.destructive : styles.default
            }`}
          >
            <div className={styles.toastContent}>
              {toast.title && <div className={styles.toastTitle}>{toast.title}</div>}
              {toast.description && (
                <div className={styles.toastDescription}>{toast.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className={styles.closeButton}
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
