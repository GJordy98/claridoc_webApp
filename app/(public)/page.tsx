'use client';

import Link from "next/link";
import { useState } from "react";
import styles from "./page.module.css";

const features = [
  {
    icon: "scan",
    title: "Numérisation Haute Performance",
    description:
      "Scannez en résolution A400 / 4K avec détection automatique des bords, correction de perspective et optimisation de contraste en temps réel.",
    accent: "blue",
  },
  {
    icon: "lock",
    title: "Archivage Local Sécurisé",
    description:
      "Vos données restent chez vous. Stockage sur serveur FTP privé, chiffrement AES-256 et aucune donnée transmise vers le cloud sans votre accord.",
    accent: "green",
  },
  {
    icon: "users",
    title: "Multi-Utilisateurs & Multi-Succursales",
    description:
      "Gérez plusieurs agences, définissez des rôles précis et suivez chaque action via un journal d'audit complet et inviolable.",
    accent: "blue",
  },
  {
    icon: "sync",
    title: "Mode Hors-Ligne & Sync Intelligente",
    description:
      "Continuez à travailler sans connexion. La synchronisation se déclenche automatiquement à la reconnexion, sans conflit ni perte de données.",
    accent: "green",
  },
];

const plans = [
  {
    name: "Démo",
    range: "2 postes — 2 semaines",
    prix_fixe: 50,
    mensuel: null,
    annuel: null,
    badge: "🎯 Démo",
    description: "Testez ClariDoc Pro pendant 2 semaines sur 2 PCs.",
    features: [
      "2 PCs autorisés",
      "Durée : 14 jours",
      "Email + code d'activation",
      "Paiement automatique OM/MoMo/Carte",
    ],
    cta: "Essayer maintenant",
    href: "/register",
    highlighted: false,
    isDemo: true,
  },
  {
    name: "Starter",
    range: "1 – 3 postes",
    prix_fixe: null,
    mensuel: 15000,
    annuel: 150000,
    badge: null,
    description: "Idéal pour les indépendants et petites structures.",
    features: [
      "Numérisation A400/4K",
      "Archivage local sécurisé",
      "1 succursale",
      "Support email",
    ],
    cta: "Commencer",
    href: "/register",
    highlighted: false,
    isDemo: false,
  },
  {
    name: "Business",
    range: "4 – 8 postes",
    prix_fixe: null,
    mensuel: 35000,
    annuel: 350000,
    badge: "Populaire",
    description: "Parfait pour les PME en pleine croissance.",
    features: [
      "Tout du plan Starter",
      "Multi-succursales (3 max)",
      "Gestion des rôles avancée",
      "Support prioritaire",
    ],
    cta: "Commencer",
    href: "/register",
    highlighted: true,
    isDemo: false,
  },
  {
    name: "Scale",
    range: "9 – 20 postes",
    prix_fixe: null,
    mensuel: 70000,
    annuel: 700000,
    badge: null,
    description: "Pour les entreprises avec de forts volumes documentaires.",
    features: [
      "Tout du plan Business",
      "Succursales illimitées",
      "Journal d'audit complet",
      "Onboarding dédié",
    ],
    cta: "Commencer",
    href: "/register",
    highlighted: false,
    isDemo: false,
  },
  {
    name: "Entreprise",
    range: "Sur mesure",
    prix_fixe: null,
    mensuel: null,
    annuel: null,
    badge: null,
    description: "Solution 100% personnalisée pour les grandes organisations.",
    features: [
      "Infrastructure dédiée",
      "SLA garanti",
      "Intégrations personnalisées",
      "Account manager dédié",
    ],
    cta: "Nous contacter",
    href: "/contact",
    highlighted: false,
    isDemo: false,
  },
];


