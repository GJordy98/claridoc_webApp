'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './legal.module.css';

type Section = 'mentions' | 'cgu' | 'confidentialite';

export default function LegalPage() {
  const [activeSection, setActiveSection] = useState<Section>('mentions');

  // Handle hash navigation
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'mentions' || hash === 'cgu' || hash === 'confidentialite') {
      setActiveSection(hash as Section);
    }
  }, []);

  const handleNavClick = (section: Section) => {
    setActiveSection(section);
    window.history.pushState(null, '', `#${section}`);
  };

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <h1>Centre <span className={styles.heroGradient}>Légal</span></h1>
        <p>
          Retrouvez ici toutes les informations concernant nos mentions légales, nos conditions d'utilisation et notre politique de confidentialité.
        </p>
      </header>

      <div className={styles.contentWrapper}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <button 
              onClick={() => handleNavClick('mentions')}
              className={`${styles.navLink} ${activeSection === 'mentions' ? styles.navLinkActive : ''}`}
            >
              Mentions Légales
            </button>
            <button 
              onClick={() => handleNavClick('cgu')}
              className={`${styles.navLink} ${activeSection === 'cgu' ? styles.navLinkActive : ''}`}
            >
              Conditions Générales (CGU)
            </button>
            <button 
              onClick={() => handleNavClick('confidentialite')}
              className={`${styles.navLink} ${activeSection === 'confidentialite' ? styles.navLinkActive : ''}`}
            >
              Politique de Confidentialité
            </button>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          {/* --- MENTIONS LÉGALES --- */}
          <section className={`${styles.section} ${activeSection === 'mentions' ? styles.sectionActive : ''}`}>
            <h2>Mentions Légales</h2>
            
            <h3>1. Éditeur du Site</h3>
            <p>
              Le site ClariDoc Pro est édité par la société <strong>[Nom de votre Société]</strong>, 
              [Forme juridique] au capital de [Montant] €, immatriculée au Registre du Commerce et des Sociétés de [Ville] 
              sous le numéro [Numéro RCS].
            </p>
            <ul>
              <li><strong>Siège social :</strong> [Adresse complète]</li>
              <li><strong>Email :</strong> contact@claridocpro.com</li>
              <li><strong>Directeur de la publication :</strong> [Nom du responsable]</li>
            </ul>

            <h3>2. Hébergement</h3>
            <p>
              Le site web est hébergé par [Nom de l'hébergeur, ex: Vercel Inc.], dont le siège social est situé à [Adresse hébergeur].
              <br />
              <strong>Note importante :</strong> Les données de numérisation et documents archivés via l'application ClariDoc Pro 
              ne sont pas stockés sur nos serveurs web mais sur l'infrastructure FTP privée choisie et configurée par le client.
            </p>

            <h3>3. Propriété Intellectuelle</h3>
            <p>
              L'ensemble de ce site, ainsi que le logiciel ClariDoc Pro (desktop et web), relèvent de la législation française et internationale 
              sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, 
              y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
          </section>

          {/* --- CGU --- */}
          <section className={`${styles.section} ${activeSection === 'cgu' ? styles.sectionActive : ''}`}>
            <h2>Conditions Générales d'Utilisation</h2>
            
            <h3>1. Objet</h3>
            <p>
              Les présentes CGU ont pour objet de définir les modalités de mise à disposition des services de ClariDoc Pro, 
              ci-après nommé « le Service », et les conditions d'utilisation du Service par l'Utilisateur.
            </p>

            <h3>2. Accès au Service</h3>
            <p>
              Le Service est accessible via une interface web pour la gestion et une application desktop pour la numérisation. 
              L'activation de l'application desktop nécessite une licence valide liée à l'identifiant matériel (HWID) de la machine.
            </p>

            <h3>3. Licence et Postes</h3>
            <p>
              L'utilisation du logiciel est régie par un système de licence. Chaque licence définit un nombre maximum de postes (machines) 
              autorisés. L'utilisateur s'interdit de tenter de contourner les limitations techniques ou de dupliquer les clés d'activation.
            </p>

            <h3>4. Responsabilité du Stockage</h3>
            <p>
              ClariDoc Pro propose une solution de gestion documentaire où les fichiers sont stockés sur un serveur FTP configuré par l'utilisateur. 
              <strong> ClariDoc Pro n'est pas responsable de la perte de données</strong> résultant d'une mauvaise configuration du serveur FTP, 
              d'une panne matérielle du côté client ou d'une suppression accidentelle.
            </p>

            <h3>5. Sécurité</h3>
            <p>
              L'utilisateur est responsable de la confidentialité de ses identifiants de connexion. 
              Toute action effectuée avec les identifiants de l'utilisateur est réputée avoir été effectuée par lui-même.
            </p>
          </section>

          {/* --- CONFIDENTIALITÉ --- */}
          <section className={`${styles.section} ${activeSection === 'confidentialite' ? styles.sectionActive : ''}`}>
            <h2>Politique de Confidentialité</h2>
            
            <h3>1. Collecte des Données</h3>
            <p>
              Dans le cadre de l'utilisation de ClariDoc Pro, nous collectons les informations suivantes :
            </p>
            <ul>
              <li><strong>Informations de compte :</strong> Nom, email, entreprise, mot de passe (haché).</li>
              <li><strong>Données techniques :</strong> Identifiant matériel (HWID) pour la gestion des licences, adresse IP, type de navigateur.</li>
              <li><strong>Journaux d'audit (Logs) :</strong> Historique des actions effectuées (numérisation, consultation, modification) pour garantir la traçabilité des documents.</li>
            </ul>

            <h3>2. Utilisation des Données</h3>
            <p>
              Vos données sont utilisées exclusivement pour :
            </p>
            <ul>
              <li>La gestion de votre compte et de vos licences.</li>
              <li>La fourniture du service d'audit et de traçabilité.</li>
              <li>Le support technique et l'amélioration de l'application.</li>
            </ul>

            <h3>3. Stockage et Sécurité</h3>
            <p>
              <strong>Confidentialité totale :</strong> Les documents numérisés transitent par l'application ClariDoc mais sont stockés 
              directement sur votre serveur FTP. Nous n'avons aucun accès au contenu de vos documents sauf si vous nous donnez explicitement 
              accès dans le cadre d'un support technique.
            </p>

            <h3>4. Vos Droits</h3>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. 
              Vous pouvez exercer ces droits en nous contactant à l'adresse : privacy@claridocpro.com.
            </p>

            <h3>5. Cookies</h3>
            <p>
              Nous utilisons des cookies techniques nécessaires au fonctionnement de la session utilisateur sur le portail web. 
              Aucun cookie de traçage publicitaire n'est utilisé.
            </p>
          </section>
        </main>
      </div>

    </div>
  );
}
