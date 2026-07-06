"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { cn, shortAddress } from "@/lib/utils";

export function ContractAddress({
  full = false,
  className,
}: {
  full?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
    } catch {
      window.prompt("Copy the $ANSEM contract address:", CONTRACT_ADDRESS);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      onClick={copy}
      title="Copy contract address"
      className={cn(
        "group inline-flex max-w-full items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-xs text-bone/90 transition-all hover:border-gold/35 hover:bg-gold/[0.06]",
        className
      )}
    >
      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">CA</span>
      <span className="truncate">
        {full ? CONTRACT_ADDRESS : shortAddress(CONTRACT_ADDRESS, 6)}
      </span>
      {copied ? (
        <Check size={14} className="shrink-0 text-gold" />
      ) : (
        <Copy size={14} className="shrink-0 text-mist group-hover:text-gold" />
      )}
    </button>
  );
}