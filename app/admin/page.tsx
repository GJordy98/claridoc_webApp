'use client';

import { useEffect, useState } from 'react';
import { apiGetClients, apiGetPayments } from '@/lib/api';
import styles from './admin.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  icon: React.ReactNode;
  delay?: number;
}

function StatCard({ label, value, sub, color = 'primary', icon, delay = 0 }: StatCardProps) {
  return (
    <div className={`${styles.statCard} glass animate-fade-in-up delay-${delay}`}>
      <div className={`${styles.statIcon} ${styles[`icon_${color}`]}`}>{icon}</div>
      <div className={styles.statBody}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [clients, setClients] = useState<unknown[]>([]);
  const [payments, setPayments] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [c, p] = await Promise.all([apiGetClients(), apiGetPayments()]);
        setClients(c?.results ?? c ?? []);
        setPayments(p?.results ?? p ?? []);
      } catch { /* silencieux */ }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  const pending = (payments as {statut: string}[]).filter(p => p.statut === 'EN_ATTENTE').length;
  const activeClients = (clients as {statut: string}[]).filter(c => c.statut === 'ACTIF').length;

  return (
    <div className={styles.page}>
      <div className={`${styles.header} animate-fade-in`}>
        <div>
          <h1 className="title-lg">Back-Office <span className="text-gradient">ClariDoc</span></h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Tableau de bord global — Super Admin
          </p>
        </div>
        <div className={styles.superadminBadge}>⚡ SUPERADMIN</div>
      </div>

      {/* Alerte paiements en attente */}
      {!loading && pending > 0 && (
        <div className={`${styles.alertBanner} animate-fade-in-up`}>
          <div style={{ color: 'var(--color-warning)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div>
            <strong>{pending} paiement{pending > 1 ? 's' : ''} en attente de validation</strong>
            <p>Des clients attendent l&apos;activation de leur licence.</p>
          </div>
          <a href="/admin/paiements" className="btn btn-primary" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            Voir les paiements →
          </a>
        </div>
      )}

      {/* Stats globales */}
      <div className={styles.statsGrid}>
        <StatCard label="Clients enregistrés" value={loading ? '—' : clients.length}
          sub="entreprises inscrites" color="primary" delay={1}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8h16M8 8v10" stroke="currentColor" strokeWidth="1.5"/></svg>}
        />
        <StatCard label="Clients actifs" value={loading ? '—' : activeClients}
          sub="avec licence valide" color="success" delay={2}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
        <StatCard label="Paiements en attente" value={loading ? '—' : pending}
          sub="à valider manuellement" color={pending > 0 ? 'warning' : 'success'} delay={3}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="5" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 9h18" stroke="currentColor" strokeWidth="1.5"/></svg>}
        />
        <StatCard label="Sans licence" value={loading ? '—' : (clients.length - activeClients)}
          sub="à convertir" color={clients.length - activeClients > 0 ? 'danger' : 'success'} delay={4}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
        />
      </div>

      {/* Derniers clients */}
      <div className={`${styles.section} animate-fade-in-up delay-3`}>
        <div className={styles.sectionHeader}>
          <h2 className="title-md">Clients récents</h2>
          <a href="/admin/clients" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
            Voir tous →
          </a>
        </div>
        <div className={`${styles.tableWrap} glass`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Code</th>
                <th>Email</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Chargement...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Aucun client</td></tr>
              ) : (
                (clients as {id: number; nom: string; code_client: string; email_contact: string; statut: string}[])
                  .slice(0, 8).map(c => (
                  <tr key={c.id}>
                    <td className={styles.tdName}>{c.nom}</td>
                    <td><code className={styles.code}>{c.code_client}</code></td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{c.email_contact || '—'}</td>
                    <td>
                      <span className={`badge ${c.statut === 'ACTIF' ? 'badge-success' : c.statut === 'SUSPENDU' ? 'badge-danger' : 'badge-warning'}`}>
                        {c.statut}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
