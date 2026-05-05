'use client';

import { useEffect, useState } from 'react';
import { apiGetUsers, apiGetSuccursales } from '@/lib/api';
import styles from './users.module.css';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  succursale_nom?: string;
  succursale_id?: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [succursales, setSuccursales] = useState<{id: number; nom: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'USER', succursale_id: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [u, s] = await Promise.all([apiGetUsers(), apiGetSuccursales()]);
      setUsers(u?.results ?? u ?? []);
      setSuccursales(s?.results ?? s ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function startEdit(u: User) {
    setEditingId(u.id);
    setForm({
      username: u.username,
      email: u.email,
      password: '', // On laisse vide pour ne changer que si saisi
      role: u.role,
      succursale_id: u.succursale_id?.toString() || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function toggleUser(id: number) {
    const { apiToggleUser } = await import('@/lib/api');
    try {
      await apiToggleUser(id);
      await loadData();
    } catch { /* silent */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const token = document.cookie.match(/claridoc_token=([^;]+)/)?.[1];
      const url = editingId 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/users/${editingId}/`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/users/`;
      
      // On ne veut envoyer le password que s'il est rempli (pour l'update)
      const body: any = { ...form, succursale: form.succursale_id || null };
      if (editingId && !form.password) delete body.password;

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        // DRF renvoie les erreurs par champ : { "username": ["..."], ... }
        if (errData.username) {
          throw new Error(`Nom d'utilisateur : ${errData.username[0]}`);
        } else if (errData.email) {
          throw new Error(`Email : ${errData.email[0]}`);
        } else if (errData.password) {
          throw new Error(`Mot de passe : ${errData.password[0]}`);
        } else if (errData.message) {
          throw new Error(errData.message);
        } else if (errData.detail) {
          throw new Error(errData.detail);
        } else {
          throw new Error('Erreur lors de l\'opération.');
        }
      }
      
      setMsg(editingId ? 'Utilisateur mis à jour !' : 'Utilisateur créé !');
      setShowForm(false);
      setEditingId(null);
      setForm({ username: '', email: '', password: '', role: 'USER', succursale_id: '' });
      await loadData();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Erreur lors de l\'opération.');
    } finally { setSaving(false); }
  }

  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  async function showActivity(u: User) {
    setViewingUser(u);
    setLoadingActivity(true);
    try {
      const { apiGetLogs, apiGetFichiers } = await import('@/lib/api');
      const [logs, files] = await Promise.all([
        apiGetLogs({ userId: u.id }),
        apiGetFichiers(u.id)
      ]);
      setUserLogs(logs?.results ?? logs ?? []);
      setUserFiles(files?.results ?? files ?? []);
    } catch { /* silent */ }
    finally { setLoadingActivity(false); }
  }

  const roleLabel: Record<string, string> = { BOSS: 'Chef', ADMIN: 'Admin', USER: 'Utilisateur' };
  const roleBadge: Record<string, string> = { BOSS: 'badge-info', ADMIN: 'badge-warning', USER: 'badge-success' };

  return (
    <div className={styles.page}>
      <div className={`${styles.header} animate-fade-in`}>
        <div>
          <h1 className="title-lg">Utilisateurs</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Gérez les comptes de votre équipe
          </p>
        </div>
        <button id="open-create-user" className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ username: '', email: '', password: '', role: 'USER', succursale_id: '' }); setViewingUser(null); }}>
          {showForm ? '✕ Annuler' : '+ Nouvel utilisateur'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className={`${styles.formCard} glass animate-fade-in-up`}>
          <h2 className="title-md" style={{ marginBottom: 'var(--space-6)' }}>
            {editingId ? `Modifier : ${form.username}` : 'Nouveau compte'}
          </h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* ... (form content remains same) ... */}
            <div className={styles.row}>
              <div className="input-group">
                <label htmlFor="new-username">Identifiant</label>
                <input id="new-username" className="input" type="text" placeholder="jean.dupont"
                  value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} required />
              </div>
              <div className="input-group">
                <label htmlFor="new-email">Email</label>
                <input id="new-email" className="input" type="email" placeholder="jean@entreprise.com"
                  value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
              </div>
            </div>
            <div className={styles.row}>
              <div className="input-group">
                <label htmlFor="new-password">
                  {editingId ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                </label>
                <input id="new-password" className="input" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required={!editingId} />
              </div>
              <div className="input-group">
                <label htmlFor="new-role">Rôle</label>
                <select id="new-role" className="input" value={form.role}
                  onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                  <option value="USER">Utilisateur (Scanner)</option>
                  <option value="ADMIN">Administrateur Succursale</option>
                  {editingId && form.role === 'BOSS' && <option value="BOSS">Chef d'entreprise</option>}
                </select>
              </div>
            </div>
            {succursales.length > 0 && (
              <div className="input-group">
                <label htmlFor="new-succursale">Succursale</label>
                <select id="new-succursale" className="input" value={form.succursale_id}
                  onChange={e => setForm(f => ({...f, succursale_id: e.target.value}))}>
                  <option value="">— Aucune —</option>
                  {succursales.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
              </div>
            )}
            {msg && <div className={styles.msg}>{msg}</div>}
            <button type="submit" id="create-user-submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer le compte'}
            </button>
          </form>
        </div>
      )}

      {/* Tableau */}
      <div className={`${styles.tableWrap} glass animate-fade-in-up delay-1`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Succursale</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Chargement...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ background: viewingUser?.id === u.id ? 'var(--color-bg-alt)' : 'transparent' }}>
                <td className={styles.tdName}>{u.first_name || u.username} {u.last_name}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                <td><span className={`badge ${roleBadge[u.role] || 'badge-info'}`}>{roleLabel[u.role] || u.role}</span></td>
                <td style={{ color: 'var(--color-text-muted)' }}>{u.succursale_nom || '—'}</td>
                <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Actif' : 'Bloqué'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-ghost" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                      onClick={() => showActivity(u)}>
                      Voir
                    </button>
                    <button className="btn btn-ghost" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={() => startEdit(u)}>
                      Editer
                    </button>
                    <button className={`btn ${u.is_active ? 'btn-ghost' : 'btn-primary'}`}
                      style={{ padding: '4px 8px', fontSize: '0.75rem', color: u.is_active ? 'var(--color-danger)' : 'white' }}
                      onClick={() => toggleUser(u.id)}>
                      {u.is_active ? 'Bloquer' : 'Activer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Détails de l'activité */}
      {viewingUser && (
        <div className={`${styles.activityPanel} glass animate-fade-in-up`} style={{ marginTop: '2rem', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 className="title-md">Activité de {viewingUser.first_name || viewingUser.username}</h2>
            <button className="btn btn-ghost" onClick={() => setViewingUser(null)}>Fermer</button>
          </div>

          <div className={styles.activityGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Logs de connexion */}
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Historique des connexions</h3>
              <div className={styles.scrollArea} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {loadingActivity ? <p>Chargement...</p> : userLogs.length === 0 ? <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Aucun log.</p> : (
                  <table style={{ width: '100%', fontSize: '0.8rem' }}>
                    <tbody>
                      {userLogs.map((l: any) => (
                        <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--color-text-muted)' }}>{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}><span className="badge badge-info">{l.action}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Documents numérisés */}
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Documents numérisés</h3>
              <div className={styles.scrollArea} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {loadingActivity ? <p>Chargement...</p> : userFiles.length === 0 ? <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Aucun document.</p> : (
                  <table style={{ width: '100%', fontSize: '0.8rem' }}>
                    <tbody>
                      {userFiles.map((f: any) => (
                        <tr key={f.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '8px 0', fontWeight: 500 }}>{f.nom_fichier}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--color-text-muted)' }}>{new Date(f.created_at).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
