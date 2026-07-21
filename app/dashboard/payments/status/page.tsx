'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../licence/licence.module.css';

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [countdown, setCountdown] = useState(5);

  const status    = searchParams.get('status')    || 'error';
  const reference = searchParams.get('reference') || '';

  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimeout(() => router.push('/dashboard/licence'), 50);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, router]);

  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <>
            <div className={styles.confirmIcon}>✓</div>
            <h1 className="title-md">Paiement Réussi !</h1>
            <p style={{ textAlign: 'center' }}>
              Votre paiement a été validé. Votre licence est en cours d&apos;activation.<br/>
              Vous allez recevoir un email avec votre code d&apos;activation d&apos;ici quelques instants.
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Redirection automatique dans {countdown} secondes...
            </p>
            <Link href="/dashboard/licence" className="btn btn-primary">
              Retour aux licences
            </Link>
          </>
        );

      case 'pending':
        return (
          <>
            <div className={styles.confirmIcon} style={{
              borderColor: 'var(--color-warning)',
              color: 'var(--color-warning)',
              background: 'hsla(45, 100%, 51%, 0.1)',
            }}>⏳</div>
            <h1 className="title-md">Paiement en attente</h1>
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Votre paiement est en cours de traitement.<br/>
              Dès que la transaction sera confirmée, votre licence sera activée automatiquement.
            </p>
            {reference && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                Réf : {reference}
              </p>
            )}
            <Link href="/dashboard/licence" className="btn btn-primary">
              Vérifier mes licences
            </Link>
          </>
        );

      default:
        return (
          <>
            <div className={styles.confirmIcon} style={{
              borderColor: 'var(--color-danger)',
              color: 'var(--color-danger)',
              background: 'hsla(0, 100%, 50%, 0.1)',
            }}>✕</div>
            <h1 className="title-md">Échec du paiement</h1>
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Une erreur est survenue lors du traitement de votre paiement.<br/>
              Aucun montant n&apos;a été débité ou la transaction a été annulée.
            </p>
            <Link href="/dashboard/licence" className="btn btn-primary">
              Réessayer le paiement
            </Link>
          </>
        );
    }
  };

  return (
    <div className={styles.page} style={{ justifyContent: 'center', minHeight: '60vh' }}>
      <div className={`${styles.confirmCard} glass animate-fade-in-up`}>
        {renderContent()}
      </div>
    </div>
  );
}
