'use client';

import { useEffect, useState } from 'react';
import { apiGetMachines, apiToggleMachine } from '@/lib/api';
import styles from './machines.module.css';

interface Machine {
  id: number;
  hwid: string;
  nom_machine?: string;
  is_active: boolean;
  last_seen: string;
  created_at: string;
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await apiGetMachines();
      setMachines(data?.results ?? data ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function toggleMachine(id: number) {
    try {
      await apiToggleMachine(id);
      await loadData();
    } catch { /* silent */ }
  }

  const active = machines.filter(m => m.is_active).length;

  return (
    <div className={styles.page}>
      <div className={`${styles.header} animate-fade-in`}>
        <div>
          <h1 className="title-lg">Postes (HWID)</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Gérez les PCs autorisés à utiliser ClariDoc
          </p>
        </div>
        <div className={`${styles.quota} glass`}>
          <span className={styles.quotaNum}>{active}</span>
          <span className={styles.quotaSep}>/</span>
          <span className={styles.quotaTotal}>{machines.length}</span>
          <span className={styles.quotaLabel}>postes actifs</span>
        </div>
      </div>

      <div className={`${styles.tableWrap} glass animate-fade-in-up delay-1`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nom machine</th>
              <th>HWID</th>
              <th>Dernière connexion</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Chargement...</td></tr>
            ) : machines.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                Aucun poste enregistré. Les PCs apparaissent ici après le premier démarrage de ClariDoc.
              </td></tr>
            ) : machines.map(m => (
              <tr key={m.id}>
                <td className={styles.tdName}>{m.nom_machine || 'PC inconnu'}</td>
                <td><code className={styles.hwid}>{m.hwid}</code></td>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem' }}>
                  {new Date(m.last_seen).toLocaleString('fr-FR')}
                </td>
                <td>
                  <span className={`badge ${m.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {m.is_active ? 'Autorisé' : 'Révoqué'}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn ${m.is_active ? 'btn-ghost' : 'btn-primary'}`}
                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                    onClick={() => toggleMachine(m.id)}>
                    {m.is_active ? 'Révoquer' : 'Autoriser'}
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
