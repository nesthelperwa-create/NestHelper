import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Helper Application | NestHelper",
  description: "Apply to support NestHelper families as a checked household helper or local partner provider.",
};

export default function HelperApplicationRedirectPage() {
  permanentRedirect("/helpers");
}
