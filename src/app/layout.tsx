import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI.CORP | Ingeniería Digital & Inteligencia Artificial",
  description: "Firma de ingeniería digital especializada en Inteligencia Artificial aplicada a crecimiento empresarial. Automatización, Agentes IA y Consultoría.",
  keywords: ["IA", "Automatización", "Agentes IA", "Digital Engineering", "Enterprise Growth"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

