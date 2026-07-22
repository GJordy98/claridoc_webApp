'use client';

import { useState, useEffect, useRef } from 'react';
import {
  apiSubmitPayment,
  apiGetSuccursales,
  apiGetLicences,
  apiInitiateSteevePay,
  apiCheckPaymentStatus
} from '@/lib/api';
import styles from './licence.module.css';

// ─── Forfaits disponibles ─────────────────────────────────────────────────────
const FORFAITS_STANDARDS = [
  { postes: '1-3 PCs',  mensuel: 15000,  annuel: 150000, max: 3  },
  { postes: '4-8 PCs',  mensuel: 35000,  annuel: 350000, max: 8  },
  { postes: '9-15 PCs', mensuel: 70000,  annuel: 700000, max: 15 },
  { postes: '16+ PCs',  mensuel: null,   annuel: null,   max: 999 },
];

const FORFAIT_DEMO = {
  postes:     '2 PCs (Démo)',
  dureeKey:   'Démo (2 semaines)',
  prix_fixe:  50,
  max:        2,
};

// Union de tous les forfaits pour la recherche du montant
const FORFAITS = FORFAITS_STANDARDS;

// ─── Providers de paiement via le hub de Steeve ───────────────────────────────
const PROVIDERS = [
  { id: 1, value: 'ORANGE_MONEY', label: 'Orange Money',     image: '/images/payments/orange_money.png', needsPhone: true  },
  { id: 2, value: 'MTN_MOMO',     label: 'MTN Mobile Money', image: '/images/payments/mtn_momo.png',     needsPhone: true  },
  { id: 3, value: 'CARTE',        label: 'Carte Bancaire',   image: '/images/payments/carte_bancaire.jpg',needsPhone: false },
  { id: null, value: 'VIREMENT',  label: 'Virement Bancaire',icon: '🏦', needsPhone: false },
];

// Mapping provider value → moyen_paiement attendu par le backend Django
const MOYEN_PAIEMENT_MAP: Record<string, string> = {
  ORANGE_MONEY: 'ORANGE_MONEY',
  MTN_MOMO:     'MTN_MOMO',
  CARTE:        'AUTRE',      // Pas encore dans les choix Django → AUTRE
  VIREMENT:     'VIREMENT',
};

type Step = 'forfaits' | 'paiement' | 'attente' | 'confirmation';
type Duree = 'Mensuel' | 'Annuel' | 'Démo (2 semaines)';

// ─── Indicatifs Pays pour Mobile Money ─────────────────────────────────────────
const PAYS_INDICATIFS = [
  { code: '237', flag: '🇨🇲', name: 'Cameroun (+237)' },
  { code: '241', flag: '🇬🇦', name: 'Gabon (+241)' },
  { code: '225', flag: '🇨🇮', name: "Côte d'Ivoire (+225)" },
  { code: '221', flag: '🇸🇳', name: 'Sénégal (+221)' },
  { code: '242', flag: '🇨🇬', name: 'Congo (+242)' },
  { code: '229', flag: '🇧🇯', name: 'Bénin (+229)' },
  { code: '228', flag: '🇧🇹', name: 'Togo (+228)' },
  { code: '226', flag: '🇧🇫', name: 'Burkina Faso (+226)' },
];

