'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * AutoRefresh — rafraîchit silencieusement les données de la page
 * toutes les 15 secondes via router.refresh() (sans rechargement complet).
 */
export default function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs]);

  // Composant invisible — aucun rendu visuel
  return null;
}
