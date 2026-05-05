'use client';

import { useState, useEffect } from 'react';
import { apiSubmitPayment, apiGetSuccursales, apiGetLicences } from '@/lib/api';
import styles from './licence.module.css';

const FORFAITS = [
  { postes: '1-3 PCs',  mensuel: 15000, annuel: 150000, max: 3 },
  { postes: '4-8 PCs',  mensuel: 35000, annuel: 350000, max: 8 },
  { postes: '9-20 PCs', mensuel: 70000, annuel: 700000, max: 20 },
  { postes: '21+ PCs',  mensuel: null,  annuel: null,   max: 999 },
];

export default function LicencePage() {
  const [succursales, setSuccursales] = useState<{id: number; nom: string}[]>([]);
  const [licences, setLicences] = useState<any[]>([]);
  const [selected, setSelected] = useState<{postes: string; duree: 'Mensuel' | 'Annuel'} | null>(null);
  const [step, setStep] = useState<'forfaits' | 'paiement' | 'confirmation'>('forfaits');
  const [form, setForm] = useState({ succursale_id: '', nom_nouvelle: '', moyen: 'VIREMENT', preuve: '' });
  const [fichier, setFichier] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiGetSuccursales().catch(() => []),
      apiGetLicences().catch(() => [])
    ]).then(([sData, lData]) => {
      setSuccursales(sData?.results ?? sData ?? []);
      setLicences(lData?.results ?? lData ?? []);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true); setError('');
    try {
      const forfaitObj = FORFAITS.find(f => f.postes === selected.postes);
      const computedMontant = forfaitObj ? (selected.duree === 'Mensuel' ? forfaitObj.mensuel : forfaitObj.annuel) || 0 : 0;

      const fd = new FormData();
      fd.append('forfait_postes', selected.postes);
      fd.append('forfait_duree', selected.duree);
      fd.append('moyen_paiement', form.moyen);
      fd.append('preuve_paiement_ref', form.preuve);
      fd.append('montant', String(computedMontant));
      if (form.succursale_id) {
        fd.append('succursale_cible', form.succursale_id);
      } else {
        fd.append('nom_nouvelle_succursale', form.nom_nouvelle);
      }
      if (fichier) {
        fd.append('preuve_paiement_fichier', fichier);
      }

      await apiSubmitPayment(fd);
      // Réinitialisation complète du formulaire
      setSelected(null);
      setForm({ succursale_id: '', nom_nouvelle: '', moyen: 'VIREMENT', preuve: '' });
      setFichier(null);
      setStep('confirmation');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission.');
    } finally { setSaving(false); }
  }

  if (step === 'confirmation') {
    return (
      <div className={styles.page}>
        <div className={`${styles.confirmCard} glass animate-fade-in-up`}>
          <div className={styles.confirmIcon}>✓</div>
          <h1 className="title-md">Demande envoyée !</h1>
          <p>Notre équipe va vérifier votre paiement sous <strong>24h</strong>.<br/>
          Vous recevrez un email de confirmation dès que votre licence sera activée.</p>
          <button className="btn btn-ghost" onClick={() => setStep('forfaits')}>Retour aux forfaits</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.header} animate-fade-in`}>
        <div>
          <h1 className="title-lg">Licences & Forfaits</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Choisissez un forfait pour activer ou renouveler une succursale
          </p>
        </div>
      </div>

      {/* Étape 1 : Licences actives et Choix du forfait */}
      {step === 'forfaits' && (
        <>
          {licences.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 className="title-md" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Vos Licences Actives</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {licences.map(lic => (
                  <div key={lic.id} className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--color-success)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{lic.succursale_nom || 'Succursale Inconnue'}</h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                          <strong>Date d'achat :</strong> {new Date(lic.created_at).toLocaleDateString('fr-FR')} à {new Date(lic.created_at).toLocaleTimeString('fr-FR')}
                        </p>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          <strong>Expire le :</strong> {new Date(lic.date_fin).toLocaleDateString('fr-FR')} à 23:59:59
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'inline-block', background: 'var(--color-success)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '100px', marginBottom: '0.5rem' }}>
                          Active
                        </span>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                          <strong>{lic.max_machines}</strong> PC{lic.max_machines > 1 ? 's' : ''} autorisé{lic.max_machines > 1 ? 's' : ''}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                          Code: {lic.code_activation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="title-md" style={{ marginBottom: '1rem' }}>Ajouter ou Renouveler une Licence</h2>
          <div className={styles.toggle}>
            {(['Mensuel', 'Annuel'] as const).map(d => (
              <button key={d}
                className={`${styles.toggleBtn} ${selected?.duree === d ? styles.toggleActive : ''}`}
                onClick={() => setSelected(s => s ? { ...s, duree: d } : { postes: '1-3 PCs', duree: d })}>
                {d} {d === 'Annuel' && <span className={styles.discount}>-17%</span>}
              </button>
            ))}
          </div>

          <div className={styles.forfaitsGrid}>
            {FORFAITS.map(f => {
              const duree = selected?.duree ?? 'Mensuel';
              const prix = duree === 'Mensuel' ? f.mensuel : f.annuel;
              const isSelected = selected?.postes === f.postes;
              return (
                <div key={f.postes}
                  className={`${styles.forfaitCard} glass ${isSelected ? styles.forfaitSelected : ''}`}
                  onClick={() => f.mensuel && setSelected({ postes: f.postes, duree: duree as 'Mensuel' | 'Annuel' })}>
                  {isSelected && <div className={styles.selectedBadge}>✓ Sélectionné</div>}
                  <div className={styles.forfaitPostes}>{f.postes}</div>
                  {prix ? (
                    <div className={styles.forfaitPrix}>
                      <span className={styles.prixNum}>{prix.toLocaleString('fr')}</span>
                      <span className={styles.prixUnit}> XAF / {duree === 'Mensuel' ? 'mois' : 'an'}</span>
                    </div>
                  ) : (
                    <div className={styles.forfaitPrix}>
                      <span className={styles.prixNum}>Sur devis</span>
                    </div>
                  )}
                  <ul className={styles.forfaitFeatures}>
                    <li>✓ Jusqu&apos;à {f.max === 999 ? 'illimité' : f.max} PC{f.max > 1 ? 's' : ''}</li>
                    <li>✓ Succursale dédiée</li>
                    <li>✓ FTP indépendant</li>
                    <li>✓ Support inclus</li>
                  </ul>
                  {f.mensuel ? (
                    <button className={`btn ${isSelected ? 'btn-primary' : 'btn-ghost'}`} style={{ width: '100%' }}
                      onClick={e => { e.stopPropagation(); setSelected({ postes: f.postes, duree: duree as 'Mensuel' | 'Annuel' }); }}>
                      Choisir ce forfait
                    </button>
                  ) : (
                    <a href="/contact" className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>Nous contacter</a>
                  )}
                </div>
              );
            })}
          </div>

          {selected && (
            <div className={styles.actionBar}>
              <div>
                <strong>{selected.postes}</strong> — {selected.duree}
              </div>
              <button className="btn btn-primary" onClick={() => setStep('paiement')}>
                Procéder au paiement →
              </button>
            </div>
          )}
        </>
      )}

      {/* Étape 2 : Paiement */}
      {step === 'paiement' && selected && (
        <div className={`${styles.payCard} glass animate-fade-in-up`}>
          <div className={styles.payHeader}>
            <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              onClick={() => setStep('forfaits')}>← Retour</button>
            <h2 className="title-md">Finaliser le paiement</h2>
          </div>
          <div className={styles.payRecap}>
            <span>Forfait : <strong>{selected.postes} — {selected.duree}</strong></span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="input-group">
              <label>Succursale concernée</label>
              <select className="input" value={form.succursale_id}
                onChange={e => setForm(f => ({...f, succursale_id: e.target.value}))}>
                <option value="">+ Nouvelle succursale</option>
                {succursales.map(s => <option key={s.id} value={s.id}>Renouveler — {s.nom}</option>)}
              </select>
            </div>
            {!form.succursale_id && (
              <div className="input-group">
                <label htmlFor="nom-succ">Nom de la nouvelle succursale</label>
                <input id="nom-succ" className="input" type="text" placeholder="Ex: Agence Douala Centre"
                  value={form.nom_nouvelle} onChange={e => setForm(f => ({...f, nom_nouvelle: e.target.value}))} required />
              </div>
            )}
            <div className="input-group">
              <label>Mode de paiement</label>
              <div className={styles.moyenGrid}>
                {[['VIREMENT', '🏦 Virement bancaire'], ['MTN_MOMO', '📱 MTN Mobile Money'], ['ORANGE_MONEY', '🟠 Orange Money']].map(([val, label]) => (
                  <div key={val} className={`${styles.moyenCard} ${form.moyen === val ? styles.moyenSelected : ''}`}
                    onClick={() => setForm(f => ({...f, moyen: val}))}>
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="preuve">Référence de transaction / N° de reçu</label>
              <input id="preuve" className="input" type="text" placeholder="Ex: MTN-20240427-XXXX"
                value={form.preuve} onChange={e => setForm(f => ({...f, preuve: e.target.value}))} required />
            </div>
            <div className="input-group">
              <label htmlFor="preuve-fichier">Preuve de paiement <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optionnel — image ou PDF)</span></label>
              <label htmlFor="preuve-fichier" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: 'var(--color-bg-elevated)', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--color-primary)' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span style={{ fontSize: '0.875rem', color: fichier ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                  {fichier ? fichier.name : 'Cliquer pour joindre un fichier (PNG, JPG, PDF)'}
                </span>
              </label>
              <input id="preuve-fichier" type="file" accept="image/png,image/jpeg,image/jpg,application/pdf"
                style={{ display: 'none' }}
                onChange={e => setFichier(e.target.files?.[0] ?? null)}
              />
              {fichier && fichier.type.startsWith('image/') && (
                <div style={{ marginTop: '0.5rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 200 }}>
                  <img src={URL.createObjectURL(fichier)} alt="Aperçu" style={{ width: '100%', objectFit: 'cover', maxHeight: 200 }} />
                </div>
              )}
              {fichier && (
                <button type="button" onClick={() => setFichier(null)}
                  style={{ fontSize: '0.75rem', color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '0.25rem' }}>
                  × Supprimer le fichier
                </button>
              )}
            </div>
            {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</div>}
            <button type="submit" id="submit-payment" className="btn btn-primary"
              style={{ width: '100%', padding: '0.875rem' }} disabled={saving}>
              {saving ? 'Envoi en cours...' : 'Confirmer ma demande'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
