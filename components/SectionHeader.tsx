"use client";

import { motion } from "framer-motion";
import { ContractAddress } from "@/components/ContractAddress";

export function SectionHeader({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub: string;
  index?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-14 sm:mb-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-medium tracking-wide text-gold/80">{kicker}</p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight text-bone sm:text-5xl lg:text-[3.25rem]">
            {title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ash sm:text-lg">{sub}</p>
        </div>
        <ContractAddress className="hidden shrink-0 lg:inline-flex" />
      </div>
    </motion.div>
  );
}