'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiGetClients, apiGetClientDetail, apiGetClientSuccursales, apiGetClientLicences, apiGetClientUsers } from '@/lib/api';
import styles from './clients.module.css';

interface Client {
  id: number;
  nom: string;
  code_client: string;
  email_contact: string;
  telephone: string;
  statut: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Succursale {
  id: number;
  nom: string;
  ville: string;
  adresse: string;
  ftp_host: string;
  ftp_port: number;
  ftp_user: string;
  ftp_base_path: string;
  storage_mode: string;
  created_at: string;
}

interface Licence {
  id: number;
  statut: string;
  max_machines: number;
  date_debut: string;
  date_fin: string;
  montant: number;
  succursale_nom: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

interface ClientDetails {
  client: Client | null;
  succursales: Succursale[];
  licences: Licence[];
  users: User[];
}

const STATUT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ACTIF:        { bg: '#d1fae5', color: '#065f46', label: 'Actif' },
  SUSPENDU:     { bg: '#fee2e2', color: '#991b1b', label: 'Suspendu' },
  SANS_LICENCE: { bg: '#fef3c7', color: '#92400e', label: 'Sans Licence' },
};

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  BOSS:       { bg: '#e0e7ff', color: '#3730a3' },
  ADMIN:      { bg: '#fef3c7', color: '#92400e' },
  USER:       { bg: '#d1fae5', color: '#065f46' },
  SUPERADMIN: { bg: '#fce7f3', color: '#9d174d' },
};

