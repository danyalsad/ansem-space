import { BullLogo } from "@/components/BullLogo";
import { ContractAddress } from "@/components/ContractAddress";
import {
  CREATOR_HANDLE,
  CREATOR_NAME,
  CREATOR_STORY,
  CREATOR_TAGLINE,
  CREATOR_WALLET,
  LINKS,
  TAGLINE,
} from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.05] bg-abyss">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <BullLogo className="h-10 w-10" />
              <span className="font-display text-lg font-semibold text-bone">
                ANSEM<span className="text-gold"> Space</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ash">{TAGLINE}</p>
            <div className="mt-6">
              <ContractAddress full className="max-w-full" />
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-bone">Trade $ANSEM</h4>
            <div className="mt-4 flex flex-col gap-2">
              {[
                { href: LINKS.pumpFun, label: "Trade on pump.fun", emoji: "🚀" },
                { href: LINKS.jupiter, label: "Swap on Jupiter", emoji: "🪐" },
                { href: LINKS.ansemX, label: "Ansem on X", emoji: "𝕏" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-ash transition-all hover:border-gold/30 hover:text-gold"
                >
                  {l.emoji} {l.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-bone">Disclaimer</h4>
            <p className="mt-4 text-sm leading-relaxed text-mist">
              Community-built fan site — not affiliated with Ansem (@blknoiz06). Market data via
              DexScreener; on-chain via Helius. $ANSEM is a meme coin with no intrinsic value.
              Not financial advice.
            </p>
          </div>
        </div>

        <div className="mt-14 gradient-border rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs text-gold">Chief Builder</p>
              <h4 className="mt-1 font-display text-2xl font-bold text-bone">{CREATOR_NAME}</h4>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ash">{CREATOR_STORY}</p>
              <p className="mt-3 text-sm font-medium text-gold">{CREATOR_TAGLINE}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3">
              <a
                href={LINKS.creatorX}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-medium text-gold transition-all hover:bg-gold/20"
              >
                𝕏 {CREATOR_HANDLE}
              </a>
              <span className="text-center font-mono text-[10px] text-mist">
                {CREATOR_WALLET.slice(0, 8)}…{CREATOR_WALLET.slice(-6)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.05] pt-8 text-sm text-mist sm:flex-row">
          <span>© 2026 ANSEM Space</span>
          <a href="#builders" className="text-gold hover:text-gold-glow">Hall of Builders</a>
          <span className="font-mono text-xs">ansem.space</span>
        </div>
      </div>
    </footer>
  );
}