import type { Metadata } from "next";
import "./globals.css";
import PwaRegister from "./PwaRegister";
export const metadata: Metadata = {
  title: "ANGIE PRETTY | Gestion des ventes",
  description: "Gestion commerciale, stock, facturation, dispatching et feedback ANGIE PRETTY.",
  manifest: "/manifest.json",
  applicationName: "ANGIE PRETTY",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ANGIE PRETTY" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" }
};
export const viewport = { themeColor: "#7c3aed", width: "device-width", initialScale: 1, maximumScale: 5 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><PwaRegister />{children}</body></html>;
}
