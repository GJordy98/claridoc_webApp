'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiGetFichesHotel, apiCreerFicheHotel, apiMajFicheHotel, apiSupprimerFicheHotel, apiFicheHotelDepart } from '@/lib/api';

type TypeDocument = 'CNI' | 'PASSEPORT' | 'AUTRE';
type StatutFiche  = 'EN_COURS' | 'TERMINE';
type FiltreStatut = StatutFiche | 'TOUS';

interface Accompagnant {
  id?: number; nom: string; prenom?: string; date_naissance?: string;
  lieu_naissance?: string; nationalite?: string;
}

interface CoOccupant {
  id?: number; nom: string; prenom?: string; date_naissance?: string;
  lieu_naissance?: string; nationalite?: string; numero_identite?: string;
  type_document?: string;
}

interface FicheHotel {
  id: number; reference: string; annee: number; numero_fiche: number;
  nom: string; prenom: string; date_naissance: string | null;
  lieu_naissance: string | null; nationalite: string | null; domicile: string | null;
  telephone: string | null; email: string | null; date_arrivee: string;
  date_depart_prevue: string | null; chambre: string | null; sexe: string | null;
  profession: string | null; numero_identite: string | null; date_expiration: string | null;
  nombre_personnes: number; motif_sejour: string | null; provenance: string | null;
  destination: string | null; type_document: TypeDocument | null;
  type_document_libelle: string | null; statut: StatutFiche;
  date_depart_reelle: string | null; signee: boolean; accompagnants: Accompagnant[];
  co_occupants?: CoOccupant[];
}

const BADGE_DOC: Record<TypeDocument, {label:string;icone:string;fond:string;texte:string;bordure:string}> = {
  PASSEPORT:{ label:'Passeport', icone:'🛂', fond:'#dbeafe', texte:'#1d4ed8', bordure:'#93c5fd' },
  CNI:      { label:'CNI',       icone:'🪪', fond:'#f1f5f9', texte:'#475569', bordure:'#cbd5e1' },
  AUTRE:    { label:'Autre',     icone:'📄', fond:'#fef3c7', texte:'#a16207', bordure:'#fcd34d' },
};

const CHAMP_VIDE = {
  nom:'', prenom:'', date_naissance:'', lieu_naissance:'', nationalite:'',
  domicile:'', telephone:'', email:'', date_depart_prevue:'', chambre:'',
  sexe:'', profession:'', numero_identite:'', date_expiration:'',
  nombre_personnes:1, motif_sejour:'', provenance:'', destination:'', type_document:'' as string,
};

