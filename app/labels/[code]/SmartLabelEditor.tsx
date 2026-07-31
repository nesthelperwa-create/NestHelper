"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, KeyRound, Loader2, LockKeyhole, MapPin, PackageOpen, PencilLine, QrCode, ScanLine, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";
import { CustomerAuthCard, getUserToken, SignedInBadge, useCustomerAuth } from "@/components/smart-labels/SmartLabelsAuth";
import { FinderContactCard } from "@/components/smart-labels/FinderContactCard";
import { siteConfig } from "@/lib/siteConfig";
import type { SmartLabelPhoto, SmartLabelPublicPayload } from "@/lib/smartLabels";

type SmartLabelFormState = {
  labelName: string;
  locationName: string;
  itemsInside: string;
  notes: string;
  photos: SmartLabelPhoto[];
};

type PublicState = {
  code: string;
  labelUrl: string;
  state: "unclaimed" | "claimed" | "legacy";
  useMode: "storage" | "lost_and_found";
  lostStatus: "not_lost" | "lost" | "recovered";
  publicItemName: string;
  publicMessage: string;
  allowFinderContact: boolean;
  allowFinderLocation: boolean;
  archived: boolean;
  claimStatus: string;
  batchName: string;
  hasLegacyContent: boolean;
  reservedOnly: boolean;
};

type PublicResponse = {
  ok?: boolean;
  error?: string;
  publicState?: PublicState;
  legacyLabel?: SmartLabelPublicPayload | null;
};

const emptyForm: SmartLabelFormState = {
  labelName: "",
  locationName: "",
  itemsInside: "",
  notes: "",
  photos: [],
};

const maxPhotos = 4;
const maxOriginalSize = 8 * 1024 * 1024;
const targetPhotoBytes = 95 * 1024;

function getErrorMessage(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "error" in value && typeof (value as { error?: unknown }).error === "string") {
    return (value as { error: string }).error;
  }
  return fallback;
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = dataUrl;
  });
}

async function compressPhoto(file: File): Promise<SmartLabelPhoto> {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Photo compression is not available in this browser.");

  let maxDimension = 760;
  let quality = 0.7;
  let output = originalDataUrl;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    output = canvas.toDataURL("image/jpeg", quality);
    if (estimateDataUrlBytes(output) <= targetPhotoBytes) break;
    maxDimension = Math.max(420, Math.round(maxDimension * 0.82));
    quality = Math.max(0.46, quality - 0.06);
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    type: "image/jpeg",
    size: estimateDataUrlBytes(output),
    dataUrl: output,
  };
}

