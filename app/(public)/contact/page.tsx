'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './contact.module.css';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⬡</span>
            ClariDoc<span className={styles.logoPro}>Pro</span>
          </Link>
          <nav className={styles.navLinks}>
            <Link href="/fonctionnalites" className={styles.navLink}>Fonctionnalités</Link>
            <Link href="/tarifs" className={styles.navLink}>Tarifs</Link>
            <Link href="/contact" className={`${styles.navLink} ${styles.active}`}>Aide</Link>
          </nav>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.btnOutline}>Connexion</Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.heroGlow} />
        
        <div className={`${styles.content} animate-fade-in`}>
          <div className={styles.header}>
            <h1 className={styles.title}>Parlons de votre <span className={styles.gradient}>projet.</span></h1>
            <p className={styles.subtitle}>
              Besoin d&apos;un devis sur mesure, d&apos;une démonstration personnalisée ou d&apos;une assistance technique ? Notre équipe vous répond sous 24h.
            </p>
          </div>

          <div className={styles.grid}>
            {/* Formulaire */}
            <div className={`${styles.formCard} glass`}>
              {sent ? (
                <div className={styles.success}>
                  <div className={styles.successIcon}>✓</div>
                  <h2>Message envoyé !</h2>
                  <p>Merci pour votre confiance. Un expert ClariDoc Pro vous contactera très prochainement.</p>
                  <button className="btn btn-primary" onClick={() => setSent(false)}>Envoyer un autre message</button>
                </div>
              ) : (
                <form className={styles.form} onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                  <div className={styles.row}>
                    <div className="input-group">
                      <label>Nom complet</label>
                      <input type="text" className="input" placeholder="Jean Dupont" required />
                    </div>
                    <div className="input-group">
                      <label>Entreprise</label>
                      <input type="text" className="input" placeholder="Dupont & Co" required />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Email professionnel</label>
                    <input type="email" className="input" placeholder="jean@entreprise.com" required />
                  </div>
                  <div className="input-group">
                    <label>Sujet</label>
                    <select className="input">
                      <option>Demande de devis (Pack Entreprise)</option>
                      <option>Démonstration personnalisée</option>
                      <option>Support technique</option>
                      <option>Partenariat</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Votre message</label>
                    <textarea className="input" rows={5} placeholder="Dites-nous en plus sur vos besoins..." required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                    Envoyer ma demande
                  </button>
                </form>
              )}
            </div>

            {/* Infos de contact */}
            <div className={styles.infoCol}>
              <div className={styles.infoCard}>
                <h3>Coordonnées</h3>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>📍</span>
                  <div>
                    <strong>Bureaux</strong>
                    <p>Douala, Cameroun</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>📧</span>
                  <div>
                    <strong>Email</strong>
                    <p>contact@claridoc-pro.com</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>📱</span>
                  <div>
                    <strong>Téléphone / WhatsApp</strong>
                    <p>+237 6XX XX XX XX</p>
                  </div>
                </div>
              </div>

              <div className={styles.faqCard}>
                <h3>Questions fréquentes</h3>
                <details className={styles.details}>
                  <summary>Proposez-vous une installation sur site ?</summary>
                  <p>Oui, nous pouvons dépêcher un expert pour configurer vos serveurs FTP et former vos équipes.</p>
                </details>
                <details className={styles.details}>
                  <summary>Les données sont-elles vraiment souveraines ?</summary>
                  <p>Absolument. Aucune donnée ne quitte votre réseau local sans votre configuration explicite.</p>
                </details>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
