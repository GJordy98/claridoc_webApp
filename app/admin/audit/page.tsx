'use client';

import { useEffect, useState } from 'react';
import { apiGetLogs } from '@/lib/api';

interface Log {
  id: number;
  user_nom: string | null;
  client: number;
  client_nom: string | null;
  action: string;
  details: string | null;
  nom_fichier: string | null;
  type_document: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  'scan_jpg':    'badge-success',
  'scan_pdf':    'badge-primary',
  'scan_ocr':    'badge-warning',
  'scan_':       'badge-success',
  'upload':      'badge-success',
  'login':       'badge-primary',
  'connexion':   'badge-primary',
  'delete':      'badge-danger',
  'update':      'badge-warning',
  'active':      'badge-success',
  'bloque':      'badge-danger',
  'validate':    'badge-success',
  'deconnexion': 'badge-secondary',
};

function getBadgeClass(action: string): string {
  const lowerAction = action.toLowerCase();
  const key = Object.keys(ACTION_COLORS).find(k => lowerAction.startsWith(k) || lowerAction.includes(k));
  return key ? ACTION_COLORS[key] : 'badge-warning';
}

export default function AdminAuditPage() {
  const [logs, setLogs]       = useState<Log[]>([]);
  const [clients, setClients] = useState<{id: number, nom: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterClient, setFilterClient] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const { apiGetLogs, apiGetClients } = await import('@/lib/api');
        const [lData, cData] = await Promise.all([apiGetLogs(), apiGetClients()]);
        setLogs(lData?.results ?? lData ?? []);
        setClients(cData?.results ?? cData ?? []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).sort();

  const filtered = logs.filter(l => {
    const matchSearch = l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.user_nom ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.details ?? '').toLowerCase().includes(search.toLowerCase());
    
    const matchAction = filterAction === '' || l.action === filterAction;
    const matchClient = filterClient === '' || l.client.toString() === filterClient;
    
    return matchSearch && matchAction && matchClient;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }} className="animate-fade-in">
        <div>
          <h1 className="title-lg">Audit & Logs</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Journal complet des actions sur l&apos;ensemble de la plateforme
          </p>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
          {logs.length} entrées
        </span>
      </div>

      {/* Filtres */}
      <div className="animate-fade-in-up" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <input
            className="input"
            placeholder="Rechercher (action, utilisateur, détails...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="input-group" style={{ marginBottom: 0 }}>
          <select className="input" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
            <option value="">Toutes les actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="input-group" style={{ marginBottom: 0 }}>
          <select className="input" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
            <option value="">Tous les clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass animate-fade-in-up delay-1" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-alt)' }}>
              {['Date', 'Utilisateur', 'Client', 'Action', 'Fichier', 'Détails'].map(h => (
                <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Aucun log trouvé</td></tr>
            ) : filtered.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {new Date(l.created_at).toLocaleString('fr-FR')}
                </td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  {l.user_nom || <em style={{ color: 'var(--color-text-muted)' }}>système</em>}
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{l.client_nom || `#${l.client}`}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span className={`badge ${getBadgeClass(l.action)}`} style={{ fontSize: '0.78rem' }}>
                    {l.action}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  {l.nom_fichier ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.9rem' }}>
                        {l.type_document === 'PDF' ? '📕' : l.type_document === 'JPG' ? '🖼️' : l.type_document === 'OCR' ? '🔍' : '📄'}
                      </span>
                      <code style={{ background: 'var(--color-bg-alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--color-primary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                        {l.nom_fichier}
                      </code>
                    </div>
                  ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>}
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.details || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