function formatUpdatedDate(value?: string) {
  if (!value) return "Not updated yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Updated recently";
  return `Updated ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function SmartLabelEditor({ code }: { code: string }) {
  const safeCode = useMemo(() => code.toUpperCase().replace(/[^A-Z0-9]/g, ""), [code]);
  const { user, loading: authLoading } = useCustomerAuth();
  const [publicState, setPublicState] = useState<PublicState | null>(null);
  const [legacyLabel, setLegacyLabel] = useState<SmartLabelPublicPayload | null>(null);
  const [form, setForm] = useState<SmartLabelFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [removePin, setRemovePin] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);

  function syncLegacy(nextLabel: SmartLabelPublicPayload) {
    setLegacyLabel(nextLabel);
    if (!nextLabel.locked) {
      setForm({
        labelName: nextLabel.labelName || "",
        locationName: nextLabel.locationName || "",
        itemsInside: nextLabel.itemsInside || "",
        notes: nextLabel.notes || "",
        photos: nextLabel.photos || [],
      });
    }
  }

  async function loadState() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/smart-labels/${encodeURIComponent(safeCode)}`, { cache: "no-store" });
      const result = (await response.json().catch(() => null)) as PublicResponse | null;
      if (!response.ok || !result?.ok || !result.publicState) throw new Error(getErrorMessage(result, "This label could not be loaded."));
      setPublicState(result.publicState);
      setLegacyLabel(result.legacyLabel || null);
      if (result.legacyLabel && !result.legacyLabel.locked) syncLegacy(result.legacyLabel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "This label could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadState();
  }, [safeCode]);

  function update<K extends keyof SmartLabelFormState>(key: K, value: SmartLabelFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function unlockLabel() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/smart-labels/${encodeURIComponent(safeCode)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlock", currentPin }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(getErrorMessage(result, "That PIN did not work."));
      syncLegacy(result.label);
      setMessage("Label unlocked. You can update it now.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That PIN did not work.");
    } finally {
      setSaving(false);
    }
  }

  async function saveLegacyLabel() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = { ...form, currentPin, newPin: newPin.trim(), removePin };
      const response = await fetch(`/api/smart-labels/${encodeURIComponent(safeCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(getErrorMessage(result, "Unable to save this label."));
      syncLegacy(result.label);
      if (newPin.trim()) setCurrentPin(newPin.trim());
      if (removePin) setCurrentPin("");
      setNewPin("");
      setRemovePin(false);
      setMessage("Saved. This legacy Smart Label is updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save this label.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    setError("");
    if (!files.length) return;
    const openSlots = Math.max(0, maxPhotos - form.photos.length);
    const accepted = files.filter((file) => file.type.startsWith("image/") && file.size <= maxOriginalSize).slice(0, openSlots);
    if (!accepted.length) {
      setError(`Choose image files under ${maxOriginalSize / 1024 / 1024} MB. Up to ${maxPhotos} photos can be saved per label.`);
      return;
    }
    setPhotoBusy(true);
    try {
      const compressed = await Promise.all(accepted.map((file) => compressPhoto(file)));
      update("photos", [...form.photos, ...compressed].slice(0, maxPhotos));
    } catch {
      setError("One photo could not be added. Try a smaller image.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function removePhoto(photoId: string) {
    update("photos", form.photos.filter((photo) => photo.id !== photoId));
  }

  async function claimLabel() {
    if (!user) return;
    setClaimBusy(true);
    setError("");
    setMessage("");
    try {
      const token = await getUserToken(user);
      const response = await fetch("/api/smart-labels/claim-label", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: safeCode }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string; message?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to claim this label.");
      setMessage(result?.message || "Label added to your dashboard.");
      window.location.href = `/my-labels/label/${encodeURIComponent(safeCode)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to claim this label.");
    } finally {
      setClaimBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbf6ea] px-4 py-10 text-[#075c58]">
        <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-4 font-black shadow-soft"><Loader2 className="animate-spin" size={20} /> Loading Smart Label...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#fbf6ea] px-3 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto w-full min-w-0 max-w-4xl overflow-hidden rounded-[2rem] border border-nest-gold/18 bg-white shadow-soft">
        <div className="bg-gradient-to-br from-white via-nest-cream to-nest-mint/28 p-5 sm:p-7">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:flex-nowrap">
              <Image src={siteConfig.assets.logo} alt="NestHelper" width={190} height={64} className="h-auto w-36 max-w-full shrink-0 sm:w-40" priority />
              <div className="min-w-0">
                <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-nest-gold">Smart Label</p>
                <p className="break-all font-mono text-2xl font-black text-nest-teal">{safeCode}</p>
              </div>
            </div>
            <div className="flex min-w-0 max-w-full flex-wrap gap-3">
              {user ? <SignedInBadge user={user} /> : null}
              <Link href="/my-labels" className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-nest-teal/18 bg-white px-4 py-2 text-sm font-black text-nest-teal shadow-sm transition-all hover:-translate-y-0.5 hover:border-nest-teal/35 hover:bg-nest-mint/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/45"><ScanLine size={16} /> My Labels</Link>
            </div>
          </div>
        </div>

        <div className="min-w-0 p-4 sm:p-7">
          {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700">{error}</div>}
          {message && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-700">{message}</div>}

          {!publicState ? (
            <div className="rounded-3xl border border-nest-gold/16 bg-nest-cream p-6 text-center font-bold text-nest-ink/70">Label not found.</div>
          ) : publicState.state === "unclaimed" ? (
            <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.05fr),minmax(0,0.95fr)]">
              <div className="min-w-0 overflow-hidden rounded-[1.8rem] border border-nest-gold/16 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nest-mint/35 text-nest-teal"><QrCode size={26} /></div>
                <h2 className="mt-4 whitespace-normal break-words text-2xl font-black leading-tight text-nest-teal">This label is ready to be added</h2>
                <p className="mt-2 whitespace-normal break-words text-sm font-semibold leading-7 text-slate-600">Add what&apos;s inside this box, bin, or tote so you can find it later. This page does not change the printed QR code or URL.</p>
                <ul className="mt-4 grid min-w-0 gap-3 whitespace-normal break-words text-sm font-semibold leading-6 text-slate-700">
                  <li className="min-w-0 whitespace-normal break-words rounded-2xl bg-[#fbf6ea] p-4">First activate the code that came with your Etsy order in <span className="font-black text-nest-teal">My Labels</span>.</li>
                  <li className="min-w-0 whitespace-normal break-words rounded-2xl bg-[#fbf6ea] p-4">Then scan any unclaimed NestHelper Smart Label from your package.</li>
                  <li className="min-w-0 whitespace-normal break-words rounded-2xl bg-[#fbf6ea] p-4">Tap <span className="font-black text-nest-teal">Add Label</span> below to save it to your dashboard.</li>
                </ul>
                <div className="mt-4 min-w-0 whitespace-normal break-words rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800"><ShieldAlert className="mr-2 inline-block" size={16} /> Do not store passwords, financial information, security codes, or sensitive private information in label notes.</div>
                {user && (
                    <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
                    <button type="button" onClick={claimLabel} disabled={claimBusy} className="btn-primary w-full min-w-0 justify-center whitespace-normal text-center disabled:cursor-not-allowed disabled:opacity-60">{claimBusy ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Add Label</button>
                    <Link href="/my-labels" className="inline-flex w-full min-w-0 cursor-pointer items-center justify-center whitespace-normal rounded-full border border-nest-teal/18 bg-white px-4 py-3 text-center text-sm font-black text-nest-teal shadow-sm transition-all hover:-translate-y-0.5 hover:border-nest-teal/35 hover:bg-nest-mint/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/45">Go to My Labels</Link>
                  </div>
                )}
              </div>
              {!user && !authLoading ? (
                <CustomerAuthCard title="Sign in to claim this label" subtitle="Create an account or sign in, then activate your order code and add this label to your dashboard." compact />
              ) : user ? (
                <div className="min-w-0 overflow-hidden rounded-[1.8rem] border border-nest-gold/16 bg-gradient-to-br from-white via-nest-cream to-nest-mint/16 p-5 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-nest-gold">Signed in</p>
                  <h3 className="mt-2 break-all text-xl font-black text-nest-teal">{user.email}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">If you already activated your label pack, tap <span className="font-black">Add Label</span>. If not, go to My Labels first and enter the activation code from your order card.</p>
                </div>
              ) : null}
            </section>
          ) : publicState.state === "claimed" ? (
            <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.02fr),minmax(0,0.98fr)]">
              <div className="rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-sm">
                <h2 className="text-2xl font-black text-nest-teal">This label is already claimed</h2>
                <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">Private storage contents stay protected. If this is your label, open it from your My Labels dashboard after signing in.</p>
                {publicState.useMode === "lost_and_found" ? (
                  <div className="mt-5 min-w-0 rounded-[1.5rem] border border-nest-gold/14 bg-[#fbf6ea] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">Lost &amp; Found</p>
                    <h3 className="mt-2 break-words text-xl font-black text-nest-teal">{publicState.publicItemName || "Found item"}</h3>
                    <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-600">{publicState.publicMessage || "This item has an owner. Use the private contact form to help arrange its return."}</p>
                    <div className={`mt-4 inline-flex max-w-full items-center rounded-full px-3 py-2 text-xs font-black ${publicState.lostStatus === "lost" ? "bg-red-100 text-red-800" : publicState.lostStatus === "recovered" ? "bg-emerald-100 text-emerald-800" : "bg-nest-mint/45 text-nest-teal"}`}>
                      {publicState.lostStatus === "lost" ? "Owner marked this item lost" : publicState.lostStatus === "recovered" ? "Owner marked this item recovered" : "Owner contact is available"}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-[1.5rem] border border-nest-gold/14 bg-[#fbf6ea] p-5 text-sm font-semibold leading-6 text-slate-600">This is a private storage label. The public scan page does not expose the saved contents or notes.</div>
                )}
              </div>
              <div className="grid min-w-0 gap-5">
                {publicState.useMode === "lost_and_found" && publicState.allowFinderContact && publicState.lostStatus !== "recovered" && !publicState.archived ? (
                  <FinderContactCard code={safeCode} itemName={publicState.publicItemName || "this item"} allowLocation={publicState.allowFinderLocation} />
                ) : publicState.useMode === "lost_and_found" ? (
                  <div className="min-w-0 rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-sm">
                    <h3 className="break-words text-xl font-black text-nest-teal">Finder contact is currently closed</h3>
                    <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-600">{publicState.archived ? "This label is archived, so new finder messages are no longer accepted." : publicState.lostStatus === "recovered" ? "The owner marked this item as recovered, so new finder messages are no longer accepted." : "The owner has not enabled private finder messages for this label."}</p>
                  </div>
                ) : null}
                <div className="min-w-0 rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-sm">
                  <h3 className="text-xl font-black text-nest-teal">Is this your label?</h3>
                  <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-600">Owners can sign in to My Labels to edit private contents, change Lost &amp; Found settings, and review finder messages.</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Link href="/my-labels" className="btn-primary justify-center">Open My Labels</Link>
                    <Link href="/my-labels/find" className="inline-flex cursor-pointer items-center justify-center rounded-full border border-nest-teal/18 bg-white px-4 py-3 text-sm font-black text-nest-teal shadow-sm transition-all hover:-translate-y-0.5 hover:border-nest-teal/35 hover:bg-nest-mint/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/45">Find My Item</Link>
                  </div>
                </div>
              </div>
            </section>
          ) : legacyLabel?.locked ? (
            <div className="rounded-[1.8rem] border border-nest-gold/20 bg-nest-cream p-5 sm:p-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-nest-teal shadow-sm"><LockKeyhole size={26} /></div>
              <h2 className="mt-4 text-center text-2xl font-black text-nest-teal">This legacy label is PIN protected.</h2>
              <p className="mx-auto mt-2 max-w-lg text-center font-semibold leading-7 text-nest-ink/70">Enter the family&apos;s 4-digit PIN to view or update the label details.</p>
              <div className="mx-auto mt-5 grid max-w-sm gap-3">
                <input inputMode="numeric" pattern="[0-9]*" maxLength={4} className="input text-center font-mono text-2xl tracking-[0.4em]" placeholder="0000" value={currentPin} onChange={(event) => setCurrentPin(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))} />
                <button type="button" onClick={unlockLabel} disabled={saving || currentPin.length !== 4} className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />} Unlock label</button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800"><ShieldAlert className="mr-2 inline-block" size={16} /> Legacy label compatibility mode: existing label data still works here. If you want it moved into a private dashboard account later, sign in and contact NestHelper or recreate it as a claimed label.</div>
              <SmartInput icon={<PencilLine size={18} />} label="Label name" placeholder="Winter clothes, Kids toys, Garage tools..." value={form.labelName} onChange={(value) => update("labelName", value)} />
              <SmartInput icon={<MapPin size={18} />} label="Location" placeholder="Garage — top shelf, hallway closet, pantry left side..." value={form.locationName} onChange={(value) => update("locationName", value)} />
              <SmartTextArea icon={<PackageOpen size={18} />} label="Items inside" placeholder="Coats, scarves, gloves, hats, snow pants..." value={form.itemsInside} onChange={(value) => update("itemsInside", value)} rows={5} />
              <SmartTextArea icon={<PencilLine size={18} />} label="Notes" placeholder="Use during winter months. Keep away from moisture..." value={form.notes} onChange={(value) => update("notes", value)} rows={4} />

              <div className="rounded-[1.5rem] border border-nest-gold/16 bg-nest-cream/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-black text-nest-teal"><Camera size={18} /> Photos</div>
                    <p className="mt-1 text-sm font-semibold leading-6 text-nest-ink/64">Optional. Add up to {maxPhotos} small photos to help remember what is inside.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-nest-teal/20 bg-white px-4 py-2 text-sm font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    {photoBusy ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />} Add photos
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoUpload} />
                  </label>
                </div>
                {form.photos.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{form.photos.map((photo) => <div key={photo.id} className="overflow-hidden rounded-2xl border border-nest-gold/16 bg-white shadow-sm"><img src={photo.dataUrl} alt={photo.name} className="h-44 w-full object-cover" /><div className="flex items-center justify-between gap-2 p-3"><p className="truncate text-xs font-black text-nest-teal">{photo.name}</p><button type="button" onClick={() => removePhoto(photo.id)} className="cursor-pointer rounded-full bg-nest-cream p-2 text-nest-teal shadow-sm transition-all hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200" aria-label="Remove photo"><Trash2 size={15} /></button></div></div>)}</div>}
              </div>

              <div className="rounded-[1.5rem] border border-nest-gold/16 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3"><div className="rounded-2xl bg-nest-mint/35 p-3 text-nest-teal"><ShieldCheck size={20} /></div><div><h2 className="text-xl font-black text-nest-teal">Optional privacy PIN</h2><p className="mt-1 text-sm font-semibold leading-6 text-nest-ink/64">Default is OFF / no PIN. Add a 4-digit PIN when the label includes private notes or photos.</p></div></div>
                {legacyLabel?.pinEnabled && <label className="mt-4 grid gap-2"><span className="text-sm font-black text-nest-teal">Current PIN required to save</span><input inputMode="numeric" pattern="[0-9]*" maxLength={4} className="input max-w-xs font-mono tracking-[0.25em]" placeholder="0000" value={currentPin} onChange={(event) => setCurrentPin(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))} /></label>}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2"><span className="text-sm font-black text-nest-teal">Add or change PIN</span><input inputMode="numeric" pattern="[0-9]*" maxLength={4} className="input font-mono tracking-[0.25em]" placeholder="Leave blank to keep current setting" value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))} /></label>
                  {legacyLabel?.pinEnabled && <label className="flex items-center gap-3 rounded-2xl border border-nest-gold/14 bg-nest-cream px-4 py-3 text-sm font-black text-nest-teal"><input type="checkbox" checked={removePin} onChange={(event) => setRemovePin(event.target.checked)} className="h-5 w-5 accent-[#075c58]" /> Turn PIN off after save</label>}
                </div>
              </div>

              <div className="sticky bottom-3 z-10 rounded-[1.4rem] border border-nest-gold/18 bg-white/92 p-3 shadow-xl backdrop-blur"><button type="button" onClick={saveLegacyLabel} disabled={saving} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Save Smart Label</button></div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto mt-5 w-full min-w-0 max-w-4xl break-words rounded-[1.5rem] border border-nest-gold/16 bg-white/80 p-4 text-center text-xs font-bold leading-5 text-nest-ink/58 shadow-sm">
        Need help with this label? Contact NestHelper at <a href={`mailto:${siteConfig.email}`} className="text-nest-teal underline">{siteConfig.email}</a>. Do not store emergency, medical, financial, or password information here.
      </section>
    </main>
  );
}

function SmartInput({ icon, label, placeholder, value, onChange }: { icon: React.ReactNode; label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return (<label className="grid gap-2 rounded-[1.5rem] border border-nest-gold/16 bg-white p-4 shadow-sm"><span className="flex items-center gap-2 font-black text-nest-teal">{icon} {label}</span><input className="input" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /></label>);
}

function SmartTextArea({ icon, label, placeholder, value, onChange, rows }: { icon: React.ReactNode; label: string; placeholder: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (<label className="grid gap-2 rounded-[1.5rem] border border-nest-gold/16 bg-white p-4 shadow-sm"><span className="flex items-center gap-2 font-black text-nest-teal">{icon} {label}</span><textarea className="input min-h-28" rows={rows} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /></label>);
}
