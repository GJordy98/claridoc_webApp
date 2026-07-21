'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiGetVisiteurs, apiVisiteurSortie } from '@/lib/api';

interface Visiteur {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  numero_identite: string | null;
  nationalite: string | null;
  entreprise_visitee: string | null;
  date_entree: string;
  date_sortie: string | null;
  statut: 'PRESENT' | 'PARTI';
}

type FiltreStatut = 'PRESENT' | 'PARTI' | 'TOUS';

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Échappe une valeur pour une cellule CSV (séparateur ';', compatible Excel FR). */
function csvCell(val: unknown): string {
  return `"${String(val ?? '').replace(/"/g, '""')}"`;
}

/** Échappe une valeur pour une insertion HTML (vue d'impression). */
function htmlEsc(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function StatCard({
  value, label, color, icon,
}: {
  value: number; label: string; color: string; icon: string;
}) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flex: '1 1 200px',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: color + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

export default function VisiteursPage() {
  const [visiteurs, setVisiteurs] = useState<Visiteur[]>([]);
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('PRESENT');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortieEnCours, setSortieEnCours] = useState<number | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const statut = filtreStatut === 'TOUS' ? undefined : filtreStatut;
      const data = await apiGetVisiteurs(statut);
      setVisiteurs(data?.results ?? data ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filtreStatut]);

  useEffect(() => { charger(); }, [charger]);

  async function handleSortie(v: Visiteur) {
    if (!confirm(`Confirmer la sortie de ${v.prenom} ${v.nom} ?`)) return;
    setSortieEnCours(v.id);
    try {
      await apiVisiteurSortie(v.id);
      await charger();
    } catch (err: unknown) {
      alert('Erreur : ' + (err instanceof Error ? err.message : 'Inconnu'));
    } finally {
      setSortieEnCours(null);
    }
  }

  const filtered = visiteurs.filter(v => {
    const q = search.toLowerCase();
    return (
      v.nom.toLowerCase().includes(q) ||
      v.prenom.toLowerCase().includes(q) ||
      (v.numero_identite ?? '').toLowerCase().includes(q) ||
      (v.entreprise_visitee ?? '').toLowerCase().includes(q) ||
      (v.nationalite ?? '').toLowerCase().includes(q)
    );
  });

  const nbPresents = visiteurs.filter(v => v.statut === 'PRESENT').length;
  const nbPartis   = visiteurs.filter(v => v.statut === 'PARTI').length;
  const nbTotal    = visiteurs.length;

  const filtreOptions: { label: string; value: FiltreStatut }[] = [
    { label: 'Présents', value: 'PRESENT' },
    { label: 'Partis', value: 'PARTI' },
    { label: 'Tous', value: 'TOUS' },
  ];

  const libelleFiltre = filtreOptions.find(o => o.value === filtreStatut)?.label ?? 'Tous';

  // Exporte la liste filtrée (filtre + recherche) en CSV, téléchargé sur le PC hôte.
  function exporterCsv() {
    const entetes = ['Nom', 'Prénom', 'Date de naissance', 'N° pièce', 'Nationalité',
      'Motif / Entreprise', "Heure d'entrée", 'Heure de sortie', 'Statut'];
    const lignes = filtered.map(v => [
      v.nom, v.prenom, v.date_naissance ?? '', v.numero_identite ?? '', v.nationalite ?? '',
      v.entreprise_visitee ?? '', formatDate(v.date_entree), formatDate(v.date_sortie),
      v.statut === 'PRESENT' ? 'Présent' : 'Parti',
    ].map(csvCell).join(';'));
    // BOM (﻿) pour que les accents s'affichent correctement dans Excel.
    const csv = '﻿' + [entetes.map(csvCell).join(';'), ...lignes].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `visiteurs_${filtreStatut.toLowerCase()}_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Ouvre une vue d'impression (imprimable ou « Enregistrer en PDF » sur le PC hôte).
  function imprimer() {
    const lignes = filtered.map(v => `
      <tr>
        <td>${htmlEsc(v.nom.toUpperCase())} ${htmlEsc(v.prenom)}</td>
        <td>${htmlEsc(v.numero_identite || '—')}<br><small>${htmlEsc(v.nationalite || '')}</small></td>
        <td>${htmlEsc(v.entreprise_visitee || '—')}</td>
        <td>${htmlEsc(formatDate(v.date_entree))}</td>
        <td>${htmlEsc(formatDate(v.date_sortie))}</td>
        <td>${v.statut === 'PRESENT' ? 'Présent' : 'Parti'}</td>
      </tr>`).join('');
    const w = window.open('', '_blank');
    if (!w) { alert('Veuillez autoriser les fenêtres pop-up pour imprimer.'); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Registre des visiteurs</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}
        h1{font-size:18px;margin:0 0 4px}
        .meta{font-size:12px;color:#555;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
        th{background:#0c44a0;color:#fff}
        small{color:#666}
        @media print{ button{display:none} }
      </style></head><body>
      <h1>Registre des visiteurs — ${htmlEsc(libelleFiltre)}</h1>
      <div class="meta">Édité le ${htmlEsc(new Date().toLocaleString('fr-FR'))} — ${filtered.length} visiteur(s)</div>
      <table><thead><tr>
        <th>Nom &amp; Prénom</th><th>N° Pièce / Nationalité</th><th>Motif / Entreprise</th>
        <th>Heure d'entrée</th><th>Heure de sortie</th><th>Statut</th>
      </tr></thead><tbody>${lignes}</tbody></table>
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>`);
    w.document.close();
  }

  return (
    <div style={{ width: '100%' }}>
      {/* En-tête */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}
        className="animate-fade-in"
      >
        <div>
          <h1 className="title-lg">👥 Registre des Visiteurs</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Suivi des entrées et sorties de visiteurs en temps réel
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={charger}
            id="btn-refresh-visiteurs"
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🔄 Actualiser
          </button>
          <button
            onClick={exporterCsv}
            id="btn-export-visiteurs"
            disabled={filtered.length === 0}
            title="Télécharger la liste filtrée au format CSV (Excel) sur ce PC"
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
              opacity: filtered.length === 0 ? 0.5 : 1, fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            📥 Exporter CSV
          </button>
          <button
            onClick={imprimer}
            id="btn-print-visiteurs"
            disabled={filtered.length === 0}
            title="Ouvrir la vue d'impression (imprimer ou enregistrer en PDF)"
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: 'var(--color-primary)', color: '#fff',
              cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
              opacity: filtered.length === 0 ? 0.5 : 1, fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🖨️ Imprimer / PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}
        className="animate-fade-in-up"
      >
        <StatCard value={nbPresents} label="Visiteurs présents" color="#22c55e" icon="🏢" />
        <StatCard value={nbPartis}   label="Sortis aujourd'hui" color="#6366f1" icon="🚪" />
        <StatCard value={nbTotal}    label="Total enregistrés" color="#0c44a0" icon="📋" />
      </div>

      {/* Barre filtres + recherche */}
      <div
        className="glass animate-fade-in-up delay-1"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Tabs filtres */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--color-bg)', borderRadius: 8, padding: 4 }}>
          {filtreOptions.map(opt => (
            <button
              key={opt.value}
              id={`filtre-${opt.value.toLowerCase()}`}
              onClick={() => setFiltreStatut(opt.value)}
              style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 600,
                background: filtreStatut === opt.value ? 'var(--color-primary)' : 'transparent',
                color: filtreStatut === opt.value ? '#fff' : 'var(--color-text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <input
          className="input"
          placeholder="Rechercher par nom, N° pièce, motif..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          id="search-visiteurs"
          style={{ flex: 1, minWidth: 240 }}
        />
      </div>

      {/* Tableau */}
      <div
        className="glass animate-fade-in-up delay-2"
        style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-primary)' }}>
              {['Nom & Prénom', 'N° Pièce / Nationalité', 'Motif / Entreprise', "Heure d'entrée", 'Heure de sortie', 'Statut', 'Action'].map(h => (
                <th key={h} style={{
                  padding: '0.875rem 1rem', textAlign: 'left',
                  fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)',
                  textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Chargement...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Aucun visiteur trouvé
                </td>
              </tr>
            ) : filtered.map((v, idx) => {
              const isPresent = v.statut === 'PRESENT';
              return (
                <tr
                  key={v.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--color-surface)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-light, #eef3ff)')}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--color-surface)')}
                >
                  {/* Nom */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {v.nom.toUpperCase()} {v.prenom}
                    </div>
                    {v.date_naissance && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        Né(e) le {v.date_naissance}
                      </div>
                    )}
                  </td>
                  {/* ID */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 500 }}>
                      {v.numero_identite || '—'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {v.nationalite || '—'}
                    </div>
                  </td>
                  {/* Motif */}
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.entreprise_visitee || '—'}
                  </td>
                  {/* Entrée */}
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {formatDate(v.date_entree)}
                  </td>
                  {/* Sortie */}
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {formatDate(v.date_sortie)}
                  </td>
                  {/* Statut */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 12px',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: isPresent ? '#dcfce7' : '#f1f5f9',
                        color: isPresent ? '#16a34a' : '#64748b',
                        border: `1px solid ${isPresent ? '#86efac' : '#cbd5e1'}`,
                      }}
                    >
                      {isPresent ? '● Présent' : '○ Parti'}
                    </span>
                  </td>
                  {/* Action sortie */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    {isPresent && (
                      <button
                        id={`btn-sortie-${v.id}`}
                        onClick={() => handleSortie(v)}
                        disabled={sortieEnCours === v.id}
                        style={{
                          padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                          fontSize: '0.78rem', fontWeight: 600, border: 'none',
                          background: sortieEnCours === v.id ? '#e2e8f0' : '#fee2e2',
                          color: sortieEnCours === v.id ? '#94a3b8' : '#dc2626',
                          transition: 'all 0.15s',
                        }}
                      >
                        {sortieEnCours === v.id ? '...' : '🚪 Sortie'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      {!loading && (
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          {filtered.length} visiteur(s) affiché(s) — Données en temps réel
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
