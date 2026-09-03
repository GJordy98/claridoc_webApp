'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  apiGetConfigFicheHotel,
  apiUpdateConfigFicheHotel,
  apiUploadLogoFicheHotel,
  apiDeleteLogoFicheHotel,
} from '@/lib/api';

interface ChampConfig {
  field: string;
  visible: boolean;
  obligatoire: boolean;
  ordre: number;
  libelle: string | null;
}

interface ConfigFicheHotel {
  id?: number;
  client_nom?: string;
  logo: string | null;
  logo_url: string | null;
  entete: string | null;
  pied_de_page: string | null;
  couleur_principale: string;
  champs: ChampConfig[];
}

export default function ConfigFicheHotelPage() {
  const [config, setConfig] = useState<ConfigFicheHotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);

  // Form states
  const [entete, setEntete] = useState('');
  const [piedDePage, setPiedDePage] = useState('');
  const [couleurPrincipale, setCouleurPrincipale] = useState('#1a3c5e');
  const [champs, setChamps] = useState<ChampConfig[]>([]);

  useEffect(() => {
    chargerConfig();
  }, []);

  async function chargerConfig() {
    setLoading(true);
    setMsgError(null);
    try {
      const data: ConfigFicheHotel = await apiGetConfigFicheHotel();
      setConfig(data);
      setEntete(data.entete || '');
      setPiedDePage(data.pied_de_page || '');
      setCouleurPrincipale(data.couleur_principale || '#1a3c5e');
      setChamps(data.champs || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement';
      setMsgError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTextesEtCharte(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsgSuccess(null);
    setMsgError(null);
    try {
      const updated: ConfigFicheHotel = await apiUpdateConfigFicheHotel({
        entete,
        pied_de_page: piedDePage,
        couleur_principale: couleurPrincipale,
        champs,
      });
      setConfig(updated);
      setMsgSuccess('Configuration enregistrée avec succès !');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de sauvegarde';
      setMsgError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setMsgError(null);
    setMsgSuccess(null);
    try {
      const updated: ConfigFicheHotel = await apiUploadLogoFicheHotel(file);
      setConfig(updated);
      setMsgSuccess('Logo téléversé avec succès !');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du téléversement du logo";
      setMsgError(message);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleDeleteLogo() {
    if (!confirm('Voulez-vous vraiment supprimer le logo de l’hôtel ?')) return;

    setUploadingLogo(true);
    setMsgError(null);
    setMsgSuccess(null);
    try {
      const updated: ConfigFicheHotel = await apiDeleteLogoFicheHotel();
      setConfig(updated);
      setMsgSuccess('Logo supprimé.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression du logo';
      setMsgError(message);
    } finally {
      setUploadingLogo(false);
    }
  }

  function toggleChampVisible(index: number) {
    const copie = [...champs];
    copie[index].visible = !copie[index].visible;
    setChamps(copie);
  }

  function toggleChampObligatoire(index: number) {
    const copie = [...champs];
    copie[index].obligatoire = !copie[index].obligatoire;
    setChamps(copie);
  }

  function updateChampLibelle(index: number, libelle: string) {
    const copie = [...champs];
    copie[index].libelle = libelle;
    setChamps(copie);
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Chargement de la configuration de votre hôtel...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Navigation retour */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link
          href="/dashboard/fiches-hotel"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-primary, #2563eb)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          ← Retour au Registre Hôtel
        </Link>
      </div>

      {/* Titre principal */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
          ⚙️ Personnalisation de la Fiche Hôtel
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Personnalisez la charte graphique de la fiche imprimée (logo, couleurs, en-tête/pied) et adaptez les champs affichés pour la réception.
        </p>
      </div>

      {/* Messages Alerte */}
      {msgSuccess && (
        <div
          style={{
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            padding: '1rem 1.25rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            fontWeight: 500,
          }}
        >
          ✅ {msgSuccess}
        </div>
      )}

      {msgError && (
        <div
          style={{
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            padding: '1rem 1.25rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            fontWeight: 500,
          }}
        >
          ❌ {msgError}
        </div>
      )}

      <form onSubmit={handleSaveTextesEtCharte}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* BANDEAU GAUCHE : Logo & Charte Visuelle */}
          <div
            style={{
              background: 'var(--color-bg-card, #fff)',
              border: '1px solid var(--color-border, #e2e8f0)',
              borderRadius: '1rem',
              padding: '1.75rem',
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🖼️ Logo & Charte Graphique
            </h2>

            {/* Logo actuels / Upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Logo de l'Établissement
              </label>

              {config?.logo_url ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <img
                    src={config.logo_url}
                    alt="Logo Hôtel"
                    style={{ maxHeight: '70px', maxWidth: '160px', objectFit: 'contain' }}
                  />
                  <div>
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      disabled={uploadingLogo}
                      style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Supprimer le logo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                  }}
                >
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Formats acceptés : PNG, JPG, WEBP.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    id="logo-upload-input"
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="logo-upload-input"
                    style={{
                      display: 'inline-block',
                      background: 'var(--color-primary, #2563eb)',
                      color: '#fff',
                      padding: '0.55rem 1.2rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}
                  >
                    {uploadingLogo ? 'Téléversement...' : 'Téléverser un logo'}
                  </label>
                </div>
              )}
            </div>

            {/* Couleur principale */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Couleur Principale des Bandeaux (PDF)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="color"
                  value={couleurPrincipale}
                  onChange={(e) => setCouleurPrincipale(e.target.value)}
                  style={{
                    width: '45px',
                    height: '45px',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                  }}
                />
                <input
                  type="text"
                  value={couleurPrincipale}
                  onChange={(e) => setCouleurPrincipale(e.target.value)}
                  style={{
                    padding: '0.6rem 0.8rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    width: '120px',
                  }}
                />
              </div>
            </div>

            {/* En-tête imprimé */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                En-tête de Fiche (Nom hôtel, Adresse, Téléphone...)
              </label>
              <textarea
                rows={3}
                value={entete}
                onChange={(e) => setEntete(e.target.value)}
                placeholder="Ex: HÔTEL LE PALACE - 12 Avenue des Fleurs, Douala. Tél: +237 600000000"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Pied de page */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Pied de Page (Mentions Légales, Site Web...)
              </label>
              <textarea
                rows={3}
                value={piedDePage}
                onChange={(e) => setPiedDePage(e.target.value)}
                placeholder="Ex: Merci de votre visite. Conformément à la loi, ces données sont conservées pour le registre de police."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* BANDEAU DROIT : Prévisualisation visuelle */}
          <div
            style={{
              background: 'var(--color-bg-card, #fff)',
              border: '1px solid var(--color-border, #e2e8f0)',
              borderRadius: '1rem',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📄 Aperçu du Modèle d'Impression
            </h2>

            <div
              style={{
                flex: 1,
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                background: '#fafafa',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Entête aperçu */}
              <div>
                <div
                  style={{
                    background: couleurPrincipale,
                    color: '#fff',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                    FICHE INDIVIDUELLE D'ENTRÉE
                  </div>
                  {config?.logo_url && (
                    <img
                      src={config.logo_url}
                      alt="Logo"
                      style={{ maxHeight: '35px', filter: 'brightness(0) invert(1)' }}
                    />
                  )}
                </div>

                {entete && (
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1.25rem', whiteSpace: 'pre-line', fontStyle: 'italic' }}>
                    {entete}
                  </div>
                )}

                {/* Simulation de champs */}
                <div style={{ fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.25rem' }}>
                    <strong>SOCLE LÉGAL :</strong> Nom, Prénom, Date de naissance, Nationalité, Domicile, Date d'arrivée
                  </div>
                  <div style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.25rem' }}>
                    <strong>CHAMPS PERSONNALISÉS :</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                      {champs
                        .filter((c) => c.visible)
                        .map((c) => (
                          <span
                            key={c.field}
                            style={{
                              background: '#e2e8f0',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                            }}
                          >
                            {c.libelle || c.field} {c.obligatoire ? '*' : ''}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pied aperçu */}
              {piedDePage && (
                <div
                  style={{
                    marginTop: '1.5rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #cbd5e1',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textAlign: 'center',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {piedDePage}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BANDEAU BAS : Réglage fin des Champs */}
        <div
          style={{
            background: 'var(--color-bg-card, #fff)',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: '1rem',
            padding: '1.75rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📋 Configuration des Champs d'Établissement
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Sélectionnez les champs affichés pour la saisie à la réception, rendez-les obligatoires ou modifiez leurs libellés sur l'imprimé.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Champ d'Établissement</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Visible</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Obligatoire</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Libellé Personnalisé</th>
                </tr>
              </thead>
              <tbody>
                {champs.map((item, idx) => (
                  <tr key={item.field} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                      {item.field}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={item.visible}
                        onChange={() => toggleChampVisible(idx)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={item.obligatoire}
                        onChange={() => toggleChampObligatoire(idx)}
                        disabled={!item.visible}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <input
                        type="text"
                        value={item.libelle || ''}
                        onChange={(e) => updateChampLibelle(idx, e.target.value)}
                        placeholder={item.field}
                        disabled={!item.visible}
                        style={{
                          width: '100%',
                          maxWidth: '300px',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                          background: item.visible ? '#fff' : '#f1f5f9',
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bouton d'enregistrement global */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: 'var(--color-primary, #2563eb)',
              color: '#fff',
              border: 'none',
              padding: '0.85rem 2rem',
              borderRadius: '0.6rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
            }}
          >
            {saving ? 'Enregistrement en cours...' : '💾 Enregistrer la configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
