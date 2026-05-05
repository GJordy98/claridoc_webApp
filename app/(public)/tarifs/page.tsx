'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './tarifs.module.css';

const plans = [
  {
    name: "Starter",
    range: "1 – 3 postes",
    mensuel: 15000,
    annuel: 150000,
    description: "Idéal pour les indépendants et petites structures.",
    features: ["Numérisation A400/4K", "Archivage local sécurisé", "1 succursale", "Support email"],
    cta: "Commencer",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Business",
    range: "4 – 8 postes",
    mensuel: 35000,
    annuel: 350000,
    badge: "Populaire",
    description: "Parfait pour les PME en pleine croissance.",
    features: ["Tout du plan Starter", "Multi-succursales (3 max)", "Gestion des rôles avancée", "Support prioritaire"],
    cta: "Commencer",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Scale",
    range: "9 – 20 postes",
    mensuel: 70000,
    annuel: 700000,
    description: "Pour les entreprises avec de forts volumes documentaires.",
    features: ["Tout du plan Business", "Succursales illimitées", "Journal d'audit complet", "Onboarding dédié"],
    cta: "Commencer",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Entreprise",
    range: "Sur mesure",
    mensuel: null,
    annuel: null,
    description: "Solution 100% personnalisée pour les grandes organisations.",
    features: ["Infrastructure dédiée", "SLA garanti", "Intégrations personnalisées", "Account manager dédié"],
    cta: "Nous contacter",
    href: "/contact",
    highlighted: false,
  },
];

export default function TarifsPage() {
  const [duree, setDuree] = useState<'Mensuel' | 'Annuel'>('Mensuel');

  return (
    <div className={styles.page}>


      <main className={styles.main}>
        <div className={styles.heroGlow} />
        <div className={styles.sectionHeader}>
          <h1 className={styles.title}>Choisissez le pack adapté à <span className={styles.gradient}>votre croissance.</span></h1>
          <p className={styles.subtitle}>Des tarifs transparents, sans frais cachés, pour une souveraineté totale de vos données.</p>
        </div>

        <div className={styles.toggle}>
          {(['Mensuel', 'Annuel'] as const).map(d => (
            <button key={d}
              className={`${styles.toggleBtn} ${duree === d ? styles.toggleActive : ''}`}
              onClick={() => setDuree(d)}>
              {d} {d === 'Annuel' && <span className={styles.discount}>-17%</span>}
            </button>
          ))}
        </div>

        <div className={styles.pricingGrid}>
          {plans.map((plan) => {
            const prix = duree === 'Mensuel' ? plan.mensuel : plan.annuel;
            return (
            <div key={plan.name} className={`${styles.pricingCard} glass ${plan.highlighted ? styles.highlighted : ''}`}>
              {plan.badge && <span className={styles.badge}>{plan.badge}</span>}
              <div className={styles.cardHeader}>
                <h2 className={styles.planName}>{plan.name}</h2>
                <p className={styles.planRange}>{plan.range}</p>
              </div>

              {prix ? (
                <div className={styles.forfaitPrix}>
                  <span className={styles.prixNum}>{prix.toLocaleString('fr')}</span>
                  <span className={styles.prixUnit}> XAF / {duree === 'Mensuel' ? 'mois' : 'an'}</span>
                </div>
              ) : (
                <div className={styles.forfaitPrix}>
                  <span className={styles.prixNum}>Sur devis</span>
                </div>
              )}

              <p className={styles.planDesc}>{plan.description}</p>
              <ul className={styles.planFeatures}>
                {plan.features.map((feat) => (
                  <li key={feat}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={plan.highlighted ? styles.btnPrimaryFull : styles.btnOutlineFull}>
                {plan.cta}
              </Link>
            </div>
          )})}
        </div>

        <section className={styles.comparison}>
          <h3 className={styles.compTitle}>Inclus dans tous les plans</h3>
          <div className={styles.compGrid}>
            <div className={styles.compItem}>✓ Mise à jour gratuites</div>
            <div className={styles.compItem}>✓ Chiffrement AES-256</div>
            <div className={styles.compItem}>✓ Archivage illimité</div>
            <div className={styles.compItem}>✓ Mode hors-ligne</div>
          </div>
        </section>
      </main>
    </div>
  );
}
