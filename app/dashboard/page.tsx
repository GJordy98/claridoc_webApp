'use client';

import { useEffect, useState } from 'react';
import { apiGetUsers, apiGetMachines, apiGetSuccursales } from '@/lib/api';
import styles from './dashboard.module.css';

// ── URL du fichier installeur (à mettre à jour après chaque nouvelle compilation)
// Le fichier est servi depuis /public/Install_ClariDocPro_v1.0.exe
const INSTALLER_URL = '/Install_ClariDocPro_v1.0.exe';
const INSTALLER_VERSION = 'v1.0';
const INSTALLER_SIZE = '~340 Mo';

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

export default function DashboardPage() {
  const [users, setUsers] = useState<unknown[]>([]);
  const [machines, setMachines] = useState<unknown[]>([]);
  const [succursales, setSuccursales] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [u, m, s] = await Promise.all([
          apiGetUsers(), apiGetMachines(), apiGetSuccursales()
        ]);
        setUsers(u?.results ?? u ?? []);
        setMachines(m?.results ?? m ?? []);
        setSuccursales(s?.results ?? s ?? []);
      } catch {
        // silencieux
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeMachines = (machines as {is_active: boolean}[]).filter((m) => m.is_active).length;
  const activeUsers = (users as {is_active: boolean}[]).filter((u) => u.is_active).length;

  return (
    <div className={styles.page}>
      {/* En-tête */}
      <div className={`${styles.header} animate-fade-in`}>
        <div>
          <h1 className="title-lg">Tableau de bord</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Vue d&apos;ensemble de votre espace ClariDoc
          </p>
        </div>
        <div className={styles.headerBadge}>
          <span className={`badge ${succursales.length > 0 ? 'badge-success' : 'badge-warning'}`}>
            {succursales.length > 0 ? 'Actif' : 'Sans licence'}
          </span>
        </div>
      </div>

      {/* Bannière Sans Licence */}
      {!loading && succursales.length === 0 && (
        <div className={`${styles.nolicenceBanner} animate-fade-in-up`}>
          <div className={styles.nolicenceIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div>
            <strong>Aucune licence active</strong>
            <p>Choisissez un forfait pour activer votre espace et commencer à scanner.</p>
          </div>
          <a href="/dashboard/licence" className="btn btn-primary" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            Choisir un forfait →
          </a>
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Succursales actives"
          value={loading ? '—' : succursales.length}
          sub="agences enregistrées"
          color="primary"
          delay={1}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 8v10" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          }
        />
        <StatCard
          label="Utilisateurs"
          value={loading ? '—' : `${activeUsers} / ${users.length}`}
          sub="comptes actifs"
          color="success"
          delay={2}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M1 18c0-3.866 3.134-6 7-6s7 2.134 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M16 11c2 .5 3 1.8 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="15" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          }
        />
        <StatCard
          label="Postes (HWID)"
          value={loading ? '—' : `${activeMachines} / ${machines.length}`}
          sub="PCs autorisés"
          color={activeMachines < machines.length ? 'warning' : 'success'}
          delay={3}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="3" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 19h6M10 15v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="10" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
          }
        />
        <StatCard
          label="Statut serveur"
          value="En ligne"
          sub="API Django connectée"
          color="success"
          delay={4}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
      </div>

      {/* ── Bannière téléchargement (visible pour le BOSS) ── */}
      <div className={`${styles.downloadBanner} animate-fade-in-up delay-4`}>
        <div className={styles.downloadIcon}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className={styles.downloadInfo}>
          <strong>Application desktop ClariDoc Pro</strong>
          <p>Installez l&apos;application sur vos postes Windows pour démarrer la numérisation.{' '}
            <span className={styles.downloadVersion}>{INSTALLER_VERSION}</span>
            <span className={styles.downloadSize}> · {INSTALLER_SIZE}</span>
          </p>
        </div>
        <a
          href={INSTALLER_URL}
          download
          className={styles.downloadBtn}
          id="dashboard-download-app"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Télécharger l&apos;application
        </a>
      </div>

      {/* Section succursales */}
      {succursales.length > 0 && (
        <div className={`${styles.section} animate-fade-in-up delay-3`}>
          <div className={styles.sectionHeader}>
            <h2 className="title-md">Vos succursales</h2>
            <a href="/dashboard/licence" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
              + Ajouter une succursale
            </a>
          </div>
          <div className={styles.succursaleGrid}>
            {(succursales as {id: number; nom: string; ville?: string}[]).map((s) => (
              <div key={s.id} className={`${styles.succursaleCard} glass`}>
                <div className={styles.succursaleAvatar}>
                  {s.nom[0]?.toUpperCase()}
                </div>
                <div>
                  <div className={styles.succursaleNom}>{s.nom}</div>
                  {s.ville && <div className={styles.succursaleVille}>{s.ville}</div>}
                </div>
                <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Active</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
