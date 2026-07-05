import type { Metadata, Viewport } from "next";
import { Chakra_Petch, JetBrains_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { EffectsLayer } from "@/components/EffectsLayer";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} — The Home of the $ANSEM Herd`,
  description: `${TAGLINE} The ultimate $ANSEM (The Black Bull) community hub: meme forge, endless-runner game, diamond-hands culture, lore archive and live intel. CA: ${CONTRACT_ADDRESS}`,
  keywords: ["ANSEM", "$ANSEM", "The Black Bull", "Solana", "meme coin", "pump.fun", "Ansem"],
  openGraph: {
    title: `${SITE_NAME} — Forge Memes. Charge Forward. Hold the Line.`,
    description: `The central home for the $ANSEM community on Solana. Memes, games, culture and on-chain intel.`,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — The Home of the $ANSEM Herd`,
    description: TAGLINE,
  },
  icons: {
    // Inline SVG bull favicon — no asset pipeline needed.
    icon: `data:image/svg+xml,${encodeURIComponent(
      `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#0A0A0A"/><path d="M35 33 L14 25 L3 5 Q16 13 24 18 L38 27 Z" fill="#FFD700"/><path d="M65 33 L86 25 L97 5 Q84 13 76 18 L62 27 Z" fill="#FFD700"/><path d="M33 29 L67 29 L78 45 L71 72 L58 87 L50 95 L42 87 L29 72 L22 45 Z" fill="#141317" stroke="#FFD700" stroke-width="2.5"/><path d="M36 49 L46 53 L37 58 Z" fill="#FF2E2E"/><path d="M64 49 L54 53 L63 58 Z" fill="#FF2E2E"/><path d="M50 33 L53 45 L50 66 L47 45 Z" fill="#FFD700"/><path d="M44 76 L50 80 L56 76 L50 84 Z" fill="#FFD700"/></svg>`
    )}`,
  },
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
          {children}
          <EffectsLayer />
        </WalletProvider>
      </body>
    </html>
  );
}
