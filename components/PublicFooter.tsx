import Link from 'next/link';
import styles from './PublicFooter.module.css';

export default function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⬡</span>
            ClariDoc<span className={styles.logoPro}>Pro</span>
          </Link>
          <p className={styles.footerTagline}>
            La gestion documentaire sécurisée pour les professionnels exigeants.
          </p>
        </div>
        <div className={styles.footerLinks}>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Produit</h4>
            <Link href="/fonctionnalites" className={styles.footerLink}>Fonctionnalités</Link>
            <Link href="/tarifs" className={styles.footerLink}>Tarifs</Link>
            <Link href="/register" className={styles.footerLink}>S'inscrire</Link>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Accès</h4>
            <Link href="/login" className={styles.footerLink}>Connexion</Link>
            <Link href="/register" className={styles.footerLink}>Créer un compte</Link>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Support</h4>
            <Link href="/contact" className={styles.footerLink}>Contact</Link>
            <a href="#" className={styles.footerLink}>Documentation</a>
            <a href="#" className={styles.footerLink}>FAQ</a>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Légal</h4>
            <Link href="/legal#mentions" className={styles.footerLink}>Mentions légales</Link>
            <Link href="/legal#confidentialite" className={styles.footerLink}>Confidentialité</Link>
            <Link href="/legal#cgu" className={styles.footerLink}>CGU</Link>
          </div>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} ClariDoc Pro. Tous droits réservés.</p>
        <p>Conçu pour les professionnels · Données hébergées localement</p>
      </div>
    </footer>
  );
}
