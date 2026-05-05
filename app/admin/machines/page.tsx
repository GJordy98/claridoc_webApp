'use client';

import { useEffect, useState } from 'react';
import { apiGetMachines, apiToggleMachine } from '@/lib/api';

interface Machine {
  id: number;
  hwid: string;
  nom_machine: string | null;
  is_active: boolean;
  last_seen: string;
  licence: number;
}

export default function AdminMachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await apiGetMachines();
      setMachines(data?.results ?? data ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleToggle(id: number) {
    setTogglingId(id);
    try {
      await apiToggleMachine(id);
      await loadData();
    } catch { /* silent */ }
    finally { setTogglingId(null); }
  }

  const filtered = machines.filter(m =>
    m.hwid.toLowerCase().includes(search.toLowerCase()) ||
    (m.nom_machine ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const active = machines.filter(m => m.is_active).length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }} className="animate-fade-in">
        <div>
          <h1 className="title-lg">Postes enregistrés</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Tous les HWIDs déclarés sur l&apos;ensemble des clients
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-success">{active} actifs</span>
          <span className="badge badge-warning">{machines.length - active} bloqués</span>
        </div>
      </div>

      {/* Recherche */}
      <div className="input-group animate-fade-in-up" style={{ maxWidth: 380, marginBottom: '1.5rem' }}>
        <input
          className="input"
          placeholder="Rechercher un HWID ou nom de machine..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="glass animate-fade-in-up delay-1" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['HWID', 'Nom machine', 'Licence ID', 'Dernière connexion', 'Statut', 'Action'].map(h => (
                <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Aucun poste trouvé</td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: m.is_active ? 1 : 0.55, transition: 'opacity 0.2s' }}>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <code style={{ fontSize: '0.82rem', background: 'var(--color-bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>{m.hwid}</code>
                </td>
                <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-secondary)' }}>{m.nom_machine || <em style={{ color: 'var(--color-text-muted)' }}>—</em>}</td>
                <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>#{m.licence}</td>
                <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                  {new Date(m.last_seen).toLocaleString('fr-FR')}
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <span className={`badge ${m.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {m.is_active ? 'Actif' : 'Bloqué'}
                  </span>
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <button
                    className={`btn ${m.is_active ? 'btn-ghost' : 'btn-primary'}`}
                    style={{ fontSize: '0.8rem', padding: '4px 14px' }}
                    disabled={togglingId === m.id}
                    onClick={() => handleToggle(m.id)}
                  >
                    {togglingId === m.id ? '...' : m.is_active ? 'Bloquer' : 'Réactiver'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