const sectors = [
  { name: "Banques & Assurances", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" /></svg> },
  { name: "Études Notariales", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
  { name: "Cabinets d'Avocats", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> },
  { name: "Cliniques & Hôpitaux", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M12 10v4M10 12h4" /></svg> },
  { name: "Administrations", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M12 10V4c0-1.1.9-2 2-2h0a2 2 0 0 1 2 2v6" /><path d="M12 10V4c0-1.1-.9-2-2-2h0a2 2 0 0 0-2 2v6" /></svg> },
  { name: "Expert-Comptables", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
];

const stats = [
  { value: "99.9%", label: "Disponibilité garantie" },
  { value: "AES-256", label: "Chiffrement militaire" },
  { value: "< 1h", label: "Déploiement moyen" },
  { value: "0", label: "Donnée transmise au cloud" },
];

// Champs extraits affichés dans le volet « après » du studio de scan
const extractedFields = [
  { label: "Type de document", value: "Acte notarié" },
  { label: "Référence", value: "CD-2024-0847" },
  { label: "Date d'enregistrement", value: "14 juin 2024" },
  { label: "Signataire", value: "M. Etoa Belinga" },
];

function FeatureIcon({ type }: { type: string }) {
  // Numérisation → document sous tête de scanner
  if (type === "scan")
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8V6a2 2 0 0 1 2-2h2" />
        <path d="M20 8V6a2 2 0 0 0-2-2h-2" />
        <path d="M4 16v2a2 2 0 0 0 2 2h2" />
        <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
        <path d="M3 12h18" />
        <path d="M8 9.5h8" opacity="0.5" />
        <path d="M8 14.5h5" opacity="0.5" />
      </svg>
    );
  // Archivage sécurisé → classeur à tiroirs
  if (type === "lock")
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="1.5" />
        <path d="M4 9h16M4 15h16" />
        <path d="M10 6h4M10 12h4M10 18h4" />
      </svg>
    );
  // Multi-utilisateurs / multi-succursales → dossiers suspendus
  if (type === "users")
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h6l1.5 2H21" />
        <path d="M4.2 9l1 9.1a1 1 0 0 0 1 .9h11.6a1 1 0 0 0 1-.9l1-9.1" />
        <path d="M8 4v3M16 4v3" />
      </svg>
    );
  // Mode hors-ligne / synchronisation validée → tampon officiel
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a3 3 0 0 0-3 3c0 1.4.9 2 1 3.2.08 1-.2 1.9-.7 2.8h5.4c-.5-.9-.78-1.8-.7-2.8.1-1.2 1-1.8 1-3.2a3 3 0 0 0-3-3Z" />
      <rect x="6" y="14" width="12" height="3.2" rx="1" />
      <path d="M4 20.5h16" />
    </svg>
  );
}

export default function HomePage() {
  const [duree, setDuree] = useState<'Mensuel' | 'Annuel'>('Mensuel');

  return (
    <div className={styles.page}>


      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGlow2} />
        <div className={styles.heroGrid} />

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.badgeDot} />
            Privacy First · Souveraineté des données garantie
          </div>
          <h1 className={styles.heroTitle}>
            Numérisez et archivez vos documents avec une{" "}
            <span className={styles.heroGradient}>sécurité de niveau bancaire.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            ClariDoc Pro est la plateforme de gestion documentaire pensée pour les PME
            exigeantes. Vos données restent sur votre infrastructure, chiffrées,
            auditables et disponibles en tout temps — même hors ligne.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register" className={styles.btnSecondaryLg}>
              Essayez Gratuitement
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
          <p className={styles.heroNote}>Aucune carte de crédit requise · Données hébergées chez vous</p>
        </div>

        {/* Studio de numérisation : document papier → données structurées */}
        <div className={styles.heroVisual}>
          <div className={styles.scanStudio}>
            <div className={styles.scanHeader}>
              <span className={styles.scanKicker}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2M3 12h18" />
                </svg>
                Numérisation intelligente
              </span>
              <span className={styles.scanLive}>
                <span className={styles.scanLiveDot} />
                Traitement…
              </span>
            </div>

            <div className={styles.scanStage}>
              {/* AVANT — papier */}
              <div className={styles.paperPane}>
                <span className={styles.paperCaption}>Avant · Papier</span>
                <div className={styles.paperSheet}>
                  <div className={styles.inkTitle} />
                  <div className={styles.inkLine} style={{ width: "92%" }} />
                  <div className={styles.inkLine} style={{ width: "78%" }} />
                  <div className={styles.inkLine} style={{ width: "86%" }} />
                  <div className={styles.inkLine} style={{ width: "64%" }} />
                  <div className={styles.inkLine} style={{ width: "80%" }} />

                  {/* signature manuscrite */}
                  <svg className={styles.signature} width="94" height="32" viewBox="0 0 94 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 21c7-13 11 5 17-3s6-13 11-5 8 11 15 4 13-9 28-6" />
                  </svg>

                  {/* tampon officiel */}
                  <svg className={styles.stamp} width="58" height="58" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="30" cy="30" r="24" />
                    <circle cx="30" cy="30" r="17" />
                    <path d="M22 30.5l6 6 11.5-13" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  {/* faisceau de scan */}
                  <div className={styles.scanBeam} />
                </div>
              </div>

              {/* Flèche de transformation */}
              <div className={styles.transformArrow}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12h16M14 6l6 6-6 6" />
                </svg>
              </div>

              {/* APRÈS — données structurées */}
              <div className={styles.dataPane}>
                <span className={styles.dataCaption}>Après · Données</span>
                {extractedFields.map((field, i) => (
                  <div
                    key={field.label}
                    className={styles.dataField}
                    style={{ animationDelay: `${0.3 + i * 0.14}s` }}
                  >
                    <div className={styles.dataMeta}>
                      <span className={styles.dataLabel}>{field.label}</span>
                      <span className={styles.dataValue}>{field.value}</span>
                    </div>
                    <svg className={styles.dataCheck} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ))}
                <div className={styles.sealBadge}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V5l7-3Z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  Certifié conforme · Archivé localement
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className={styles.statsBand}>
        <div className={styles.sectionContainer}>
          <div className={styles.statsGrid}>
            {stats.map((s) => (
              <div key={s.label} className={styles.statCard}>
                <span className={styles.statBigValue}>{s.value}</span>
                <span className={styles.statBigLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="fonctionnalites" className={styles.features}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Fonctionnalités</span>
            <h2 className={styles.sectionTitle}>
              Tout ce dont vous avez besoin,{" "}
              <span className={styles.heroGradient}>rien de superflu.</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              ClariDoc Pro centralise la numérisation, l'archivage et la gestion
              documentaire dans une interface unique, pensée pour les professionnels.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((f, i) => (
              <div
                key={f.title}
                className={styles.featureCard}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`${styles.featureIcon} ${f.accent === "green" ? styles.iconGreen : styles.iconBlue}`}>
                  <FeatureIcon type={f.icon} />
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.description}</p>
              </div>
            ))}
          </div>
          <div className={styles.featuresFooter}>
            <Link href="/contact" className={styles.btnGhostLg}>
              Voir toutes les fonctionnalités
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="tarifs" className={styles.pricing}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Tarifs</span>
            <h2 className={styles.sectionTitle}>
              Un pack adapté à{" "}
              <span className={styles.heroGradient}>chaque structure.</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Des forfaits clairs, sans frais cachés. Évoluez au rythme de votre croissance.
            </p>
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
              const prix = plan.isDemo ? null : (duree === 'Mensuel' ? plan.mensuel : plan.annuel);
              return (
                <div
                  key={plan.name}
                  className={`${styles.pricingCard} ${plan.highlighted ? styles.pricingCardHighlighted : ""}`}
                  style={plan.isDemo ? { borderColor: 'var(--color-primary)' } : {}}
                >
                  {plan.badge && <span className={styles.pricingBadge}>{plan.badge}</span>}
                  <div className={styles.pricingHeader}>
                    <h3 className={styles.planName}>{plan.name}</h3>
                    <p className={styles.planRange}>{plan.range}</p>
                  </div>

                  {plan.isDemo ? (
                    <div className={styles.forfaitPrix}>
                      <span className={styles.prixNum}>50</span>
                      <span className={styles.prixUnit}> FCFA — 2 semaines</span>
                    </div>
                  ) : prix ? (
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
                      <li key={feat} className={styles.planFeatureItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.checkIcon}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={plan.highlighted ? styles.btnPrimaryFull : styles.btnOutlinePlan}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>

          <div className={styles.pricingNote}>
            <p>Besoin d'une configuration spéciale ?{" "}
              <Link href="/contact" className={styles.pricingNoteLink}>Contactez notre équipe →</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className={styles.socialProof}>
        <div className={styles.sectionContainer}>
          <p className={styles.proofLabel}>
            Approuvé par les professionnels des secteurs les plus exigeants
          </p>
          <div className={styles.sectorsGrid}>
            {sectors.map((s) => (
              <div key={s.name} className={styles.sectorCard}>
                <span className={styles.sectorIcon}>{s.icon}</span>
                <span className={styles.sectorName}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaGlow} />
        <div className={styles.sectionContainer}>
          <h2 className={styles.ctaTitle}>
            Prêt à prendre le contrôle de vos documents ?
          </h2>
          <p className={styles.ctaSubtitle}>
            Rejoignez les PME qui ont choisi la souveraineté de leurs données.
            Déployez ClariDoc Pro en moins d'une heure.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/register" className={styles.btnPrimaryLg}>Démarrer gratuitement</Link>
            <Link href="/contact" className={styles.btnGhostLg}>Parler à un expert</Link>
          </div>
        </div>
      </section>


    </div>
  );
}
