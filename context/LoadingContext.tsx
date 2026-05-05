'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import styles from './LoadingOverlay.module.css';

interface LoadingContextType {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType>({
  showLoader: () => {},
  hideLoader: () => {},
  isLoading: false,
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Traitement en cours...');

  const showLoader = useCallback((msg = 'Traitement en cours...') => {
    setMessage(msg);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoader, hideLoader, isLoading }}>
      {children}
      {isLoading && (
        <div className={styles.overlay}>
          <div className={styles.card}>
            <div className={styles.spinner}>
              <div className={styles.spinnerRing} />
              <div className={styles.spinnerLogo}>C</div>
            </div>
            <p className={styles.message}>{message}</p>
            <p className={styles.sub}>Veuillez patienter…</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
