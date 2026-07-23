import type { Metadata } from "next";
import { Poppins, Inter, Montserrat, Fraunces } from "next/font/google";
import "./globals.css";

// Police display (titres) — serif éditorial à fort caractère, registre notarial/juridique.
// Le corps de texte et l'UI restent sur Poppins.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-fraunces",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "ClariDoc Pro — Gestion Documentaire Sécurisée",
  description: "La solution de numérisation et d'archivage souveraine pour les professionnels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${poppins.variable} ${inter.variable} ${montserrat.variable} ${fraunces.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
