"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { cn, shortAddress } from "@/lib/utils";

/** Copyable contract-address chip, shown on every section of the site. */
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
      // Clipboard API blocked — fall back to a selectable prompt.
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
        "group inline-flex max-w-full items-center gap-2 border border-gold/25 bg-void/60 px-3 py-2 font-mono text-[11px] text-gold/90 transition-all hover:border-gold/60 hover:shadow-gold-glow sm:text-xs",
        "[clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]",
        className
      )}
    >
      <span className="text-ash">CA</span>
      <span className="truncate">
        {full ? CONTRACT_ADDRESS : shortAddress(CONTRACT_ADDRESS, 6)}
      </span>
      {copied ? (
        <Check size={13} className="shrink-0 text-gold" />
      ) : (
        <Copy size={13} className="shrink-0 text-ash group-hover:text-gold" />
      )}
    </button>
  );
}
