'use client';

import { useEffect, useState } from 'react';
import { apiGetFichiers } from '@/lib/api';
import styles from './scans.module.css';

interface Fichier {
  id: number;
  user_nom: string | null;
  nom_fichier: string;
  type_fichier: string;
  taille_octets: number;
  statut_upload: string;
  created_at: string;
}

const STATUT_BADGE: Record<string, string> = {
  'SUCCES':     'badge-success',
  'EN_ATTENTE': 'badge-warning',
  'ERREUR':     'badge-danger',
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
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

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
    <div className={styles.page}>
      {/* En-tête */}
      <div className={`${styles.header} animate-fade-in`}>
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

      {/* Recherche */}
      <div className={`${styles.searchWrap} input-group animate-fade-in-up`}>
        <input
          className="input"
          placeholder="Rechercher par nom de fichier ou utilisateur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className={`${styles.tableWrap} glass animate-fade-in-up delay-1`}>
        <table className={styles.table}>
          <thead>
            <tr>
              {['Date', 'Utilisateur', 'Fichier', 'Taille', 'Statut'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className={styles.emptyRow}><td colSpan={5}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr className={styles.emptyRow}><td colSpan={5}>Aucun scan trouvé</td></tr>
            ) : filtered.map(f => (
              <tr key={f.id}>
                <td className={styles.tdDate}>
                  {new Date(f.created_at).toLocaleString('fr-FR')}
                </td>
                <td className={styles.tdUser}>{f.user_nom || '—'}</td>
                <td className={styles.tdFile}>{f.nom_fichier}</td>
                <td className={styles.tdSize}>{formatSize(f.taille_octets)}</td>
                <td>
                  <span className={`badge ${STATUT_BADGE[f.statut_upload] || 'badge-warning'}`} style={{ fontSize: '0.78rem' }}>
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
