"use client";

import { motion } from "framer-motion";
import { ContractAddress } from "@/components/ContractAddress";

/** Consistent animated header for each of the five main sections. */
export function SectionHeader({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-10 sm:mb-14"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px w-8 bg-crimson" />
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-crimson">
          {kicker}
        </span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl uppercase leading-none tracking-tight text-bone sm:text-5xl">
          {title}
        </h2>
        <ContractAddress className="hidden sm:inline-flex" />
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash sm:text-base">{sub}</p>
    </motion.div>
  );
}
