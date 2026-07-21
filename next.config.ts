import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Optimisations mémoire build ─────────────────────────────────────────────
  experimental: {
    workerThreads: false,  // Désactive les worker threads (moins gourmand en RAM)
    cpus: 2,               // Max 2 cœurs pour la génération de pages statiques
  },

  // Désactive la télémétrie pendant le build (économie légère de ressources)
  // Pour désactiver définitivement: NEXT_TELEMETRY_DISABLED=1 dans .env.local
};

export default nextConfig;
