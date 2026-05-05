'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiLogin } from '@/lib/api';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiLogin(email, password);

      const maxAge = 60 * 60 * 24;
      document.cookie = `claridoc_token=${data.access}; path=/; max-age=${maxAge}`;
      document.cookie = `claridoc_role=${data.user.role}; path=/; max-age=${maxAge}`;

      if (data.user.role === 'SUPERADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Arrière-plan animé */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgGrid} />
      </div>

      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M4 6C4 4.895 4.895 4 6 4H22C23.105 4 24 4.895 24 6V22C24 23.105 23.105 24 22 24H6C4.895 24 4 23.105 4 22V6Z"
                fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"
              />
              <path d="M9 9H19M9 14H16M9 19H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className={styles.logoText}>ClariDoc<span>Pro</span></span>
        </Link>

        {/* Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1>Bon retour 👋</h1>
            <p>Connectez-vous à votre espace ClariDoc</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Email */}
            <div className={styles.inputGroup}>
              <label htmlFor="login-email">Adresse email</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M1.5 5.5L8 9.5L14.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  className={styles.inputField}
                  placeholder="vous@entreprise.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className={styles.inputGroup}>
              <label htmlFor="login-password">Mot de passe</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="8" cy="10.5" r="1" fill="currentColor" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.inputField}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8Z" stroke="currentColor" strokeWidth="1.4" />
                      <circle cx="8" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.4" />
                      <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8Z" stroke="currentColor" strokeWidth="1.4" />
                      <circle cx="8" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mot de passe oublié */}
            <div className={styles.forgotRow}>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Erreur */}
            {error && (
              <div className={styles.errorBox} role="alert">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L15 14H1L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M8 6V9M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  Se connecter
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className={styles.cardFooter}>
            <span>Pas encore de compte ?</span>
            <Link href="/register">Créer un compte</Link>
          </div>
        </div>

        <p className={styles.legal}>
          © {new Date().getFullYear()} ClariDoc Pro · Tous droits réservés
        </p>
      </div>
    </div>
  );
}
