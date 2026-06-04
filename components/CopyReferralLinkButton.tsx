"use client";

import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";

type CopyReferralLinkButtonProps = {
  referralUrl: string;
};

export function CopyReferralLinkButton({ referralUrl }: CopyReferralLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
      window.prompt("Copy this referral link:", referralUrl);
    }
  }

  return (
    <button
      type="button"
      onClick={copyReferralLink}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-nest-teal px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-nest-teal/90 sm:w-auto"
    >
      {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
      {copied ? "Copied" : "Copy referral link"}
    </button>
  );
}
