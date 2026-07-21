'use client';

import { useEffect, useState } from 'react';
import { apiGetFichiers } from '@/lib/api';

interface Fichier {
  id: number;
  user_nom: string | null;
  nom_fichier: string;
  type_fichier: string;
  taille_octets: number;
  statut_upload: string;
  created_at: string;
}

const STATUT_COLORS: Record<string, string> = {
  'SUCCES': 'badge-success',
  'EN_ATTENTE': 'badge-warning',
  'ERREUR': 'badge-danger',
};

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DashboardScansPage() {
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiGetFichiers();
        setFichiers(data?.results ?? data ?? []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  const filtered = fichiers.filter(f =>
    f.nom_fichier.toLowerCase().includes(search.toLowerCase()) ||
    (f.user_nom ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }} className="animate-fade-in">
        <div>
          <h1 className="title-lg">Historique des Scans</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Documents numérisés et archivés par votre entreprise
          </p>
        </div>
        <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
          {fichiers.length} scans au total
        </span>
      </div>

      <div className="input-group animate-fade-in-up" style={{ maxWidth: 420, marginBottom: '1.5rem' }}>
        <input
          className="input"
          placeholder="Rechercher par nom de fichier ou utilisateur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="glass animate-fade-in-up delay-1" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Date', 'Utilisateur', 'Fichier', 'Taille', 'Statut'].map(h => (
                <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Aucun scan trouvé</td></tr>
            ) : filtered.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {new Date(f.created_at).toLocaleString('fr-FR')}
                </td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  {f.user_nom || '—'}
                </td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.nom_fichier}
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  {formatSize(f.taille_octets)}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span className={`badge ${STATUT_COLORS[f.statut_upload] || 'badge-warning'}`} style={{ fontSize: '0.78rem' }}>
                    {f.statut_upload}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
