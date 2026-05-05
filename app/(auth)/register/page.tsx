'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRegister, apiVerifyOTP } from '@/lib/api';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  
  // Wizard steps: 1 = Form, 2 = OTP
  const [step, setStep] = useState(1);
  
  const [form, setForm] = useState({
    nom_societe: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    telephone: '',
  });
  
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!form.telephone) {
      setError('Le numéro de téléphone est requis.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRegister({
        nom_societe: form.nom_societe,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        telephone: form.telephone,
      });
      // Si on reçoit otp_required, on passe à l'étape 2
      if (res.otp_required) {
        setStep(2);
      } else {
        // Fallback s'il n'y a pas d'OTP
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Le code OTP doit contenir 6 chiffres.');
      return;
    }

    setLoading(true);
    try {
      await apiVerifyOTP(form.email, otp);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Code OTP invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.bg} aria-hidden="true">
          <div className={styles.bgOrb1} />
          <div className={styles.bgOrb2} />
        </div>
        <div className={`${styles.successCard} glass animate-fade-in-up`}>
          <div className={styles.successIcon}>✓</div>
          <h2 className="title-md">Compte activé avec succès !</h2>
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
            Vous allez être redirigé vers la page de connexion dans quelques secondes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgGrid} />
      </div>

      <div className={styles.container}>
        {/* Logo */}
        <div className={`${styles.logo} animate-fade-in`}>
          <div className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 6C4 4.895 4.895 4 6 4H22C23.105 4 24 4.895 24 6V22C24 23.105 23.105 24 22 24H6C4.895 24 4 23.105 4 22V6Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 9H19M9 14H16M9 19H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span className={styles.logoText}>ClariDoc<span>Pro</span></span>
        </div>

        {/* Card */}
        <div className={`${styles.card} glass animate-fade-in-up delay-1`}>
          
          {step === 1 && (
            <>
              <div className={styles.cardHeader}>
                <h1 className="title-md">Créer votre espace</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Inscription gratuite — Aucune carte requise
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className={styles.form}>
                {/* Société */}
                <div className="input-group">
                  <label htmlFor="reg-societe">Nom de la société</label>
                  <input id="reg-societe" type="text" className="input" placeholder="Ex: Banque Centrale"
                    value={form.nom_societe} onChange={e => update('nom_societe', e.target.value)} required />
                </div>

                {/* Prénom + Nom */}
                <div className={styles.row}>
                  <div className="input-group">
                    <label htmlFor="reg-firstname">Prénom</label>
                    <input id="reg-firstname" type="text" className="input" placeholder="Jean"
                      value={form.first_name} onChange={e => update('first_name', e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label htmlFor="reg-lastname">Nom</label>
                    <input id="reg-lastname" type="text" className="input" placeholder="Dupont"
                      value={form.last_name} onChange={e => update('last_name', e.target.value)} required />
                  </div>
                </div>

                {/* Email + Téléphone */}
                <div className={styles.row}>
                  <div className="input-group">
                    <label htmlFor="reg-email">Adresse email</label>
                    <input id="reg-email" type="email" className="input" placeholder="vous@entreprise.com"
                      value={form.email} onChange={e => update('email', e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Téléphone</label>
                    <PhoneInput
                      international
                      defaultCountry="CI"
                      value={form.telephone}
                      onChange={(value) => update('telephone', value || '')}
                      className="input"
                      style={{ padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}
                    />
                  </div>
                </div>

                {/* Mots de passe */}
                <div className={styles.row}>
                  <div className="input-group">
                    <label htmlFor="reg-password">Mot de passe</label>
                    <input id="reg-password" type="password" className="input" placeholder="Min. 8 caractères"
                      value={form.password} onChange={e => update('password', e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label htmlFor="reg-confirm">Confirmation</label>
                    <input id="reg-confirm" type="password" className="input" placeholder="Répétez"
                      value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)} required />
                  </div>
                </div>

                {/* Indicateur de force */}
                {form.password && (
                  <div className={styles.strengthBar}>
                    <div className={`${styles.strengthFill} ${
                      form.password.length >= 12 ? styles.strong :
                      form.password.length >= 8  ? styles.medium : styles.weak
                    }`} />
                  </div>
                )}

                {error && (
                  <div className={styles.errorBox} role="alert">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1L15 14H1L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M8 6V9M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary"
                  style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }} disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : 'Suivant'}
                </button>
              </form>

              <div className={styles.cardFooter}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Déjà un compte ?</span>
                <Link href="/login" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Se connecter</Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.cardHeader}>
                <h1 className="title-md">Vérification OTP</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Un code à 6 chiffres a été envoyé à {form.email}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className={styles.form}>
                <div className="input-group">
                  <label htmlFor="reg-otp" style={{ textAlign: 'center' }}>Code OTP</label>
                  <input 
                    id="reg-otp" 
                    type="text" 
                    className="input" 
                    placeholder="123456"
                    maxLength={6}
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                    required 
                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                  />
                </div>

                {error && (
                  <div className={styles.errorBox} role="alert">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary"
                  style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', marginTop: '1rem' }} disabled={loading || otp.length !== 6}>
                  {loading ? <span className={styles.spinner} /> : 'Vérifier et activer'}
                </button>
                
                <button type="button" className="btn" onClick={() => setStep(1)}
                  style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', marginTop: '0.5rem', background: 'transparent', border: '1px solid var(--color-border)' }}>
                  Retour
                </button>
              </form>
            </>
          )}

        </div>

        <p className={`${styles.legal} animate-fade-in delay-3`}>
          © {new Date().getFullYear()} ClariDoc Pro · Tous droits réservés
        </p>
      </div>
    </div>
  );
}
