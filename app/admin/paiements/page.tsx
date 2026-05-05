'use client';

import { useEffect, useState } from 'react';
import { apiGetPayments, apiValidatePayment } from '@/lib/api';
import styles from './paiements.module.css';

interface Payment {
  id: number;
  client_nom: string;
  forfait_postes: string;
  forfait_duree: string;
  moyen_paiement: string;
  preuve_paiement_ref: string;
  preuve_paiement_fichier?: string | null;
  montant: string;
  nom_nouvelle_succursale?: string;
  succursale_cible_nom?: string;
  statut: string;
  created_at: string;
}

interface LicenceResult {
  code_activation: string;
  max_machines: number;
  date_fin: string;
  client_nom: string;
  succursale_nom: string;
  email_envoye_a: string | null;
}

/** Déduit un nombre de postes conseillé depuis le libellé forfait */
function suggestMaxMachines(forfait: string): number {
  if (forfait.includes('9')) return 9;
  if (forfait.includes('4')) return 4;
  return 1;
}

/** Déduit une date de fin conseillée depuis le libellé forfait */
function suggestDateFin(forfait: string): string {
  const d = new Date();
  d.setDate(d.getDate() + (forfait.toLowerCase().includes('annuel') ? 365 : 31));
  return d.toISOString().split('T')[0];
}

