'use client';

import { useEffect, useState } from 'react';
import { apiGetLogs } from '@/lib/api';
import styles from './audit.module.css';

interface Log {
  id: number;
  user_nom: string | null;
  action: string;
  details: string | null;
  nom_fichier: string | null;
  type_document: string | null;
  created_at: string;
}

// badge-info est la classe définie dans globals.css pour la couleur primaire
const ACTION_BADGE: Record<string, string> = {
  'scan_jpg':    'badge-success',
  'scan_pdf':    'badge-info',
  'scan_ocr':    'badge-warning',
  'scan_tif':    'badge-success',
  'scan_':       'badge-success',
  'connexion':   'badge-info',
  'login':       'badge-info',
  'deconnexion': 'badge-warning',
  'delete':      'badge-danger',
  'update':      'badge-warning',
  'active':      'badge-success',
  'bloque':      'badge-danger',
};

function getBadgeClass(action: string): string {
  const lower = action.toLowerCase();
  const key = Object.keys(ACTION_BADGE).find(k => lower.startsWith(k) || lower.includes(k));
  return key ? ACTION_BADGE[key] : 'badge-warning';
}

function getTypeIcon(type: string | null): string {
  if (!type) return '📄';
  const t = type.toUpperCase();
  if (t === 'JPG' || t === 'JPEG') return '🖼️';
  if (t === 'PDF') return '📕';
  if (t === 'OCR' || t === 'TXT') return '🔍';
  if (t === 'TIF' || t === 'TIFF') return '🗂️';
  return '📄';
}

export default function DashboardAuditPage() {
  const [logs, setLogs]                   = useState<Log[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filterAction, setFilterAction]   = useState('');
  const [filterUser, setFilterUser]       = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiGetLogs();
        setLogs(data?.results ?? data ?? []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).sort();
  const uniqueUsers   = Array.from(new Set(logs.map(l => l.user_nom).filter(Boolean))).sort();

  const filtered = logs.filter(l => {
    const matchSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.user_nom ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.details ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.nom_fichier ?? '').toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === '' || l.action === filterAction;
    const matchUser   = filterUser   === '' || l.user_nom === filterUser;
    return matchSearch && matchAction && matchUser;
  });

  const nbScans      = logs.filter(l => l.action.toUpperCase().startsWith('SCAN_')).length;
  const nbConnexions = logs.filter(l => l.action.toUpperCase().includes('CONNEXION') || l.action.toUpperCase().includes('LOGIN')).length;

  return (
    <div className={styles.page}>
      {/* En-tête */}
      <div className={`${styles.header} animate-fade-in`}>
        <div>
          <h1 className="title-lg">Journal d&apos;Audit</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Suivi des connexions et des actions de votre équipe
          </p>
        </div>
        <div className={styles.headerBadges}>
          <span className="badge badge-success">{nbScans} scans</span>
          <span className="badge badge-info">{nbConnexions} connexions</span>
          <span className="badge badge-warning">{logs.length} total</span>
        </div>
      </div>

      {/* Filtres */}
      <div className={`${styles.filters} animate-fade-in-up`}>
        <div className="input-group">
          <input
            className="input"
            placeholder="Rechercher (action, utilisateur, fichier...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="input-group">
          <select className="input" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
            <option value="">Toutes les actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="input-group">
          <select className="input" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
            <option value="">Tous les utilisateurs</option>
            {uniqueUsers.map(u => <option key={u!} value={u!}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`${styles.tableWrap} glass animate-fade-in-up delay-1`}>
        <table className={styles.table}>
          <thead>
            <tr>
              {['Date', 'Utilisateur', 'Action', 'Fichier', 'Détails'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className={styles.emptyRow}><td colSpan={5}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr className={styles.emptyRow}><td colSpan={5}>Aucun événement enregistré</td></tr>
            ) : filtered.map(l => (
              <tr key={l.id}>
                <td className={styles.tdDate}>
                  {new Date(l.created_at).toLocaleString('fr-FR')}
                </td>
                <td className={styles.tdUser}>
                  {l.user_nom || <em className={styles.tdMuted}>système</em>}
                </td>
                <td>
                  <span className={`badge ${getBadgeClass(l.action)}`} style={{ fontSize: '0.78rem' }}>
                    {l.action}
                  </span>
                </td>
                <td>
                  {l.nom_fichier ? (
                    <div className={styles.fileCell}>
                      <span className={styles.fileIcon}>{getTypeIcon(l.type_document)}</span>
                      <code className={styles.fileCode}>{l.nom_fichier}</code>
                    </div>
                  ) : (
                    <span className={styles.tdMuted}>—</span>
                  )}
                </td>
                <td className={styles.tdDetails}>{l.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