export default function ClientsAdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'succursales' | 'licences' | 'users'>('info');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await apiGetClients();
      setClients(data?.results ?? data ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  const openDetails = useCallback(async (clientId: number) => {
    setLoadingDetails(true);
    setSelectedClient({ client: null, succursales: [], licences: [], users: [] });
    setActiveTab('info');
    try {
      const [client, succursales, licences, users] = await Promise.all([
        apiGetClientDetail(clientId),
        apiGetClientSuccursales(clientId).catch(() => []),
        apiGetClientLicences(clientId).catch(() => []),
        apiGetClientUsers(clientId).catch(() => []),
      ]);
      setSelectedClient({
        client,
        succursales: succursales?.results ?? succursales ?? [],
        licences: licences?.results ?? licences ?? [],
        users: users?.results ?? users ?? [],
      });
    } catch { setSelectedClient(null); }
    finally { setLoadingDetails(false); }
  }, []);

  const closeModal = useCallback(() => setSelectedClient(null), []);

  const filtered = clients.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.code_client.toLowerCase().includes(search.toLowerCase())
  );

  const { client, succursales, licences, users } = selectedClient ?? {};

  return (
    <div className={styles.page}>
      <div className={`${styles.header} animate-fade-in`}>
        <div>
          <h1 className="title-lg">Gestion des Clients</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Consultez et gérez toutes les entreprises utilisant ClariDoc
          </p>
        </div>
        <div className={styles.searchBar}>
          <input
            type="text"
            className="input"
            placeholder="Rechercher un client ou un code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={`${styles.tableWrap} glass animate-fade-in-up delay-1`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Entreprise</th>
              <th>Code Client</th>
              <th>Email de contact</th>
              <th>Statut</th>
              <th>Date d&apos;inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Chargement des clients...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Aucun client trouvé.</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>#{c.id}</td>
                  <td className={styles.tdName}>{c.nom}</td>
                  <td><code className={styles.code}>{c.code_client}</code></td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{c.email_contact || '—'}</td>
                  <td>
                    <span className={`badge ${c.statut === 'ACTIF' ? 'badge-success' : c.statut === 'SUSPENDU' ? 'badge-danger' : 'badge-warning'}`}>
                      {c.statut}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <button
                      id={`details-btn-${c.id}`}
                      className="btn btn-ghost"
                      style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                      onClick={() => openDetails(c.id)}
                    >
                      🔍 Détails
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── MODAL DÉTAILS ─────────────────────────────────────────────────── */}
      {selectedClient !== null && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            {/* Header modal */}
            <div className={styles.modalHeader}>
              <div>
                {loadingDetails || !client ? (
                  <p style={{ color: 'var(--color-text-muted)' }}>Chargement…</p>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <h2 className="title-md">{client.nom}</h2>
                      <code className={styles.code}>{client.code_client}</code>
                      <span
                        style={{
                          background: STATUT_STYLE[client.statut]?.bg ?? '#f3f4f6',
                          color: STATUT_STYLE[client.statut]?.color ?? '#374151',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {STATUT_STYLE[client.statut]?.label ?? client.statut}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Client #{client.id} · Créé le {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </>
                )}
              </div>
              <button className={styles.closeBtn} onClick={closeModal} aria-label="Fermer">✕</button>
            </div>

            {/* Onglets */}
            {!loadingDetails && client && (
              <>
                <div className={styles.tabs}>
                  {(['info', 'succursales', 'licences', 'users'] as const).map(tab => (
                    <button
                      key={tab}
                      className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'info' ? '📋 Informations' :
                       tab === 'succursales' ? `🏢 Agences (${succursales?.length ?? 0})` :
                       tab === 'licences' ? `🔑 Licences (${licences?.length ?? 0})` :
                       `👥 Utilisateurs (${users?.length ?? 0})`}
                    </button>
                  ))}
                </div>

                <div className={styles.modalBody}>
                  {/* ── Onglet Informations ── */}
                  {activeTab === 'info' && (
                    <div className={styles.infoGrid}>
                      <DetailRow label="Nom de l'entreprise" value={client.nom} />
                      <DetailRow label="Code Client" value={<code className={styles.code}>{client.code_client}</code>} />
                      <DetailRow label="Email de contact" value={client.email_contact || '—'} />
                      <DetailRow label="Téléphone" value={client.telephone || '—'} />
                      <DetailRow label="Statut" value={
                        <span style={{
                          background: STATUT_STYLE[client.statut]?.bg,
                          color: STATUT_STYLE[client.statut]?.color,
                          padding: '2px 10px', borderRadius: '999px',
                          fontSize: '0.75rem', fontWeight: 700,
                        }}>
                          {STATUT_STYLE[client.statut]?.label ?? client.statut}
                        </span>
                      } />
                      <DetailRow label="Compte actif" value={client.is_active ? '✅ Oui' : '❌ Non'} />
                      <DetailRow label="Date de création" value={new Date(client.created_at).toLocaleString('fr-FR')} />
                      <DetailRow label="Dernière mise à jour" value={new Date(client.updated_at).toLocaleString('fr-FR')} />
                    </div>
                  )}

                  {/* ── Onglet Agences ── */}
                  {activeTab === 'succursales' && (
                    <div>
                      {!succursales || succursales.length === 0 ? (
                        <p className={styles.empty}>Aucune agence enregistrée.</p>
                      ) : succursales.map(s => (
                        <div key={s.id} className={styles.card}>
                          <div className={styles.cardTitle}>🏢 {s.nom}</div>
                          <div className={styles.infoGrid}>
                            <DetailRow label="Ville" value={s.ville || '—'} />
                            <DetailRow label="Adresse" value={s.adresse || '—'} />
                            <DetailRow label="Serveur FTP" value={`${s.ftp_host}:${s.ftp_port}`} />
                            <DetailRow label="Utilisateur FTP" value={s.ftp_user || '—'} />
                            <DetailRow label="Chemin de base" value={<code className={styles.code}>{s.ftp_base_path}</code>} />
                            <DetailRow label="Mode stockage" value={s.storage_mode} />
                            <DetailRow label="Créée le" value={new Date(s.created_at).toLocaleDateString('fr-FR')} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Onglet Licences ── */}
                  {activeTab === 'licences' && (
                    <div>
                      {!licences || licences.length === 0 ? (
                        <p className={styles.empty}>Aucune licence trouvée.</p>
                      ) : licences.map(l => (
                        <div key={l.id} className={styles.card}>
                          <div className={styles.cardTitle}>
                            🔑 Licence #{l.id}
                            <span className={`badge ${l.statut === 'ACTIF' ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                              {l.statut}
                            </span>
                          </div>
                          <div className={styles.infoGrid}>
                            <DetailRow label="Agence" value={l.succursale_nom || '—'} />
                            <DetailRow label="Machines max" value={String(l.max_machines)} />
                            <DetailRow label="Début" value={l.date_debut ? new Date(l.date_debut).toLocaleDateString('fr-FR') : '—'} />
                            <DetailRow label="Fin" value={l.date_fin ? new Date(l.date_fin).toLocaleDateString('fr-FR') : '—'} />
                            <DetailRow label="Montant" value={l.montant ? `${Number(l.montant).toLocaleString('fr-FR')} FCFA` : '—'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Onglet Utilisateurs ── */}
                  {activeTab === 'users' && (
                    <div>
                      {!users || users.length === 0 ? (
                        <p className={styles.empty}>Aucun utilisateur trouvé.</p>
                      ) : (
                        <table className={styles.table} style={{ marginTop: 0 }}>
                          <thead>
                            <tr>
                              <th>Nom</th>
                              <th>Email</th>
                              <th>Rôle</th>
                              <th>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map(u => (
                              <tr key={u.id}>
                                <td className={styles.tdName}>{u.first_name} {u.last_name || u.username}</td>
                                <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                                <td>
                                  <span style={{
                                    background: ROLE_STYLE[u.role]?.bg ?? '#f3f4f6',
                                    color: ROLE_STYLE[u.role]?.color ?? '#374151',
                                    padding: '2px 8px', borderRadius: '999px',
                                    fontSize: '0.7rem', fontWeight: 700,
                                  }}>
                                    {u.role}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.85rem' }}>
                                    {u.is_active ? '🟢 Actif' : '🔴 Inactif'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}
