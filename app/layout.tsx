import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "./detail.css";
import "./craft.css";
import "./supplier.css";
import "./paid-suppliers.css";
import "./supplier-dashboard.css";
import "./supplier-account-simple.css";
import "./employer-simple.css";
import "./account.css";
import "./brand.css";
import "./request-management.css";
import "./candidate.css";
import "./business-profile.css";
import "./candidate-directory.css";
import { GlobalControls } from "./ui/GlobalControls";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://jdemnato.cz"),
  title: { default: "TradeLink – práce, zakázky a dodavatelé", template: "%s | TradeLink" },
  description: "Práce, zakázky a dodavatelé. Všechno na jednom místě. Český inzertní a vyhledávací portál.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: { type: "website", locale: "cs_CZ", siteName: "TradeLink", title: "Práce, zakázky a dodavatelé na jednom místě", description: "Hledám práci. Zadávám zakázku. Nabízím práci. TradeLink" },
  twitter: { card: "summary_large_image", title: "TradeLink", description: "Práce, zakázky a dodavatelé na jednom místě." },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={geist.variable}>
        {children}
        <GlobalControls />
      </body>
    </html>
  );
}
