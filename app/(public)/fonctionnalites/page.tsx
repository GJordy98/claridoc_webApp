'use client';

import Link from 'next/link';
import styles from './features.module.css';

const details = [
  {
    title: "Numérisation Intelligente",
    desc: "Optimisation automatique via IA : recadrage, redressement et filtrage des bruits pour une lisibilité parfaite (OCR ready).",
    icon: "✨",
  },
  {
    title: "Souveraineté Totale",
    desc: "Vos documents ne transitent jamais par nos serveurs. L'archivage se fait directement sur votre propre infrastructure sécurisée.",
    icon: "🛡️",
  },
  {
    title: "Gestion des Rôles",
    desc: "Définissez finement qui peut numériser, consulter ou administrer chaque succursale via un système de permissions robuste.",
    icon: "👥",
  },
  {
    title: "Audit & Traçabilité",
    desc: "Chaque action est enregistrée dans un journal d'audit inviolable, garantissant la conformité avec les normes de régulation.",
    icon: "📝",
  },
  {
    title: "Multi-Succursales",
    desc: "Centralisez la gestion de toutes vos agences dans un tableau de bord unique tout en isolant les données de chacune.",
    icon: "🏢",
  },
  {
    title: "Haute Disponibilité",
    desc: "Fonctionne en réseau local même sans internet. La synchronisation cloud (optionnelle) est chiffrée de bout en bout.",
    icon: "📡",
  },
];

export default function FonctionnalitesPage() {
  return (
    <div className={styles.page}>


      <main className={styles.main}>
        <div className={styles.heroGlow} />
        <div className={styles.sectionHeader}>
          <h1 className={styles.title}>Une technologie au service de <span className={styles.gradient}>votre efficacité.</span></h1>
          <p className={styles.subtitle}>Découvrez les outils qui font de ClariDoc Pro la référence de la gestion documentaire souveraine.</p>
        </div>

        <div className={styles.featuresGrid}>
          {details.map((f, i) => (
            <div key={f.title} className={`${styles.featureCard} glass animate-fade-in-up`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h2 className={styles.featureTitle}>{f.title}</h2>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>

        <section className={styles.cta}>
          <h3 className={styles.ctaTitle}>Prêt à transformer votre gestion documentaire ?</h3>
          <div className={styles.ctaButtons}>
            <Link href="/register" className="btn btn-primary">Démarrer maintenant</Link>
            <Link href="/contact" className="btn btn-ghost">Parler à un expert</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