export default function LicencePage() {
  const [succursales, setSuccursales] = useState<{id: number; nom: string}[]>([]);
  const [licences, setLicences]       = useState<any[]>([]);
  const [selected, setSelected]       = useState<{postes: string; duree: Duree} | null>(null);
  const [step, setStep]               = useState<Step>('forfaits');
  const [indicatif, setIndicatif]     = useState('237');
  const [form, setForm]               = useState({
    succursale_id: '',
    nom_nouvelle:  '',
    moyen:         'ORANGE_MONEY',
    telephone:     '',
    preuve:        '',
  });
  const [fichier, setFichier]         = useState<File | null>(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  // État après initiation hub
  const [hubReference, setHubReference] = useState('');
  const [hubMessage, setHubMessage]     = useState('');
  const [pollStatus, setPollStatus]     = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([
      apiGetSuccursales().catch(() => []),
      apiGetLicences().catch(() => []),
    ]).then(([sData, lData]) => {
      setSuccursales(sData?.results ?? sData ?? []);
      setLicences(lData?.results ?? lData ?? []);
    });
  }, []);

  // Polling du statut après initiation hub
  useEffect(() => {
    if (step !== 'attente' || !hubReference) return;

    // Vérification immédiate puis toutes les 5 secondes
    const doPoll = async () => {
      try {
        const res = await apiCheckPaymentStatus(hubReference);
        const s = res.status as 'PENDING' | 'SUCCESS' | 'FAILED';
        setPollStatus(s);
        if (s === 'SUCCESS') {
          clearInterval(pollRef.current!);
          setStep('confirmation');
        } else if (s === 'FAILED') {
          clearInterval(pollRef.current!);
        }
      } catch {
        // Ignorer les erreurs réseau temporaires
      }
    };

    doPoll();
    pollRef.current = setInterval(doPoll, 5000);
    return () => clearInterval(pollRef.current!);
  }, [step, hubReference]);

  const selectedProvider = PROVIDERS.find(p => p.value === form.moyen);
  const isHubPayment     = form.moyen !== 'VIREMENT';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    // Validation téléphone pour OM et MoMo
    if (isHubPayment && selectedProvider?.needsPhone && !form.telephone.trim()) {
      setError('Le numéro de téléphone est requis pour ce mode de paiement.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Calculer le montant selon le type de forfait
      const isDemo = selected.postes === FORFAIT_DEMO.postes;
      let computedMontant: number;
      if (isDemo) {
        computedMontant = FORFAIT_DEMO.prix_fixe;
      } else {
        const forfaitObj = FORFAITS.find(f => f.postes === selected.postes);
        computedMontant = forfaitObj
          ? (selected.duree === 'Mensuel' ? forfaitObj.mensuel : forfaitObj.annuel) || 0
          : 0;
      }

      // 1. Créer la PaymentRequest sur le backend
      const fd = new FormData();
      fd.append('forfait_postes',    selected.postes);
      fd.append('forfait_duree',     selected.duree);
      fd.append('moyen_paiement',    MOYEN_PAIEMENT_MAP[form.moyen] || 'AUTRE');
      fd.append('montant',           String(computedMontant));

      if (form.succursale_id) {
        fd.append('succursale_cible', form.succursale_id);
      } else {
        fd.append('nom_nouvelle_succursale', form.nom_nouvelle);
      }
      // Pour virement uniquement : joindre la preuve
      if (!isHubPayment) {
        if (form.preuve)  fd.append('preuve_paiement_ref', form.preuve);
        if (fichier)      fd.append('preuve_paiement_fichier', fichier);
      }


      const paymentRequest = await apiSubmitPayment(fd);

      // 2a. Paiement via hub de Steeve (OM, MoMo, Carte)
      if (isHubPayment && paymentRequest.id) {
        let rawDigits = form.telephone.replace(/\D/g, '');
        let cleanPhone: string;
        if (rawDigits.startsWith(indicatif)) {
          cleanPhone = rawDigits;
        } else {
          cleanPhone = indicatif + rawDigits;
        }
        const result = await apiInitiateSteevePay(
          paymentRequest.id,
          cleanPhone,
          selectedProvider!.id!
        );
        setHubReference(result.hub_reference || '');
        setHubMessage(result.message || 'Paiement initié. Veuillez valider sur votre téléphone.');
        setPollStatus('PENDING');
        setStep('attente');
        return;
      }

      // 2b. Virement bancaire → confirmation manuelle
      setStep('confirmation');

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission.');
    } finally {
      setSaving(false);
    }
  }

  // ─── Étape : Attente de confirmation de paiement ──────────────────────────
  if (step === 'attente') {
    return (
      <div className={styles.page}>
        <div className={`${styles.confirmCard} glass animate-fade-in-up`}>
          {pollStatus === 'PENDING' && (
            <>
              <div className={styles.confirmIcon} style={{
                borderColor: 'var(--color-warning)',
                color: 'var(--color-warning)',
                background: 'hsla(45,100%,51%,0.1)',
                fontSize: '2rem',
              }}>⏳</div>
              <h1 className="title-md">En attente de confirmation</h1>
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                {hubMessage}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                Vérification automatique en cours... ne quittez pas cette page.
              </p>
              {hubReference && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.75rem', fontFamily: 'monospace' }}>
                  Réf : {hubReference}
                </p>
              )}
              {/* Indicateur de chargement animé */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '1.5rem' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'var(--color-warning)',
                    animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}/>
                ))}
              </div>
            </>
          )}

          {pollStatus === 'FAILED' && (
            <>
              <div className={styles.confirmIcon} style={{
                borderColor: 'var(--color-danger)',
                color: 'var(--color-danger)',
                background: 'hsla(0,100%,50%,0.1)',
              }}>✕</div>
              <h1 className="title-md">Paiement échoué</h1>
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                La transaction a été refusée ou annulée.<br/>
                Aucun montant n&apos;a été débité.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => {
                  setStep('paiement');
                  setError('');
                }}>Réessayer</button>
                <button className="btn btn-ghost" onClick={() => setStep('forfaits')}>
                  Retour aux forfaits
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Étape : Confirmation (Virement) ──────────────────────────────────────
  if (step === 'confirmation') {
    return (
      <div className={styles.page}>
        <div className={`${styles.confirmCard} glass animate-fade-in-up`}>
          <div className={styles.confirmIcon}>✓</div>
          <h1 className="title-md">Demande envoyée !</h1>
          <p style={{ textAlign: 'center' }}>
            Notre équipe va vérifier votre virement sous <strong>24h</strong>.<br/>
            Vous recevrez un email dès que votre licence sera activée.
          </p>
          <button className="btn btn-ghost" onClick={() => {
            setStep('forfaits');
            setSelected(null);
            setForm({ succursale_id: '', nom_nouvelle: '', moyen: 'ORANGE_MONEY', telephone: '', preuve: '' });
            setFichier(null);
          }}>Retour aux forfaits</button>
        </div>
      </div>
    );
  }

  // ─── Page principale ───────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={`${styles.header} animate-fade-in`}>
        <div>
          <h1 className="title-lg">Licences &amp; Forfaits</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Choisissez un forfait pour activer ou renouveler une succursale
          </p>
        </div>
      </div>

      {/* ── Étape 1 : Forfaits ────────────────────────────────────────────── */}
      {step === 'forfaits' && (
        <>
          {licences.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 className="title-md" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>
                Vos Licences Actives
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {licences.map(lic => (
                  <div key={lic.id} className="glass" style={{
                    padding: '1.5rem', borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid var(--color-success)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                          {lic.succursale_nom || 'Succursale Inconnue'}
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                          <strong>Acheté le :</strong> {new Date(lic.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          <strong>Expire le :</strong> {new Date(lic.date_fin).toLocaleDateString('fr-FR')} à 23:59
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block', background: 'var(--color-success)', color: '#fff',
                          fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem',
                          borderRadius: '100px', marginBottom: '0.5rem'
                        }}>Active</span>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                          <strong>{lic.max_machines}</strong> PC{lic.max_machines > 1 ? 's' : ''} autorisé{lic.max_machines > 1 ? 's' : ''}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                          Code : {lic.code_activation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="title-md" style={{ marginBottom: '1rem' }}>Ajouter ou Renouveler une Licence</h2>

          {/* ── Carte Démo (toujours visible, durée fixe) ──────────────── */}
          <div
            className={`${styles.forfaitCard} glass ${selected?.postes === FORFAIT_DEMO.postes ? styles.forfaitSelected : ''}`}
            onClick={() => setSelected({ postes: FORFAIT_DEMO.postes, duree: 'Démo (2 semaines)' })}
            style={{ position: 'relative', marginBottom: '1.5rem', borderColor: 'var(--color-primary)', cursor: 'pointer' }}
          >
            <div style={{
              position: 'absolute', top: '-12px', left: '1.25rem',
              background: 'var(--color-primary)', color: '#fff',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
              padding: '0.2rem 0.75rem', borderRadius: '100px',
            }}>🎯 DÉMO</div>
            <div
              className={styles.selectedBadge}
              style={{
                opacity: selected?.postes === FORFAIT_DEMO.postes ? 1 : 0,
                transform: selected?.postes === FORFAIT_DEMO.postes ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.5)',
                pointerEvents: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span>✓ Sélectionné</span>
            </div>
            <div className={styles.forfaitPostes}>{FORFAIT_DEMO.postes}</div>
            <div className={styles.forfaitPrix}>
              <span className={styles.prixNum}>50</span>
              <span className={styles.prixUnit}> FCFA — 2 semaines</span>
            </div>
            <ul className={styles.forfaitFeatures}>
              <li>✓ 2 PCs autorisés</li>
              <li>✓ Durée : 14 jours</li>
              <li>✓ Email + code d&apos;activation</li>
              <li>✓ Paiement automatique (OM, MoMo, Carte)</li>
            </ul>
            <button
              className={`btn ${selected?.postes === FORFAIT_DEMO.postes ? 'btn-primary' : 'btn-ghost'}`}
              style={{ width: '100%' }}
              onClick={e => { e.stopPropagation(); setSelected({ postes: FORFAIT_DEMO.postes, duree: 'Démo (2 semaines)' }); }}
            >
              <span>Essayer la démo</span>
            </button>
          </div>

          {/* ── Toggle Mensuel / Annuel pour forfaits standards ─────────── */}
          <div className={styles.toggle}>
            {(['Mensuel', 'Annuel'] as const).map(d => (
              <button key={d}
                className={`${styles.toggleBtn} ${(selected?.duree === d || (!selected && d === 'Mensuel')) ? styles.toggleActive : ''}`}
                onClick={() => setSelected(s => s ? { ...s, duree: d } : { postes: '1-3 PCs', duree: d })}>
                <span>{d}</span> {d === 'Annuel' && <span className={styles.discount}>-17%</span>}
              </button>
            ))}
          </div>

          <div className={styles.forfaitsGrid}>
            {FORFAITS.map(f => {
              const duree    = (selected?.duree === 'Mensuel' || selected?.duree === 'Annuel') ? selected.duree : 'Mensuel';
              const prix     = duree === 'Mensuel' ? f.mensuel : f.annuel;
              const isSelected = selected?.postes === f.postes;
              return (
                <div key={f.postes}
                  className={`${styles.forfaitCard} glass ${isSelected ? styles.forfaitSelected : ''}`}
                  onClick={() => f.mensuel && setSelected({ postes: f.postes, duree: duree as 'Mensuel' | 'Annuel' })}>
                  <div
                    className={styles.selectedBadge}
                    style={{
                      opacity: isSelected ? 1 : 0,
                      transform: isSelected ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.5)',
                      pointerEvents: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>✓ Sélectionné</span>
                  </div>
                  <div className={styles.forfaitPostes}>{f.postes}</div>
                  {prix ? (
                    <div className={styles.forfaitPrix}>
                      <span className={styles.prixNum}>{prix.toLocaleString('fr')}</span>
                      <span className={styles.prixUnit}> XAF / {duree === 'Mensuel' ? 'mois' : 'an'}</span>
                    </div>
                  ) : (
                    <div className={styles.forfaitPrix}><span className={styles.prixNum}>Sur devis</span></div>
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
                      <span>Choisir ce forfait</span>
                    </button>
                  ) : (
                    <a href="/contact" className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>
                      <span>Nous contacter</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className={styles.actionBar}
            style={{
              opacity: selected ? 1 : 0,
              visibility: selected ? 'visible' : 'hidden',
              transition: 'all 0.25s ease',
              marginTop: '1.5rem',
            }}
          >
            <div><strong>{selected?.postes || ''}</strong> — {selected?.duree || ''}</div>
            <button className="btn btn-primary" onClick={() => setStep('paiement')}>
              <span>Procéder au paiement →</span>
            </button>
          </div>
        </>
      )}

      {/* ── Étape 2 : Paiement ────────────────────────────────────────────── */}
      {step === 'paiement' && selected && (
        <div className={`${styles.payCard} glass animate-fade-in-up`}>
          <div className={styles.payHeader}>
            <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              onClick={() => setStep('forfaits')}>← Retour</button>
            <h2 className="title-md">Finaliser le paiement</h2>
          </div>

          {/* Récapitulatif */}
          <div className={styles.payRecap}>
            <span>Forfait : <strong>{selected.postes} — {selected.duree}</strong></span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
              {(() => {
                if (selected.postes === FORFAIT_DEMO.postes) return '50 FCFA';
                const f = FORFAITS.find(x => x.postes === selected.postes);
                const p = f ? (selected.duree === 'Mensuel' ? f.mensuel : f.annuel) : null;
                return p ? `${p.toLocaleString('fr')} XAF` : 'Sur devis';
              })()}
            </span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Succursale */}
            <div className="input-group">
              <label>Succursale concernée</label>
              <select className="input" value={form.succursale_id}
                onChange={e => setForm(f => ({ ...f, succursale_id: e.target.value }))}>
                <option value="">+ Nouvelle succursale</option>
                {succursales.map(s => (
                  <option key={s.id} value={s.id}>Renouveler — {s.nom}</option>
                ))}
              </select>
            </div>

            {!form.succursale_id && (
              <div className="input-group">
                <label htmlFor="nom-succ">Nom de la nouvelle succursale</label>
                <input id="nom-succ" className="input" type="text"
                  placeholder="Ex: Agence Douala Centre"
                  value={form.nom_nouvelle}
                  onChange={e => setForm(f => ({ ...f, nom_nouvelle: e.target.value }))}
                  required />
              </div>
            )}

            {/* Mode de paiement */}
            <div className="input-group">
              <label className={styles.moyenLabelHeader}>Mode de paiement</label>
              <div className={styles.moyenGrid}>
                {PROVIDERS.map(p => {
                  const isSelected = form.moyen === p.value;
                  return (
                    <div
                      key={p.value}
                      className={`${styles.moyenCard} ${isSelected ? styles.moyenSelected : ''}`}
                      onClick={() => setForm(f => ({ ...f, moyen: p.value, telephone: '' }))}
                    >
                      <div
                        className={styles.moyenCheckBadge}
                        style={{
                          opacity: isSelected ? 1 : 0,
                          transform: isSelected ? 'scale(1)' : 'scale(0.5)',
                          pointerEvents: 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      
                      <div className={styles.moyenLogoBox}>
                        {p.image ? (
                          <img src={p.image} alt={p.label} className={styles.moyenImg} />
                        ) : (
                          <span className={styles.moyenIconEmoji}>{p.icon}</span>
                        )}
                      </div>
                      
                      <span className={styles.moyenTitle}>{p.label}</span>
                      
                      {p.value !== 'VIREMENT' ? (
                        <span className={styles.moyenBadgeAuto}>
                          <span className={styles.dotSuccess} />
                          <span>Automatique</span>
                        </span>
                      ) : (
                        <span className={styles.moyenBadgeManuel}>
                          <span>Manuel</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Champ téléphone avec indicatif pays — affiché pour OM et MoMo uniquement */}
            <div className="input-group" style={{ display: (isHubPayment && selectedProvider?.needsPhone) ? 'block' : 'none' }}>
              <label htmlFor="telephone">
                <span>Numéro de téléphone du payeur</span>
                <span style={{ color: 'var(--color-danger)', marginLeft: 4 }}>*</span>
              </label>
              
              <div className={styles.phoneInputWrapper}>
                <select
                  className={styles.countrySelect}
                  value={indicatif}
                  onChange={e => setIndicatif(e.target.value)}
                >
                  {PAYS_INDICATIFS.map(p => (
                    <option key={p.code} value={p.code}>
                      {p.flag} +{p.code} ({p.name.split(' ')[0]})
                    </option>
                  ))}
                </select>
                
                <div className={styles.phoneInputContainer}>
                  <span className={styles.prefixBadge}>+{indicatif}</span>
                  <input
                    id="telephone"
                    className={styles.phoneInput}
                    type="tel"
                    placeholder="655 00 00 00"
                    value={form.telephone}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    required={isHubPayment && Boolean(selectedProvider?.needsPhone)}
                  />
                </div>
              </div>
              
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                <span>Sélectionnez votre pays et entrez le numéro de votre compte Orange Money ou MTN MoMo.</span>
              </p>
            </div>

            {/* Message info pour paiements hub */}
            <div style={{
              display: isHubPayment ? 'block' : 'none',
              background: 'hsla(210,100%,56%,0.08)',
              border: '1px solid hsla(210,100%,56%,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
            }}>
              <span>💡 Après confirmation, vous recevrez une notification sur votre téléphone pour valider le paiement. Votre licence sera activée automatiquement et le code envoyé par email.</span>
            </div>

            {/* Preuve de paiement — uniquement pour Virement */}
            <div style={{ display: !isHubPayment ? 'flex' : 'none', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label htmlFor="preuve"><span>Référence de transaction / N° de reçu</span></label>
                <input id="preuve" className="input" type="text"
                  placeholder="Ex: VIR-XXXXXXX"
                  value={form.preuve}
                  onChange={e => setForm(f => ({ ...f, preuve: e.target.value }))}
                  required={!isHubPayment} />
              </div>
              <div className="input-group">
                <label htmlFor="preuve-fichier">
                  <span>Preuve de paiement </span>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optionnel — image ou PDF)</span>
                </label>
                <label htmlFor="preuve-fichier" style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: 'var(--color-bg-elevated)', transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, color: 'var(--color-primary)' }}>
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
                  onChange={e => setFichier(e.target.files?.[0] ?? null)} />
                {fichier && (
                  <button type="button" onClick={() => setFichier(null)}
                    style={{ fontSize: '0.75rem', color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '0.25rem' }}>
                    <span>× Supprimer le fichier</span>
                  </button>
                )}
              </div>
            </div>

            <div style={{
              display: error ? 'block' : 'none',
              color: 'var(--color-danger)',
              fontSize: '0.875rem',
              padding: '0.75rem',
              background: 'hsla(0,100%,50%,0.08)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span>⚠ {error}</span>
            </div>

            <button type="submit" id="submit-payment" className="btn btn-primary"
              style={{ width: '100%', padding: '0.875rem' }} disabled={saving}>
              <span>
                {saving
                  ? 'Traitement en cours...'
                  : isHubPayment
                    ? `Payer via ${selectedProvider?.label || ''}`
                    : 'Envoyer ma demande de virement'
                }
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
