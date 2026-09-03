// Rôles du backend Django (accounts.models.User.RoleChoices) et page d'accueil
// correspondante dans le portail web.
//
// Source unique de vérité, partagée par proxy.ts et la page de connexion. Les deux
// décidaient auparavant chacun de leur côté, et leurs règles ne coïncidaient pas :
// la connexion envoyait vers /dashboard tout ce qui n'était pas SUPERADMIN, tandis
// que le proxy n'y admettait que BOSS et ADMIN. Un compte USER — le rôle par DÉFAUT
// du modèle Django, celui de tous les postes de numérisation — partait donc en
// boucle de redirection infinie /dashboard → /login → /dashboard, que le navigateur
// finissait par interrompre (« TypeError: Failed to fetch »).

/** Rôle → page d'accueil. Absent de cette table = pas d'accès au portail web. */
export const ACCUEIL_PAR_ROLE: Record<string, string> = {
  SUPERADMIN: '/admin',
  BOSS: '/dashboard',
  ADMIN: '/dashboard',
  // USER (rôle par défaut) n'a délibérément pas d'entrée : ces comptes servent à
  // l'application de numérisation, pas au portail.
  // GARDIEN non plus, pour la même raison : c'est un poste d'accueil qui tient le
  // registre des visiteurs DANS l'application ClariDoc. Hiérarchiquement, GARDIEN
  // est l'égal de USER — même absence d'accès au portail, métier différent.
};

/** Page d'accueil du rôle, ou null si ce rôle n'a rien à faire sur le portail. */
export function accueilPourRole(role: string | null | undefined): string | null {
  if (!role) return null;
  return ACCUEIL_PAR_ROLE[role] ?? null;
}
