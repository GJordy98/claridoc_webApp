'use client';

import { useEffect, useState } from 'react';
import { apiGetUsageStats, apiGetActionStats } from '@/lib/api';

interface ClientStats {
  id: number;
  nom: string;
  code_client: string;
  total_scans: number;
  total_volume: number | null;
  total_logs: number | null;
}

interface ActionStat {
  client_id: number;
  client_nom: string;
  code_client: string;
  actions: Record<string, number>;
  total: number;
}

function formatSize(bytes: number | null) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getActionBadge(action: string): string {
  const a = action.toUpperCase();
  if (a.includes('PDF'))  return '#e74c3c';
  if (a.includes('JPG') || a.includes('JPEG')) return '#27ae60';
  if (a.includes('OCR'))  return '#f39c12';
  if (a.includes('TIF'))  return '#8e44ad';
  if (a.includes('CONNEXION') || a.includes('LOGIN')) return '#2980b9';
  if (a.includes('DECONNEXION')) return '#7f8c8d';
  return '#34495e';
}

type ActiveTab = 'volume' | 'actions';

export default function AdminStatsPage() {
  const [stats, setStats]           = useState<ClientStats[]>([]);
  const [actionStats, setActionStats] = useState<ActionStat[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState<ActiveTab>('volume');

  useEffect(() => {
    async function loadData() {
      try {
        const [vData, aData] = await Promise.all([apiGetUsageStats(), apiGetActionStats()]);
        setStats(Array.isArray(vData) ? vData : []);
        setActionStats(Array.isArray(aData) ? aData : []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  const filteredStats = stats.filter(s =>
    (s.nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.code_client || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredActions = actionStats.filter(s =>
    (s.client_nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.code_client || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalGlobalScans  = stats.reduce((acc, s) => acc + s.total_scans, 0);
  const totalGlobalVolume = stats.reduce((acc, s) => acc + (s.total_volume || 0), 0);
  const totalGlobalActions = actionStats.reduce((acc, s) => acc + s.total, 0);

  // Toutes les actions disponibles (pour en-têtes)
  const allActions = Array.from(
    new Set(actionStats.flatMap(s => Object.keys(s.actions)))
  ).sort();

  const tabStyle = (tab: ActiveTab) => ({
    padding: '0.6rem 1.4rem',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    background: activeTab === tab ? 'var(--color-primary)' : 'var(--color-bg-alt)',
    color: activeTab === tab ? '#fff' : 'var(--color-text-secondary)',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }} className="animate-fade-in">
        <div>
          <h1 className="title-lg">Volume &amp; Actions par Entreprise</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Aperçu global de l&apos;utilisation par client (Privacy First)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div className="badge badge-success" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            📸 {totalGlobalScans} fichiers
          </div>
          <div className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            🎯 {totalGlobalActions} actions
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', alignSelf: 'center' }}>
            Volume : {formatSize(totalGlobalVolume)}
          </div>
        </div>
      </div>

      {/* Onglets + Recherche */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={tabStyle('volume')} onClick={() => setActiveTab('volume')}>
            📊 Volume de numérisation
          </button>
          <button style={tabStyle('actions')} onClick={() => setActiveTab('actions')}>
            🎯 Actions par type
          </button>
        </div>
        <div className="input-group" style={{ marginBottom: 0, maxWidth: 360 }}>
          <input
            className="input"
            placeholder="Rechercher un client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* === TAB : VOLUME === */}
      {activeTab === 'volume' && (
        <div className="glass animate-fade-in-up delay-1" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-alt)' }}>
                {['Client', 'Code', 'Fichiers scannés', 'Volume de données', 'Total actions'].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Chargement des statistiques...</td></tr>
              ) : filteredStats.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Aucune donnée trouvée</td></tr>
              ) : filteredStats.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.nom}</td>
                  <td style={{ padding: '1rem' }}>
                    <code style={{ background: 'var(--color-bg-alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>{s.code_client}</code>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: '#27ae60', fontWeight: 700 }}>{s.total_scans}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>fichiers</span>
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {formatSize(s.total_volume)}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                    {s.total_logs ?? 0} logs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* === TAB : ACTIONS PAR TYPE === */}
      {activeTab === 'actions' && (
        <div className="glass animate-fade-in-up delay-1" style={{ borderRadius: 'var(--radius-xl)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-alt)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code</th>
                {allActions.map(a => (
                  <th key={a} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.72rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    <span style={{
                      display: 'inline-block',
                      background: getActionBadge(a),
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 700
                    }}>{a}</span>
                  </th>
                ))}
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={allActions.length + 3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Chargement...</td></tr>
              ) : filteredActions.length === 0 ? (
                <tr><td colSpan={allActions.length + 3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Aucune donnée disponible</td></tr>
              ) : filteredActions.map(s => (
                <tr key={s.client_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>{s.client_nom}</td>
                  <td style={{ padding: '0.875rem 0.5rem' }}>
                    <code style={{ background: 'var(--color-bg-alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{s.code_client}</code>
                  </td>
                  {allActions.map(a => (
                    <td key={a} style={{ padding: '0.875rem 0.5rem', textAlign: 'center', fontWeight: 500 }}>
                      {s.actions[a] ? (
                        <span style={{
                          display: 'inline-block',
                          minWidth: 30,
                          background: getActionBadge(a) + '22',
                          color: getActionBadge(a),
                          border: `1px solid ${getActionBadge(a)}44`,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: 700
                        }}>{s.actions[a]}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                  ))}
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {s.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Note confidentialité */}
      <div className="glass" style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', background: 'rgba(52, 152, 219, 0.05)', border: '1px solid rgba(52, 152, 219, 0.2)' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>
          <strong>🔒 Note sur la confidentialité :</strong> Conformément à notre politique de protection des données,
          les administrateurs ClariDoc ne peuvent visualiser que les volumes et compteurs agrégés.
          Aucun nom de fichier ou contenu documentaire n&apos;est accessible via cette interface.
        </p>
      </div>
    </div>
  );
}
