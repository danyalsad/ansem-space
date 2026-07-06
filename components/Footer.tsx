import { BullLogo } from "@/components/BullLogo";
import { ContractAddress } from "@/components/ContractAddress";
import { CREATOR_WALLET, LINKS, TAGLINE } from "@/lib/constants";
import { shortAddress } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-abyss">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <BullLogo className="h-10 w-10" />
              <span className="font-display text-sm uppercase tracking-widest text-bone">
                ANSEM<span className="text-gold"> Space</span>
              </span>
            </div>
            <p className="mt-4 font-display text-[11px] uppercase tracking-[0.2em] text-ash">
              {TAGLINE}
            </p>
            <div className="mt-5">
              <ContractAddress full className="max-w-full" />
            </div>
          </div>

          <div>
            <h4 className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              Trade $ANSEM
            </h4>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={LINKS.pumpFun}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 border border-gold/30 px-4 py-2.5 font-display text-xs uppercase tracking-wider text-gold transition-all hover:border-gold hover:shadow-gold-glow [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]"
              >
                🚀 Trade on pump.fun
              </a>
              <a
                href={LINKS.jupiter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 border border-gold/30 px-4 py-2.5 font-display text-xs uppercase tracking-wider text-gold transition-all hover:border-gold hover:shadow-gold-glow [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]"
              >
                🪐 Swap on Jupiter
              </a>
              <a
                href={LINKS.ansemX}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 border border-edge px-4 py-2.5 font-display text-xs uppercase tracking-wider text-ash transition-all hover:border-bone hover:text-bone [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]"
              >
                𝕏 Ansem @blknoiz06
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              The fine print
            </h4>
            <p className="mt-4 text-xs leading-relaxed text-ash">
              ANSEM Space is a <span className="text-bone">community-built fan site</span>. It is
              not affiliated with, endorsed by, or operated by Ansem (@blknoiz06). Prices, stats
              and leaderboards on this site are simulated for entertainment. $ANSEM is a meme
              coin with no intrinsic value or expectation of financial return. Nothing here is
              financial advice — never invest more than you can afford to lose.
            </p>
          </div>
        </div>

        {/* Credits */}
        <div className="mt-12 border-t border-edge/60 pt-8">
          <h4 className="font-display text-xs uppercase tracking-[0.3em] text-gold">Credits</h4>
          <div className="mt-4 flex flex-col gap-2 text-xs text-ash sm:flex-row sm:items-center sm:gap-6">
            <span>
              Built for the <span className="text-gold">$ANSEM</span> community 🐂
            </span>
            <span className="font-mono" title={CREATOR_WALLET}>
              Creator: <span className="text-bone">{shortAddress(CREATOR_WALLET, 6)}</span>
            </span>
            <a
              href={LINKS.creatorX}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-gold transition-colors hover:text-gold-glow"
            >
              𝕏 @DannyMD_UK
            </a>
            <a href="/admin" className="font-mono text-ash/60 transition-colors hover:text-ash">
              admin
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-edge/60 pt-6 text-[11px] text-ash sm:flex-row">
          <span>© 2026 ANSEM Space · Built by the herd 🐂</span>
          <span className="font-mono">ansem.space — hold the line.</span>
        </div>
      </div>
    </footer>
  );
}
