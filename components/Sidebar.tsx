'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './sidebar.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  role: 'BOSS' | 'ADMIN' | 'SUPERADMIN';
  userName?: string;
  clientNom?: string;
}

const iconDashboard = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="10" y="1" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="1" y="10" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="10" y="10" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const iconUsers = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 16c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 9c1.5 0 3 .8 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="13" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const iconMachines = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="3" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 17h6M9 14v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);
const iconLicence = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 1L11 5h4l-3 3 1 4-3-2-3 2 1-4-3-3h4L9 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M4 14h10M4 17h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const iconConfig = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M3.22 14.78l1.41-1.41M13.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const iconPayments = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="4" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 8h16" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 12h3M12 12h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const iconAudit = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M3 2h12a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 6h8M5 9h8M5 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const iconClients = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 9h6M9 6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  return (
    <Link href={item.href} className={`${styles.navLink} ${isActive ? styles.active : ''}`}>
      <span className={styles.navIcon}>{item.icon}</span>
      <span className={styles.navLabel}>{item.label}</span>
      {isActive && <span className={styles.activeIndicator} />}
    </Link>
  );
}

export default function Sidebar({ role, userName, clientNom }: SidebarProps) {
  const router = useRouter();

  const dashboardNav: NavItem[] = [
    { href: '/dashboard', label: 'Tableau de bord', icon: iconDashboard },
    { href: '/dashboard/users', label: 'Utilisateurs', icon: iconUsers },
    { href: '/dashboard/machines', label: 'Postes (HWID)', icon: iconMachines },
    { href: '/dashboard/licence', label: 'Licences', icon: iconLicence },
    { href: '/dashboard/scans', label: 'Historique Scans', icon: iconAudit },
    { href: '/dashboard/audit', label: 'Journal d\'Audit', icon: iconMachines },
    { href: '/dashboard/config', label: 'Configuration FTP', icon: iconConfig },
  ];

  const adminNav: NavItem[] = [
    { href: '/admin', label: 'Vue globale', icon: iconDashboard },
    { href: '/admin/clients', label: 'Clients', icon: iconClients },
    { href: '/admin/paiements', label: 'Paiements', icon: iconPayments },
    { href: '/admin/machines', label: 'Machines', icon: iconMachines },
    { href: '/admin/audit', label: 'Audit & Logs', icon: iconAudit },
    { href: '/admin/stats', label: 'Volume Scans', icon: iconConfig },
  ];

  const navItems = role === 'SUPERADMIN' ? adminNav : dashboardNav;
  const isAdmin = role === 'SUPERADMIN';

  function handleLogout() {
    document.cookie = 'claridoc_token=; path=/; max-age=0';
    document.cookie = 'claridoc_role=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <aside className={`${styles.sidebar} ${isAdmin ? styles.adminTheme : ''}`}>
      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M4 6C4 4.895 4.895 4 6 4H22C23.105 4 24 4.895 24 6V22C24 23.105 23.105 24 22 24H6C4.895 24 4 23.105 4 22V6Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 9H19M9 14H16M9 19H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div className={styles.logoTitle}>ClariDoc<span>Pro</span></div>
          <div className={styles.logoSub}>{isAdmin ? 'Super Admin' : 'Portail Client'}</div>
        </div>
      </div>

      {/* Infos utilisateur */}
      {(userName || clientNom) && (
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>{userName?.[0]?.toUpperCase() || 'U'}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{userName || 'Utilisateur'}</div>
            {clientNom && <div className={styles.userCompany}>{clientNom}</div>}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navSection}>
          {navItems.map(item => <NavLink key={item.href} item={item} />)}
        </div>
      </nav>

      {/* Bas de la sidebar */}
      <div className={styles.sidebarFooter}>
        <button onClick={handleLogout} className={styles.logoutBtn} id="sidebar-logout">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
