'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./PublicHeader.module.css";

export default function PublicHeader() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          ClariDoc<span className={styles.logoPro}>Pro</span>
        </Link>
        <nav className={styles.navLinks}>
          <Link 
            href="/fonctionnalites" 
            className={`${styles.navLink} ${isActive('/fonctionnalites') ? styles.active : ''}`}
          >
            Fonctionnalités
          </Link>
          <Link 
            href="/tarifs" 
            className={`${styles.navLink} ${isActive('/tarifs') ? styles.active : ''}`}
          >
            Tarifs
          </Link>
          <Link 
            href="/contact" 
            className={`${styles.navLink} ${isActive('/contact') ? styles.active : ''}`}
          >
            Aide
          </Link>
          <Link 
            href="/legal" 
            className={`${styles.navLink} ${isActive('/legal') ? styles.active : ''}`}
          >
            Légal
          </Link>
        </nav>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.btnOutline}>Connexion</Link>
          <Link href="/register" className={styles.btnPrimary}>S'inscrire</Link>
        </div>
        <button className={styles.mobileMenuBtn} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
