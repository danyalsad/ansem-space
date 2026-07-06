"use client";

import { motion } from "framer-motion";
import { ContractAddress } from "@/components/ContractAddress";

/** Cinematic section header with gold/crimson accent system. */
export function SectionHeader({
  kicker,
  title,
  sub,
  index,
}: {
  kicker: string;
  title: string;
  sub: string;
  index?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-12 sm:mb-16"
    >
      <div className="section-divider mb-8" />

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            {index && (
              <span className="flex h-8 w-8 items-center justify-center border border-gold/40 bg-gold/10 font-mono text-[10px] text-gold">
                {index}
              </span>
            )}
            <span className="h-px w-12 bg-gradient-to-r from-crimson to-gold" />
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-crimson-bright">
              {kicker}
            </span>
          </div>

          <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-tight text-bone sm:text-5xl lg:text-6xl">
            <span className="text-gold-shimmer">{title}</span>
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ash sm:text-base">{sub}</p>
        </div>

        <ContractAddress className="hidden shrink-0 lg:inline-flex" />
      </div>
    </motion.div>
  );
}