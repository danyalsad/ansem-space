import type { Metadata, Viewport } from "next";
import { Chakra_Petch, JetBrains_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletProvider } from "@/components/WalletProvider";
import { MarketProvider } from "@/components/MarketProvider";
import { HerdProvider } from "@/components/HerdProvider";
import { EffectsLayer } from "@/components/EffectsLayer";
import { slotUrl } from "@/lib/asset-manifest";
import { CONTRACT_ADDRESS, SITE_NAME, SITE_URL, TAGLINE } from "@/lib/constants";

const display = Unbounded({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-display",
});
const body = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

// Brand assets live at permanent Blob URLs — replaceable from /admin
// without a redeploy (see lib/asset-manifest.ts).
const OG_IMAGE = slotUrl("og-image");
const FAVICON = slotUrl("favicon");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} — The Home of the $ANSEM Herd`,
  description: `${TAGLINE} The ultimate $ANSEM (The Black Bull) community hub: meme forge, endless-runner game, Herd Points, diamond-hands culture, lore archive and live market intel. CA: ${CONTRACT_ADDRESS}`,
  keywords: ["ANSEM", "$ANSEM", "The Black Bull", "Solana", "meme coin", "pump.fun", "Ansem"],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — Forge Memes. Charge Forward. Hold the Line.`,
    description: `The central home for the $ANSEM community on Solana. Memes, games, Herd Points and live market intel.`,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "ANSEM Space — The Home of the $ANSEM Herd" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — The Home of the $ANSEM Herd`,
    description: TAGLINE,
    creator: "@DannyMD_UK",
    images: [OG_IMAGE],
  },
  icons: {
    icon: [{ url: FAVICON, type: "image/png", sizes: "512x512" }],
    apple: [{ url: FAVICON, sizes: "512x512" }],
    shortcut: FAVICON,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-void font-body text-bone antialiased">
        <WalletProvider>
          <MarketProvider>
            <HerdProvider>
              {children}
              <EffectsLayer />
            </HerdProvider>
          </MarketProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