function fmtDate(d: string | null, heure=false): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',...(heure?{hour:'2-digit',minute:'2-digit'}:{})});
}
function csvCell(v: unknown): string { return `"${String(v ?? '').replace(/"/g,'""')}"`; }
function htmlEsc(v: unknown): string {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function BadgeDoc({ type }: { type: TypeDocument | null }) {
  if (!type) return <span style={{color:'var(--color-text-muted)',fontSize:'0.78rem'}}>—</span>;
  const p = BADGE_DOC[type] ?? BADGE_DOC.AUTRE;
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 10px',borderRadius:20,fontSize:'0.72rem',fontWeight:700,whiteSpace:'nowrap',background:p.fond,color:p.texte,border:`1px solid ${p.bordure}`}}><span aria-hidden>{p.icone}</span>{p.label}</span>;
}

function StatCard({value,label,color,icon}:{value:number;label:string;color:string;icon:string}) {
  return (
    <div style={{background:'var(--color-bg-card)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-xl)',padding:'1.25rem 1.5rem',display:'flex',alignItems:'center',gap:'1rem',flex:'1 1 190px'}}>
      <div style={{width:48,height:48,borderRadius:12,background:color+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem'}}>{icon}</div>
      <div>
        <div style={{fontSize:'1.75rem',fontWeight:700,color,lineHeight:1}}>{value}</div>
        <div style={{fontSize:'0.78rem',color:'var(--color-text-muted)',marginTop:4}}>{label}</div>
      </div>
    </div>
  );
}

function SectionTitle({txt,icone}:{txt:string;icone:string}) {
  return <div style={{display:'flex',alignItems:'center',gap:8,padding:'0.55rem 0.875rem',borderRadius:8,background:'var(--color-primary)',color:'#fff',fontSize:'0.78rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}><span>{icone}</span> {txt}</div>;
}

function ModalFiche({ficheToEdit, onClose, onSaved}:{ficheToEdit?: FicheHotel | null; onClose:()=>void; onSaved:()=>void}) {
  const isEdit = Boolean(ficheToEdit);
  const [form, setForm] = useState({
    nom: ficheToEdit?.nom || '',
    prenom: ficheToEdit?.prenom || '',
    date_naissance: ficheToEdit?.date_naissance || '',
    lieu_naissance: ficheToEdit?.lieu_naissance || '',
    nationalite: ficheToEdit?.nationalite || '',
    domicile: ficheToEdit?.domicile || '',
    telephone: ficheToEdit?.telephone || '',
    email: ficheToEdit?.email || '',
    date_depart_prevue: ficheToEdit?.date_depart_prevue || '',
    chambre: ficheToEdit?.chambre || '',
    sexe: ficheToEdit?.sexe || '',
    profession: ficheToEdit?.profession || '',
    numero_identite: ficheToEdit?.numero_identite || '',
    date_expiration: ficheToEdit?.date_expiration || '',
    nombre_personnes: ficheToEdit?.nombre_personnes || 1,
    motif_sejour: ficheToEdit?.motif_sejour || '',
    provenance: ficheToEdit?.provenance || '',
    destination: ficheToEdit?.destination || '',
    type_document: (ficheToEdit?.type_document || '') as string,
  });
  const [accompagnants, setAccompagnants] = useState<Accompagnant[]>(
    ficheToEdit?.accompagnants ? ficheToEdit.accompagnants.map(a => ({...a})) : []
  );
  const [coOccupants, setCoOccupants] = useState<CoOccupant[]>(
    ficheToEdit?.co_occupants ? ficheToEdit.co_occupants.map(c => ({...c})) : []
  );
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  function setF(k:keyof typeof CHAMP_VIDE, v:string|number){ setForm(p=>({...p,[k]:v})); }
  function ajouterAccompagnant(){ setAccompagnants(p=>[...p,{nom:'',prenom:'',date_naissance:'',lieu_naissance:'',nationalite:''}]); }
  function supprimerAccompagnant(i:number){ setAccompagnants(p=>p.filter((_,idx)=>idx!==i)); }
  function setAccomp(i:number,k:keyof Accompagnant,v:string){ setAccompagnants(p=>p.map((a,idx)=>idx===i?{...a,[k]:v}:a)); }

  function ajouterCoOccupant(){ setCoOccupants(p=>[...p,{nom:'',prenom:'',date_naissance:'',lieu_naissance:'',nationalite:'',numero_identite:'',type_document:''}]); }
  function supprimerCoOccupant(i:number){ setCoOccupants(p=>p.filter((_,idx)=>idx!==i)); }
  function setCoOccupantField(i:number,k:keyof CoOccupant,v:string){ setCoOccupants(p=>p.map((c,idx)=>idx===i?{...c,[k]:v}:c)); }

  async function handleSubmit(e:React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim()||!form.prenom.trim()){setErreur('Nom et prénom obligatoires.');return;}
    setLoading(true);setErreur('');
    try {
      const payload:Record<string,unknown>={...form,accompagnants,co_occupants:coOccupants};
      for(const k of Object.keys(payload)){if(payload[k]==='')payload[k]=null;}
      payload.nombre_personnes=Number(form.nombre_personnes)||1;
      if (isEdit && ficheToEdit) {
        await apiMajFicheHotel(ficheToEdit.id, payload);
      } else {
        await apiCreerFicheHotel(payload);
      }
      onSaved();
    } catch(err:unknown){setErreur(err instanceof Error?err.message:'Erreur inconnue');}
    finally{setLoading(false);}
  }

  const inp:React.CSSProperties={width:'100%',padding:'0.5rem 0.75rem',background:'var(--color-bg-card)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)',fontSize:'0.875rem',color:'var(--color-text-primary)',outline:'none',fontFamily:'var(--font-sans)'};
  const lbl:React.CSSProperties={display:'block',marginBottom:4,fontSize:'0.72rem',fontWeight:600,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.04em'};
  const fb:React.CSSProperties={display:'flex',flexDirection:'column',gap:4};
  const r2:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'};
  const r3:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'};

  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.48)',backdropFilter:'blur(4px)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'2rem 1rem',overflowY:'auto'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'var(--color-bg-card)',borderRadius:14,width:'100%',maxWidth:760,boxShadow:'var(--shadow-lg)',border:'1px solid var(--color-border)',overflow:'hidden'}}>
        <div style={{padding:'1.25rem 1.5rem',background:'linear-gradient(135deg,var(--color-accent),var(--color-primary))',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:'1.05rem',fontWeight:700,color:'#fff'}}>{isEdit ? `✏️ Modifier la Fiche ${ficheToEdit?.reference}` : `🏨 Nouvelle Fiche d'Entrée Hôtel`}</div>
            <div style={{fontSize:'0.76rem',color:'rgba(255,255,255,0.75)',marginTop:2}}>{isEdit ? 'Modifiez les informations du voyageur ou du séjour' : "Saisie manuelle — sur le poste, l'OCR pré-remplit automatiquement"}</div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:34,height:34,borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem'}}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1.1rem'}}>
          <SectionTitle txt="Identité du voyageur principal" icone="👤" />
          <div style={r2}>
            <div style={fb}><label style={lbl}>Nom *</label><input style={inp} required value={form.nom} onChange={e=>setF('nom',e.target.value.toUpperCase())} placeholder="NOM DE FAMILLE" id="fh-nom" /></div>
            <div style={fb}><label style={lbl}>Prénom(s) *</label><input style={inp} required value={form.prenom} onChange={e=>setF('prenom',e.target.value)} placeholder="Prénom" id="fh-prenom" /></div>
          </div>
          <div style={r3}>
            <div style={fb}><label style={lbl}>Date de naissance</label><input style={inp} type="date" value={form.date_naissance} onChange={e=>setF('date_naissance',e.target.value)} id="fh-ddn" /></div>
            <div style={fb}><label style={lbl}>Lieu de naissance</label><input style={inp} value={form.lieu_naissance} onChange={e=>setF('lieu_naissance',e.target.value)} placeholder="Ville, Pays" id="fh-lieu-naissance" /></div>
            <div style={fb}><label style={lbl}>Nationalité</label><input style={inp} value={form.nationalite} onChange={e=>setF('nationalite',e.target.value)} placeholder="Ex : CMR, FRA" id="fh-nationalite" /></div>
          </div>
          <div style={r2}>
            <div style={fb}><label style={lbl}>Sexe</label><select style={inp} value={form.sexe} onChange={e=>setF('sexe',e.target.value)} id="fh-sexe"><option value="">— Non renseigné —</option><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
            <div style={fb}><label style={lbl}>Profession</label><input style={inp} value={form.profession} onChange={e=>setF('profession',e.target.value)} placeholder="Ex : Ingénieur..." id="fh-profession" /></div>
          </div>
          <div style={fb}><label style={lbl}>Domicile habituel</label><input style={inp} value={form.domicile} onChange={e=>setF('domicile',e.target.value)} placeholder="Adresse complète de résidence" id="fh-domicile" /></div>
          <div style={r2}>
            <div style={fb}><label style={lbl}>Téléphone</label><input style={inp} type="tel" value={form.telephone} onChange={e=>setF('telephone',e.target.value)} placeholder="+237 6XX XXX XXX" id="fh-telephone" /></div>
            <div style={fb}><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={e=>setF('email',e.target.value)} placeholder="adresse@exemple.com" id="fh-email" /></div>
          </div>
          <SectionTitle txt="Pièce d'identité présentée" icone="🪪" />
          <div style={r3}>
            <div style={fb}><label style={lbl}>Type de pièce</label><select style={inp} value={form.type_document} onChange={e=>setF('type_document',e.target.value)} id="fh-type-doc"><option value="">— Choisir —</option><option value="CNI">Carte Nationale d&apos;Identité</option><option value="PASSEPORT">Passeport</option><option value="AUTRE">Autre</option></select></div>
            <div style={fb}><label style={lbl}>Numéro d&apos;identité</label><input style={{...inp,fontFamily:'monospace'}} value={form.numero_identite} onChange={e=>setF('numero_identite',e.target.value.toUpperCase())} placeholder="N° de la pièce" id="fh-num-identite" /></div>
            <div style={fb}><label style={lbl}>Date d&apos;expiration</label><input style={inp} type="date" value={form.date_expiration} onChange={e=>setF('date_expiration',e.target.value)} id="fh-date-expiration" /></div>
          </div>
          <SectionTitle txt="Informations du séjour" icone="🛏️" />
          <div style={r3}>
            <div style={fb}><label style={lbl}>N° de chambre</label><input style={inp} value={form.chambre} onChange={e=>setF('chambre',e.target.value)} placeholder="Ex : 204, Suite A" id="fh-chambre" /></div>
            <div style={fb}><label style={lbl}>Date de départ prévue</label><input style={inp} type="date" value={form.date_depart_prevue} onChange={e=>setF('date_depart_prevue',e.target.value)} id="fh-date-depart" /></div>
            <div style={fb}><label style={lbl}>Nb de personnes</label><input style={inp} type="number" min={1} max={20} value={form.nombre_personnes} onChange={e=>setF('nombre_personnes',Number(e.target.value))} id="fh-nb-personnes" /></div>
          </div>
          <div style={r3}>
            <div style={fb}><label style={lbl}>Motif du séjour</label><input style={inp} value={form.motif_sejour} onChange={e=>setF('motif_sejour',e.target.value)} placeholder="Ex : Tourisme, Affaires..." id="fh-motif" /></div>
            <div style={fb}><label style={lbl}>Provenance</label><input style={inp} value={form.provenance} onChange={e=>setF('provenance',e.target.value)} placeholder="Ville / Pays d'origine" id="fh-provenance" /></div>
            <div style={fb}><label style={lbl}>Destination suivante</label><input style={inp} value={form.destination} onChange={e=>setF('destination',e.target.value)} placeholder="Ville / Pays suivant" id="fh-destination" /></div>
          </div>
          <SectionTitle txt="Co-occupants adultes (≥ 15 ans)" icone="🪪" />
          {coOccupants.map((c,i)=>(
            <div key={i} style={{padding:'0.875rem',borderRadius:8,border:'1px solid var(--color-border)',background:'var(--color-bg-deep)',display:'flex',flexDirection:'column',gap:'0.6rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'0.8rem',fontWeight:600,color:'var(--color-primary)'}}>Co-occupant adulte #{i+1}</span>
                <button type="button" onClick={()=>supprimerCoOccupant(i)} style={{background:'#fee2e2',border:'none',color:'#dc2626',padding:'3px 10px',borderRadius:6,cursor:'pointer',fontSize:'0.75rem',fontWeight:600}}>Supprimer</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.6rem'}}>
                <div style={fb}><label style={lbl}>Nom *</label><input style={inp} value={c.nom} onChange={e=>setCoOccupantField(i,'nom',e.target.value.toUpperCase())} placeholder="NOM" /></div>
                <div style={fb}><label style={lbl}>Prénom</label><input style={inp} value={c.prenom??''} onChange={e=>setCoOccupantField(i,'prenom',e.target.value)} placeholder="Prénom" /></div>
                <div style={fb}><label style={lbl}>Date de naissance</label><input style={inp} type="date" value={c.date_naissance??''} onChange={e=>setCoOccupantField(i,'date_naissance',e.target.value)} /></div>
                <div style={fb}><label style={lbl}>Lieu de naissance</label><input style={inp} value={c.lieu_naissance??''} onChange={e=>setCoOccupantField(i,'lieu_naissance',e.target.value)} placeholder="Ville, Pays" /></div>
                <div style={fb}><label style={lbl}>Nationalité</label><input style={inp} value={c.nationalite??''} onChange={e=>setCoOccupantField(i,'nationalite',e.target.value)} placeholder="Ex : CMR" /></div>
                <div style={fb}><label style={lbl}>N° Pièce d'identité</label><input style={{...inp,fontFamily:'monospace'}} value={c.numero_identite??''} onChange={e=>setCoOccupantField(i,'numero_identite',e.target.value.toUpperCase())} placeholder="N° Pièce CNI/Passeport" /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={ajouterCoOccupant} style={{background:'transparent',border:'1px dashed var(--color-border)',borderRadius:8,padding:'0.6rem',cursor:'pointer',fontSize:'0.82rem',color:'var(--color-primary)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>＋ Ajouter un co-occupant adulte (≥ 15 ans)</button>

          <SectionTitle txt="Enfants de moins de 15 ans" icone="👶" />
          {accompagnants.map((a,i)=>(
            <div key={i} style={{padding:'0.875rem',borderRadius:8,border:'1px solid var(--color-border)',background:'var(--color-bg-deep)',display:'flex',flexDirection:'column',gap:'0.6rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'0.8rem',fontWeight:600,color:'var(--color-primary)'}}>Accompagnant #{i+1}</span>
                <button type="button" onClick={()=>supprimerAccompagnant(i)} style={{background:'#fee2e2',border:'none',color:'#dc2626',padding:'3px 10px',borderRadius:6,cursor:'pointer',fontSize:'0.75rem',fontWeight:600}}>Supprimer</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.6rem'}}>
                <div style={fb}><label style={lbl}>Nom *</label><input style={inp} value={a.nom} onChange={e=>setAccomp(i,'nom',e.target.value.toUpperCase())} placeholder="NOM" /></div>
                <div style={fb}><label style={lbl}>Prénom</label><input style={inp} value={a.prenom??''} onChange={e=>setAccomp(i,'prenom',e.target.value)} placeholder="Prénom" /></div>
                <div style={fb}><label style={lbl}>Date de naissance</label><input style={inp} type="date" value={a.date_naissance??''} onChange={e=>setAccomp(i,'date_naissance',e.target.value)} /></div>
                <div style={fb}><label style={lbl}>Lieu de naissance</label><input style={inp} value={a.lieu_naissance??''} onChange={e=>setAccomp(i,'lieu_naissance',e.target.value)} placeholder="Ville, Pays" /></div>
                <div style={fb}><label style={lbl}>Nationalité</label><input style={inp} value={a.nationalite??''} onChange={e=>setAccomp(i,'nationalite',e.target.value)} placeholder="Ex : CMR" /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={ajouterAccompagnant} style={{background:'transparent',border:'1px dashed var(--color-border)',borderRadius:8,padding:'0.6rem',cursor:'pointer',fontSize:'0.82rem',color:'var(--color-text-muted)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>＋ Ajouter un enfant accompagnant (&lt; 15 ans)</button>
          {erreur&&<div style={{padding:'0.75rem 1rem',borderRadius:8,background:'#fee2e2',color:'#dc2626',fontSize:'0.85rem',border:'1px solid #fca5a5'}}>⚠️ {erreur}</div>}
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',borderTop:'1px solid var(--color-border)',paddingTop:'1rem'}}>
            <button type="button" onClick={onClose} style={{padding:'0.6rem 1.5rem',borderRadius:8,border:'1px solid var(--color-border)',background:'transparent',cursor:'pointer',fontSize:'0.875rem',color:'var(--color-text-secondary)'}}>Annuler</button>
            <button type="submit" id="btn-sauvegarder-fiche" disabled={loading} style={{padding:'0.6rem 1.75rem',borderRadius:8,border:'none',background:loading?'#93c5fd':'var(--color-primary)',color:'#fff',cursor:loading?'not-allowed':'pointer',fontSize:'0.875rem',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
              {loading ? '⏳ Enregistrement...' : isEdit ? '💾 Enregistrer les modifications' : '✅ Enregistrer la fiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailPanel({f,onClose,onDepart,onEdit,onDelete}:{
  f:FicheHotel;
  onClose:()=>void;
  onDepart:(fiche:FicheHotel)=>void;
  onEdit:(fiche:FicheHotel)=>void;
  onDelete:(fiche:FicheHotel)=>void;
}) {
  function Ligne({label,val}:{label:string;val:string|number|null|undefined}) {
    if(!val&&val!==0)return null;
    return <div style={{display:'flex',gap:10,fontSize:'0.83rem',padding:'0.3rem 0',borderBottom:'1px solid var(--color-border)'}}><span style={{color:'var(--color-text-muted)',minWidth:148,fontWeight:600,fontSize:'0.72rem',textTransform:'uppercase'}}>{label}</span><span style={{color:'var(--color-text-primary)'}}>{String(val)}</span></div>;
  }
  return (
    <div style={{position:'fixed',inset:0,zIndex:900,background:'rgba(0,0,0,0.35)',backdropFilter:'blur(4px)',display:'flex',justifyContent:'flex-end'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:'100%',maxWidth:480,background:'var(--color-bg-card)',height:'100%',overflowY:'auto',padding:'1.5rem',boxShadow:'-8px 0 40px rgba(0,0,0,0.16)',display:'flex',flexDirection:'column',gap:'1rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontFamily:'monospace',fontWeight:700,fontSize:'1.15rem',color:'var(--color-primary)'}}>🏨 Fiche {f.reference}</div>
            <div style={{fontSize:'1rem',fontWeight:700,marginTop:4}}>{f.nom.toUpperCase()} {f.prenom}</div>
          </div>
          <button onClick={onClose} style={{background:'var(--color-bg-deep)',border:'1px solid var(--color-border)',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:'0.85rem'}}>✕ Fermer</button>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <span style={{padding:'4px 14px',borderRadius:20,fontWeight:700,fontSize:'0.78rem',background:f.statut==='EN_COURS'?'#dcfce7':'#f1f5f9',color:f.statut==='EN_COURS'?'#16a34a':'#64748b',border:`1px solid ${f.statut==='EN_COURS'?'#86efac':'#cbd5e1'}`}}>{f.statut==='EN_COURS'?'● Séjour en cours':'○ Séjour terminé'}</span>
          {f.chambre&&<span style={{padding:'4px 14px',borderRadius:20,fontWeight:700,fontSize:'0.78rem',background:'#ede9fe',color:'#7c3aed',border:'1px solid #c4b5fd'}}>🛏️ Chambre {f.chambre}</span>}
          <BadgeDoc type={f.type_document} />
        </div>
        <div style={{background:'var(--color-bg-deep)',borderRadius:10,padding:'1rem',display:'flex',flexDirection:'column'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--color-primary)',textTransform:'uppercase',marginBottom:'0.5rem'}}>👤 Identité voyageur principal</div>
          <Ligne label="Date de naissance" val={fmtDate(f.date_naissance)} />
          <Ligne label="Lieu de naissance" val={f.lieu_naissance} />
          <Ligne label="Nationalité" val={f.nationalite} />
          <Ligne label="Domicile" val={f.domicile} />
          <Ligne label="Téléphone" val={f.telephone} />
          <Ligne label="Email" val={f.email} />
          <Ligne label="N° pièce" val={f.numero_identite} />
          <Ligne label="Expiration pièce" val={fmtDate(f.date_expiration)} />
        </div>
        <div style={{background:'var(--color-bg-deep)',borderRadius:10,padding:'1rem',display:'flex',flexDirection:'column'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--color-primary)',textTransform:'uppercase',marginBottom:'0.5rem'}}>🛏️ Séjour</div>
          <Ligne label="Arrivée" val={fmtDate(f.date_arrivee,true)} />
          <Ligne label="Départ prévu" val={fmtDate(f.date_depart_prevue)} />
          <Ligne label="Départ réel" val={fmtDate(f.date_depart_reelle,true)} />
          <Ligne label="Nb de personnes" val={f.nombre_personnes} />
          <Ligne label="Motif du séjour" val={f.motif_sejour} />
          <Ligne label="Provenance" val={f.provenance} />
          <Ligne label="Destination" val={f.destination} />
        </div>
        {f.co_occupants && f.co_occupants.length>0&&(
          <div style={{background:'var(--color-bg-deep)',borderRadius:10,padding:'1rem'}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--color-primary)',textTransform:'uppercase',marginBottom:'0.5rem'}}>🪪 Co-occupants adultes ({f.co_occupants.length})</div>
            {f.co_occupants.map((c,i)=>(
              <div key={i} style={{padding:'0.4rem 0',borderBottom:'1px solid var(--color-border)',fontSize:'0.83rem'}}>
                <strong>{c.nom.toUpperCase()} {c.prenom}</strong>
                {c.numero_identite&&<span style={{color:'var(--color-text-primary)',marginLeft:8,fontFamily:'monospace',fontSize:'0.78rem'}}>— Pièce N° {c.numero_identite}</span>}
                {c.date_naissance&&<div style={{color:'var(--color-text-muted)',fontSize:'0.75rem',marginTop:2}}>né(e) le {fmtDate(c.date_naissance)} {c.nationalite?`· ${c.nationalite}`:''}</div>}
              </div>
            ))}
          </div>
        )}
        {f.accompagnants.length>0&&(
          <div style={{background:'var(--color-bg-deep)',borderRadius:10,padding:'1rem'}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--color-primary)',textTransform:'uppercase',marginBottom:'0.5rem'}}>👶 Enfants accompagnants ({f.accompagnants.length})</div>
            {f.accompagnants.map((a,i)=>(
              <div key={i} style={{padding:'0.4rem 0',borderBottom:'1px solid var(--color-border)',fontSize:'0.83rem'}}>
                <strong>{a.nom.toUpperCase()} {a.prenom}</strong>
                {a.date_naissance&&<span style={{color:'var(--color-text-muted)',marginLeft:8}}>né(e) le {fmtDate(a.date_naissance)}</span>}
              </div>
            ))}
          </div>
        )}
        <div style={{display:'flex',gap:8,marginTop:'auto',paddingTop:'1rem',borderTop:'1px solid var(--color-border)',flexWrap:'wrap'}}>
          <button onClick={()=>{onClose();onEdit(f);}} style={{padding:'0.65rem 1rem',borderRadius:8,border:'1px solid var(--color-border)',background:'var(--color-bg-card)',cursor:'pointer',fontWeight:600,fontSize:'0.85rem',display:'flex',alignItems:'center',gap:6}}>
            ✏️ Modifier
          </button>
          {f.statut==='EN_COURS'&&(
            <button id={`btn-depart-detail-${f.id}`} onClick={()=>{onClose();onDepart(f);}} style={{padding:'0.65rem 1rem',borderRadius:8,border:'none',background:'#fee2e2',color:'#dc2626',cursor:'pointer',fontWeight:700,fontSize:'0.85rem',display:'flex',alignItems:'center',gap:6}}>
              🚪 Enregistrer le départ
            </button>
          )}
          <button onClick={()=>{if(confirm(`Supprimer définitivement la fiche ${f.reference} ?`)){onClose();onDelete(f);}}} style={{padding:'0.65rem 1rem',borderRadius:8,border:'none',background:'#fee2e2',color:'#dc2626',cursor:'pointer',fontWeight:600,fontSize:'0.85rem',display:'flex',alignItems:'center',gap:6,marginLeft:'auto'}}>
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FichesHotelPage() {
  const [fiches,setFiches] = useState<FicheHotel[]>([]);
  const [filtreStatut,setFiltreStatut] = useState<FiltreStatut>('EN_COURS');
  const [search,setSearch] = useState('');
  const [loading,setLoading] = useState(true);
  const [departEnCours,setDepartEnCours] = useState<number|null>(null);
  const [showModal,setShowModal] = useState(false);
  const [ficheToEdit,setFicheToEdit] = useState<FicheHotel|null>(null);
  const [ficheDetaillee,setFicheDetaillee] = useState<FicheHotel|null>(null);

  const charger = useCallback(async()=>{
    setLoading(true);
    try{
      const statut=filtreStatut==='TOUS'?undefined:filtreStatut;
      const data=await apiGetFichesHotel(statut?{statut}:undefined);
      setFiches(data?.results??data??[]);
    }catch{/*silent*/}finally{setLoading(false);}
  },[filtreStatut]);

  useEffect(()=>{charger();},[charger]);

  async function handleDepart(f:FicheHotel){
    const ch=f.chambre?`Chambre ${f.chambre}`:'chambre N/A';
    if(!confirm(`Confirmer le départ de ${f.prenom} ${f.nom} (${ch}) ?`))return;
    setDepartEnCours(f.id);
    try{await apiFicheHotelDepart(f.id);await charger();}
    catch(err){alert('Erreur : '+(err instanceof Error?err.message:'Inconnu'));}
    finally{setDepartEnCours(null);}
  }

  async function handleSupprimer(f:FicheHotel){
    try{await apiSupprimerFicheHotel(f.id);await charger();}
    catch(err){alert('Erreur lors de la suppression : '+(err instanceof Error?err.message:'Inconnu'));}
  }

  const filtered=fiches.filter(f=>{
    const q=search.toLowerCase();
    return f.nom.toLowerCase().includes(q)||f.prenom.toLowerCase().includes(q)||
      (f.chambre??'').toLowerCase().includes(q)||(f.numero_identite??'').toLowerCase().includes(q)||
      (f.nationalite??'').toLowerCase().includes(q)||(f.motif_sejour??'').toLowerCase().includes(q)||
      f.reference.toLowerCase().includes(q);
  });

  const nbEnCours=fiches.filter(f=>f.statut==='EN_COURS').length;
  const nbTermines=fiches.filter(f=>f.statut==='TERMINE').length;
  const nbPasseports=fiches.filter(f=>f.type_document==='PASSEPORT').length;
  const nbTotal=fiches.length;

  function exporterCsv(){
    const entetes=['Référence','Nom','Prénom','Naissance','Type pièce','N° pièce','Nationalité','Chambre','Arrivée','Départ prévu','Motif','Provenance','Destination','Nb personnes','Statut'];
    const lignes=filtered.map(f=>[f.reference,f.nom,f.prenom,f.date_naissance??'',f.type_document_libelle??f.type_document??'',f.numero_identite??'',f.nationalite??'',f.chambre??'',fmtDate(f.date_arrivee,true),fmtDate(f.date_depart_prevue),f.motif_sejour??'',f.provenance??'',f.destination??'',String(f.nombre_personnes),f.statut==='EN_COURS'?'Séjour en cours':'Séjour terminé'].map(csvCell).join(';'));
    const csv='\uFEFF'+[entetes.map(csvCell).join(';'),...lignes].join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=`fiches_hotel_${filtreStatut.toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  }

  function imprimer(){
    const lignes=filtered.map(f=>`<tr><td>${htmlEsc(f.reference)}</td><td>${htmlEsc(f.nom.toUpperCase())} ${htmlEsc(f.prenom)}</td><td>${htmlEsc(f.type_document_libelle??f.type_document??'—')}</td><td style="font-family:monospace">${htmlEsc(f.numero_identite??'—')}<br><small>${htmlEsc(f.nationalite??'')}</small></td><td>${htmlEsc(f.chambre??'—')}</td><td>${htmlEsc(fmtDate(f.date_arrivee,true))}</td><td>${htmlEsc(fmtDate(f.date_depart_prevue))}</td><td>${htmlEsc(f.motif_sejour??'—')}</td><td>${f.statut==='EN_COURS'?'En cours':'Terminé'}</td></tr>`).join('');
    const w=window.open('','_blank');
    if(!w){alert('Autorisez les pop-ups.');return;}
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Registre hôtel</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:18px;margin:0 0 4px}.meta{font-size:11px;color:#555;margin-bottom:14px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ccc;padding:5px 7px;text-align:left;vertical-align:top}th{background:#0c44a0;color:#fff}small{color:#666}@media print{button{display:none}}</style></head><body><h1>🏨 Registre des fiches d'entrée hôtel</h1><div class="meta">Édité le ${htmlEsc(new Date().toLocaleString('fr-FR'))} — ${filtered.length} fiche(s)</div><table><thead><tr><th>Réf.</th><th>Nom &amp; Prénom</th><th>Pièce</th><th>N° / Nationalité</th><th>Chambre</th><th>Arrivée</th><th>Départ prévu</th><th>Motif</th><th>Statut</th></tr></thead><tbody>${lignes}</tbody></table><script>window.onload=function(){window.print();}<\/script></body></html>`);
    w.document.close();
  }

  const filtreOptions:[{label:string;value:FiltreStatut}]=([
    {label:'🛏️ En cours',value:'EN_COURS'},
    {label:'✅ Terminés',value:'TERMINE'},
    {label:'📋 Tous',value:'TOUS'},
  ] as {label:string;value:FiltreStatut}[]) as any;

  return (
    <div style={{width:'100%'}}>
      {/* En-tête */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'2rem',flexWrap:'wrap',gap:'1rem'}} className="animate-fade-in">
        <div>
          <h1 className="title-lg">🏨 Registre Hôtel</h1>
          <p style={{color:'var(--color-text-secondary)',marginTop:'0.25rem',fontSize:'0.9rem'}}>Fiches d&apos;entrée — pré-remplissage automatique via OCR sur le poste réception</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={charger} id="btn-refresh-hotel" style={{padding:'8px 18px',borderRadius:8,border:'1px solid var(--color-border)',background:'var(--color-bg-card)',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',gap:6}}>🔄 Actualiser</button>
          <button onClick={exporterCsv} id="btn-export-hotel" disabled={filtered.length===0} style={{padding:'8px 18px',borderRadius:8,border:'1px solid var(--color-border)',background:'var(--color-bg-card)',cursor:filtered.length===0?'not-allowed':'pointer',opacity:filtered.length===0?0.5:1,fontSize:'0.85rem',display:'flex',alignItems:'center',gap:6}}>📥 Export CSV</button>
          <button onClick={imprimer} id="btn-print-hotel" disabled={filtered.length===0} style={{padding:'8px 18px',borderRadius:8,border:'none',background:'var(--color-primary)',color:'#fff',cursor:filtered.length===0?'not-allowed':'pointer',opacity:filtered.length===0?0.5:1,fontSize:'0.85rem',display:'flex',alignItems:'center',gap:6}}>🖨️ Imprimer</button>
          <Link href="/dashboard/fiches-hotel/config" style={{padding:'8px 18px',borderRadius:8,border:'1px solid var(--color-primary)',background:'var(--color-bg-card)',color:'var(--color-primary)',cursor:'pointer',fontSize:'0.85rem',fontWeight:600,display:'flex',alignItems:'center',gap:6,textDecoration:'none'}}>⚙️ Personnaliser la fiche</Link>
          <button onClick={()=>{setFicheToEdit(null);setShowModal(true);}} id="btn-nouvelle-fiche" style={{padding:'8px 20px',borderRadius:8,border:'none',background:'linear-gradient(135deg,var(--color-accent),var(--color-primary))',color:'#fff',cursor:'pointer',fontSize:'0.85rem',fontWeight:700,display:'flex',alignItems:'center',gap:6,boxShadow:'0 4px 16px var(--color-primary-glow)'}}>＋ Nouvelle fiche</button>
        </div>
      </div>

      {/* KPI */}
      <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',marginBottom:'2rem'}} className="animate-fade-in-up">
        <StatCard value={nbEnCours}    label="Séjours en cours"      color="#22c55e" icon="🛏️" />
        <StatCard value={nbTermines}   label="Séjours terminés"      color="#6366f1" icon="✅" />
        <StatCard value={nbPasseports} label="Passeports présentés"  color="#1d4ed8" icon="🛂" />
        <StatCard value={nbTotal}      label="Total fiches chargées" color="#0c44a0" icon="📋" />
      </div>

      {/* Filtres */}
      <div className="glass animate-fade-in-up delay-1" style={{borderRadius:'var(--radius-xl)',padding:'1rem 1.25rem',marginBottom:'1.25rem',display:'flex',gap:'1rem',alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:4,background:'var(--color-bg-deep)',borderRadius:8,padding:4}}>
          {(filtreOptions as {label:string;value:FiltreStatut}[]).map(opt=>(
            <button key={opt.value} id={`filtre-hotel-${opt.value.toLowerCase()}`} onClick={()=>setFiltreStatut(opt.value)} style={{padding:'6px 16px',borderRadius:6,border:'none',cursor:'pointer',fontSize:'0.82rem',fontWeight:600,whiteSpace:'nowrap',background:filtreStatut===opt.value?'var(--color-primary)':'transparent',color:filtreStatut===opt.value?'#fff':'var(--color-text-muted)',transition:'all 0.2s'}}>{opt.label}</button>
          ))}
        </div>
        <input className="input" id="search-hotel" placeholder="Rechercher par nom, chambre, N° pièce, référence, motif..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:260}} />
      </div>

      {/* Tableau */}
      <div className="glass animate-fade-in-up delay-2" style={{borderRadius:'var(--radius-xl)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'var(--color-primary)'}}>
              {['Référence','Nom & Prénom','Pièce','N° / Nat.','Chambre','Arrivée','Départ prévu','Personnes','Statut','Action'].map(h=>(
                <th key={h} style={{padding:'0.875rem',textAlign:'left',fontSize:'0.73rem',color:'rgba(255,255,255,0.85)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading?(
              <tr><td colSpan={10} style={{textAlign:'center',padding:'3rem',color:'var(--color-text-muted)'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                  <div style={{width:32,height:32,border:'3px solid var(--color-primary)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
                  Chargement des fiches...
                </div>
              </td></tr>
            ):filtered.length===0?(
              <tr><td colSpan={10} style={{textAlign:'center',padding:'3rem',color:'var(--color-text-muted)'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                  <span style={{fontSize:'2.5rem'}}>🏨</span>
                  <span>Aucune fiche trouvée</span>
                  <span style={{fontSize:'0.8rem'}}>{filtreStatut==='EN_COURS'?'Aucun séjour en cours.':'Aucune fiche ne correspond.'}</span>
                </div>
              </td></tr>
            ):filtered.map((f,idx)=>{
              const enCours=f.statut==='EN_COURS';
              return (
                <tr key={f.id} onClick={()=>setFicheDetaillee(f)} style={{borderBottom:'1px solid var(--color-border)',background:idx%2===0?'transparent':'var(--color-bg-deep)',cursor:'pointer',transition:'background 0.15s'}} onMouseEnter={e=>(e.currentTarget.style.background='#dbeafe')} onMouseLeave={e=>(e.currentTarget.style.background=idx%2===0?'transparent':'var(--color-bg-deep)')}>
                  <td style={{padding:'0.75rem 0.875rem',whiteSpace:'nowrap'}}><span style={{fontFamily:'monospace',fontWeight:700,fontSize:'0.82rem',color:'var(--color-primary)'}}>{f.reference}</span></td>
                  <td style={{padding:'0.75rem 0.875rem'}}>
                    <div style={{fontWeight:600,fontSize:'0.88rem'}}>{f.nom.toUpperCase()} {f.prenom}</div>
                    {f.date_naissance&&<div style={{fontSize:'0.73rem',color:'var(--color-text-muted)',marginTop:2}}>Né(e) le {fmtDate(f.date_naissance)}</div>}
                  </td>
                  <td style={{padding:'0.75rem 0.875rem'}}><BadgeDoc type={f.type_document} /></td>
                  <td style={{padding:'0.75rem 0.875rem'}}>
                    <div style={{fontFamily:'monospace',fontSize:'0.82rem',fontWeight:500}}>{f.numero_identite||'—'}</div>
                    <div style={{fontSize:'0.73rem',color:'var(--color-text-muted)',marginTop:2}}>{f.nationalite||'—'}</div>
                  </td>
                  <td style={{padding:'0.75rem 0.875rem'}}>
                    {f.chambre?<span style={{display:'inline-block',padding:'3px 10px',borderRadius:20,fontSize:'0.78rem',fontWeight:700,background:'#ede9fe',color:'#7c3aed',border:'1px solid #c4b5fd'}}>🛏️ {f.chambre}</span>:'—'}
                  </td>
                  <td style={{padding:'0.75rem 0.875rem',fontSize:'0.8rem',color:'var(--color-text-muted)',whiteSpace:'nowrap'}}>{fmtDate(f.date_arrivee,true)}</td>
                  <td style={{padding:'0.75rem 0.875rem',fontSize:'0.8rem',whiteSpace:'nowrap'}}>{fmtDate(f.date_depart_prevue)}</td>
                  <td style={{padding:'0.75rem 0.875rem',textAlign:'center',fontSize:'0.85rem'}}>
                    {f.nombre_personnes>1?<span style={{fontWeight:700}}>👥 {f.nombre_personnes}</span>:'1'}
                    {f.accompagnants.length>0&&<span style={{marginLeft:6,fontSize:'0.72rem',color:'#a16207',fontWeight:600}}>+{f.accompagnants.length} enfant{f.accompagnants.length>1?'s':''}</span>}
                  </td>
                  <td style={{padding:'0.75rem 0.875rem'}}>
                    <span style={{display:'inline-block',padding:'3px 12px',borderRadius:20,fontSize:'0.73rem',fontWeight:700,whiteSpace:'nowrap',background:enCours?'#dcfce7':'#f1f5f9',color:enCours?'#16a34a':'#64748b',border:`1px solid ${enCours?'#86efac':'#cbd5e1'}`}}>
                      {enCours?'● En cours':'○ Terminé'}
                    </span>
                  </td>
                  <td style={{padding:'0.75rem 0.875rem'}} onClick={e=>e.stopPropagation()}>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <button onClick={()=>{setFicheToEdit(f);setShowModal(true);}} title="Modifier la fiche" style={{padding:'4px 8px',borderRadius:6,border:'1px solid var(--color-border)',background:'var(--color-bg-card)',cursor:'pointer',fontSize:'0.75rem'}}>✏️</button>
                      {enCours&&(
                        <button id={`btn-depart-${f.id}`} onClick={()=>handleDepart(f)} disabled={departEnCours===f.id} style={{padding:'5px 12px',borderRadius:6,cursor:'pointer',fontSize:'0.75rem',fontWeight:600,border:'none',background:departEnCours===f.id?'#e2e8f0':'#fee2e2',color:departEnCours===f.id?'#94a3b8':'#dc2626',transition:'all 0.15s',whiteSpace:'nowrap'}}>
                          {departEnCours===f.id?'...':'🚪 Départ'}
                        </button>
                      )}
                      <button onClick={()=>{if(confirm(`Supprimer la fiche ${f.reference} ?`))handleSupprimer(f);}} title="Supprimer la fiche" style={{padding:'4px 8px',borderRadius:6,border:'none',background:'#fee2e2',color:'#dc2626',cursor:'pointer',fontSize:'0.75rem'}}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading&&<div style={{textAlign:'center',marginTop:'1rem',fontSize:'0.78rem',color:'var(--color-text-muted)'}}>{filtered.length} fiche(s) affichée(s) — Données temps réel</div>}

      {showModal&&<ModalFiche ficheToEdit={ficheToEdit} onClose={()=>{setShowModal(false);setFicheToEdit(null);}} onSaved={()=>{setShowModal(false);setFicheToEdit(null);charger();}} />}
      {ficheDetaillee&&<DetailPanel f={ficheDetaillee} onClose={()=>setFicheDetaillee(null)} onDepart={handleDepart} onEdit={(f)=>{setFicheToEdit(f);setShowModal(true);}} onDelete={handleSupprimer} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