export default function PaiementsAdminPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modale de validation
  const [modalPayment, setModalPayment] = useState<Payment | null>(null);
  const [maxMachines, setMaxMachines] = useState(1);
  const [dateFin, setDateFin] = useState('');
  const [montant, setMontant] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Résultat licence générée
  const [licenceResult, setLicenceResult] = useState<LicenceResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Rejet
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await apiGetPayments();
      setPayments(data?.results ?? data ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  // ── Ouvrir la modale de validation ──
  function openModal(p: Payment) {
    setModalPayment(p);
    setMaxMachines(suggestMaxMachines(p.forfait_postes));
    setDateFin(suggestDateFin(p.forfait_duree));
    setMontant(Number(p.montant) || 0);
    setLicenceResult(null);
    setCopied(false);
  }

  function closeModal() {
    setModalPayment(null);
    setLicenceResult(null);
    setCopied(false);
  }

  // ── Valider et générer la licence ──
  async function handleAccept() {
    if (!modalPayment) return;
    setProcessing(true);
    try {
      const result = await apiValidatePayment(modalPayment.id, 'accept', {
        max_machines: maxMachines,
        date_fin: dateFin,
        montant: montant,
      });
      setLicenceResult(result);
      await loadData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur lors de la génération.');
    } finally {
      setProcessing(false);
    }
  }

  // ── Rejeter ──
  async function handleReject(id: number) {
    if (!confirm('Confirmer le rejet de cette demande ?')) return;
    setRejectingId(id);
    try {
      await apiValidatePayment(id, 'reject');
      await loadData();
      if (modalPayment?.id === id) closeModal();
    } catch { /* silent */ }
    finally { setRejectingId(null); }
  }

  // ── Copier le code ──
  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const pending = payments.filter(p => p.statut === 'EN_ATTENTE');
  const done    = payments.filter(p => p.statut !== 'EN_ATTENTE');
  const validatedRevenue = payments.filter(p => p.statut === 'VALIDE').reduce((acc, p) => acc + (Number(p.montant) || 0), 0);

  const moyenLabel: Record<string, string> = {
    VIREMENT: '🏦 Virement', MTN_MOMO: '📱 MTN MoMo', ORANGE_MONEY: '🟠 Orange Money', AUTRE: 'Autre',
  };

  return (
    <>
      <div className={styles.page}>
        {/* ── Header ── */}
        <div className={`${styles.header} animate-fade-in`}>
          <div>
            <h1 className="title-lg">Paiements & Revenus</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Validez les demandes, générez les licences et suivez vos revenus.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Revenus générés</span><br/>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-success)' }}>{validatedRevenue.toLocaleString('fr-FR')} XAF</strong>
            </div>
            {pending.length > 0 && (
              <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '6px 16px', height: 'fit-content' }}>
                {pending.length} en attente
              </span>
            )}
          </div>
        </div>

        {/* ── Demandes en attente ── */}
        {pending.length > 0 && (
          <div className={`${styles.section} animate-fade-in-up`}>
            <h2 className="title-md" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              En attente de validation
            </h2>
            <div className={styles.cards}>
              {pending.map(p => (
                <div key={p.id} className={`${styles.payCard} glass`}>
                  <div className={styles.payTop}>
                    <div className={styles.clientName}>{p.client_nom}</div>
                    <span className="badge badge-warning">EN ATTENTE</span>
                  </div>
                  <div className={styles.payDetails}>
                    <div className={styles.detail}><span>Forfait demandé</span><strong>{p.forfait_postes} — {p.forfait_duree}</strong></div>
                    <div className={styles.detail}><span>Succursale</span><strong>{p.succursale_cible_nom || p.nom_nouvelle_succursale || '—'}</strong></div>
                    <div className={styles.detail}><span>Paiement</span><strong>{moyenLabel[p.moyen_paiement] || p.moyen_paiement}</strong></div>
                    <div className={styles.detail}><span>Référence</span><code className={styles.ref}>{p.preuve_paiement_ref || 'Non fournie'}</code></div>
                    <div className={styles.detail}><span>Montant</span><strong>{p.montant ? `${Number(p.montant).toLocaleString('fr-FR')} FCFA` : '—'}</strong></div>
                    <div className={styles.detail}><span>Date</span><strong>{new Date(p.created_at).toLocaleString('fr-FR')}</strong></div>
                  </div>
                  {p.preuve_paiement_fichier && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', fontWeight: 600 }}>Justificatif joint</span>
                      <div style={{ marginTop: '0.4rem' }}>
                        {/\.(png|jpe?g)$/i.test(p.preuve_paiement_fichier) ? (
                          <a href={p.preuve_paiement_fichier} target="_blank" rel="noopener noreferrer">
                            <img
                              src={p.preuve_paiement_fichier}
                              alt="Preuve"
                              style={{ maxHeight: 120, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', objectFit: 'cover', cursor: 'pointer' }}
                            />
                          </a>
                        ) : (
                          <a href={p.preuve_paiement_fichier} download
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            Télécharger le justificatif PDF
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  <div className={styles.payActions}>
                    <button className="btn btn-primary" onClick={() => openModal(p)}>
                      🔑 Générer la licence
                    </button>
                    <button
                      className="btn btn-danger"
                      disabled={rejectingId === p.id}
                      onClick={() => handleReject(p.id)}
                    >
                      {rejectingId === p.id ? 'Traitement...' : '✕ Rejeter'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Historique ── */}
        <div className={`${styles.section} animate-fade-in-up delay-2`}>
          <h2 className="title-md" style={{ marginBottom: 'var(--space-4)' }}>Historique</h2>
          <div className={`${styles.tableWrap} glass`}>
            <table className={styles.table}>
              <thead><tr><th>Client</th><th>Forfait demandé</th><th>Succursale</th><th>Mode</th><th>Montant</th><th>Statut</th><th>Date</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Chargement...</td></tr>
                ) : done.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Aucun historique</td></tr>
                ) : done.map(p => (
                  <tr key={p.id}>
                    <td className={styles.tdName}>{p.client_nom}</td>
                    <td>{p.forfait_postes} — {p.forfait_duree}</td>
                    <td>{p.succursale_cible_nom || p.nom_nouvelle_succursale || '—'}</td>
                    <td>{moyenLabel[p.moyen_paiement] || p.moyen_paiement}</td>
                    <td style={{ fontWeight: 600 }}>{p.montant ? `${Number(p.montant).toLocaleString('fr-FR')} XAF` : '—'}</td>
                    <td><span className={`badge ${p.statut === 'VALIDE' ? 'badge-success' : 'badge-danger'}`}>{p.statut}</span></td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MODALE DE GÉNÉRATION DE LICENCE
      ══════════════════════════════════════════════ */}
      {modalPayment && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>

            {!licenceResult ? (
              /* ── Formulaire ── */
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <h2 className="title-md">🔑 Générer une licence</h2>
                    <p className={styles.modalSubtitle}>Client : <strong>{modalPayment.client_nom}</strong></p>
                  </div>
                  <button className={styles.closeBtn} onClick={closeModal}>✕</button>
                </div>

                {/* Rappel de la demande */}
                <div className={styles.modalRecap}>
                  <div className={styles.recapItem}><span>Forfait demandé</span><strong>{modalPayment.forfait_postes} — {modalPayment.forfait_duree}</strong></div>
                  <div className={styles.recapItem}><span>Paiement</span><strong>{moyenLabel[modalPayment.moyen_paiement] || modalPayment.moyen_paiement}</strong></div>
                  <div className={styles.recapItem}><span>Succursale</span><strong>{modalPayment.succursale_cible_nom || modalPayment.nom_nouvelle_succursale || 'Principale (auto)'}</strong></div>
                  {modalPayment.preuve_paiement_ref && (
                    <div className={styles.recapItem}><span>Référence paiement</span><code className={styles.ref}>{modalPayment.preuve_paiement_ref}</code></div>
                  )}
                </div>

                {/* Formulaire manuel */}
                <div className={styles.modalForm}>
                  <div className="input-group">
                    <label htmlFor="max_machines">Nombre de postes autorisés</label>
                    <input
                      id="max_machines"
                      type="number"
                      min={1}
                      max={999}
                      className="input"
                      value={maxMachines}
                      onChange={e => setMaxMachines(Number(e.target.value))}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="date_fin">Date d&apos;expiration de la licence</label>
                    <input
                      id="date_fin"
                      type="date"
                      className="input"
                      value={dateFin}
                      onChange={e => setDateFin(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="montant_override">Montant convenu (XAF)</label>
                    <input
                      id="montant_override"
                      type="number"
                      min={0}
                      className="input"
                      value={montant}
                      onChange={e => setMontant(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button
                    className="btn btn-primary"
                    disabled={processing || !dateFin || maxMachines < 1}
                    onClick={handleAccept}
                    style={{ flex: 1 }}
                  >
                    {processing ? 'Génération en cours...' : '✓ Valider & Générer la licence'}
                  </button>
                  <button className="btn btn-ghost" onClick={closeModal}>Annuler</button>
                </div>
              </>
            ) : (
              /* ── Résultat : affichage du code ── */
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <h2 className="title-md">✅ Licence générée</h2>
                    <p className={styles.modalSubtitle}>Client : <strong>{licenceResult.client_nom}</strong></p>
                  </div>
                  <button className={styles.closeBtn} onClick={closeModal}>✕</button>
                </div>

                <div className={styles.licenceBox}>
                  <p className={styles.licenceLabel}>Code d&apos;activation</p>
                  <div className={styles.licenceCodeRow}>
                    <code className={styles.licenceCode}>{licenceResult.code_activation}</code>
                    <button
                      className={`btn ${copied ? 'btn-ghost' : 'btn-primary'}`}
                      onClick={() => copyCode(licenceResult.code_activation)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {copied ? '✓ Copié !' : '📋 Copier'}
                    </button>
                  </div>
                </div>

                <div className={styles.licenceDetails}>
                  <div className={styles.recapItem}><span>Postes autorisés</span><strong>{licenceResult.max_machines}</strong></div>
                  <div className={styles.recapItem}><span>Expire le</span><strong>{licenceResult.date_fin}</strong></div>
                  <div className={styles.recapItem}><span>Succursale</span><strong>{licenceResult.succursale_nom}</strong></div>
                  <div className={styles.recapItem}>
                    <span>Email envoyé à</span>
                    <strong>
                      {licenceResult.email_envoye_a
                        ? licenceResult.email_envoye_a
                        : <span style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Aucun email trouvé</span>
                      }
                    </strong>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button className="btn btn-primary" onClick={closeModal} style={{ flex: 1 }}>
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
