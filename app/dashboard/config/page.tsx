'use client';

import { useEffect, useState } from 'react';
import { apiGetConfig, apiUpdateConfig, apiGetSuccursales } from '@/lib/api';
import styles from './config.module.css';

interface Config {
  succursale_id?: number;
  ftp_host: string;
  ftp_port: number;
  ftp_user: string;
  ftp_password_enc: string;
  ftp_fingerprint: string;
  ftp_base_path: string;
  storage_mode: string;
}

export default function ConfigPage() {
  const [succursales, setSuccursales] = useState<{id: number; nom: string}[]>([]);
  const [selectedSucc, setSelectedSucc] = useState<number | ''>('');
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiGetSuccursales()
      .then(s => {
        const list = s?.results ?? s ?? [];
        setSuccursales(list);
        if (list.length > 0) setSelectedSucc(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSucc) return;
    setLoading(true);
    apiGetConfig(selectedSucc as number)
      .then(c => setConfig(c))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, [selectedSucc]);

  function update(field: keyof Config, value: string | number) {
    setConfig(c => c ? { ...c, [field]: value } : c);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSaving(true); setMsg(''); setError('');
    try {
      await apiUpdateConfig({ ...config, succursale_id: selectedSucc || undefined });
      setMsg('Configuration sauvegardée avec succès !');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.header} animate-fade-in`}>
        <div>
          <h1 className="title-lg">Configuration FTP</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Paramétrez le serveur de stockage de chaque succursale
          </p>
        </div>
      </div>

      {succursales.length > 1 && (
        <div className="input-group" style={{ maxWidth: 320 }}>
          <label htmlFor="succ-select">Succursale à configurer</label>
          <select id="succ-select" className="input" value={selectedSucc}
            onChange={e => setSelectedSucc(Number(e.target.value))}>
            {succursales.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)' }}>Chargement de la configuration...</div>
      ) : !config ? (
        <div className={`${styles.emptyCard} glass`}>
          <p>Aucune succursale trouvée. Veuillez d&apos;abord activer une licence.</p>
          <a href="/dashboard/licence" className="btn btn-primary">Activer une licence</a>
        </div>
      ) : (
        <form onSubmit={handleSave} className={`${styles.form} animate-fade-in-up delay-1`}>
          <div className={`${styles.formCard} glass`}>
            <h2 className={styles.sectionTitle}>Connexion FTP</h2>
            <div className={styles.row}>
              <div className="input-group">
                <label htmlFor="ftp-host">Adresse du serveur (Host)</label>
                <input id="ftp-host" className="input" type="text" placeholder="192.168.1.1"
                  value={config.ftp_host || ''} onChange={e => update('ftp_host', e.target.value)} />
              </div>
              <div className="input-group" style={{ maxWidth: 140 }}>
                <label htmlFor="ftp-port">Port</label>
                <input id="ftp-port" className="input" type="number" placeholder="21"
                  value={config.ftp_port ?? 21} onChange={e => update('ftp_port', Number(e.target.value))} />
              </div>
            </div>
            <div className={styles.row}>
              <div className="input-group">
                <label htmlFor="ftp-user">Nom d&apos;utilisateur FTP</label>
                <input id="ftp-user" className="input" type="text" placeholder="claridoc_ftp"
                  value={config.ftp_user || ''} onChange={e => update('ftp_user', e.target.value)} />
              </div>
              <div className="input-group">
                <label htmlFor="ftp-pass">Mot de passe (chiffré AES)</label>
                <input id="ftp-pass" className="input" type="password" placeholder="••••••••"
                  value={config.ftp_password_enc || ''} onChange={e => update('ftp_password_enc', e.target.value)} />
              </div>
            </div>
          </div>

          <div className={`${styles.formCard} glass`}>
            <h2 className={styles.sectionTitle}>Paramètres avancés</h2>
            <div className="input-group">
              <label htmlFor="ftp-path">Répertoire de base</label>
              <input id="ftp-path" className="input" type="text" placeholder="/ClariDoc_Cloud/"
                value={config.ftp_base_path || ''} onChange={e => update('ftp_base_path', e.target.value)} />
            </div>
            <div className="input-group">
              <label htmlFor="ftp-fingerprint">Empreinte TLS (Fingerprint)</label>
              <input id="ftp-fingerprint" className="input" type="text" placeholder="5d:94:..."
                value={config.ftp_fingerprint || ''} onChange={e => update('ftp_fingerprint', e.target.value)} />
            </div>
            <div className="input-group">
              <label htmlFor="storage-mode">Mode de stockage</label>
              <select id="storage-mode" className="input" value={config.storage_mode}
                onChange={e => update('storage_mode', e.target.value)}>
                <option value="LOCAL">LOCAL — FTP local (Privacy First)</option>
                <option value="SFTP">SFTP — Transfert sécurisé</option>
              </select>
            </div>
          </div>

          {msg && <div className={styles.msgSuccess}>{msg}</div>}
          {error && <div className={styles.msgError}>{error}</div>}

          <button type="submit" id="save-config" className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem' }} disabled={saving}>
            {saving ? 'Sauvegarde...' : '💾 Sauvegarder la configuration'}
          </button>
        </form>
      )}
    </div>
  );
}
