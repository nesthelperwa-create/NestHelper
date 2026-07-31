"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, CheckCircle2, ImagePlus, Loader2, MapPin, PackageOpen, PencilLine, ScanLine, ShieldAlert, Trash2 } from "lucide-react";
import { CustomerAuthCard, getUserToken, SignedInBadge, useCustomerAuth } from "@/components/smart-labels/SmartLabelsAuth";
import { SmartLabelsShell } from "@/components/smart-labels/SmartLabelsShell";
import { FinderMessagesPanel, type FinderMessage } from "@/components/smart-labels/FinderMessagesPanel";
import type { DashboardLabel } from "@/components/smart-labels/MyLabelsDashboard";
import { siteConfig } from "@/lib/siteConfig";
import type { SmartLabelPhoto } from "@/lib/smartLabels";

type FormState = {
  labelName: string;
  locationName: string;
  itemsInside: string;
  notes: string;
  photos: SmartLabelPhoto[];
  containerType: string;
  collectionId: string;
  collectionName: string;
  useMode: "storage" | "lost_and_found";
  lostStatus: "not_lost" | "lost" | "recovered";
  publicItemName: string;
  publicMessage: string;
  allowFinderContact: boolean;
  allowFinderLocation: boolean;
  archived: boolean;
};

type LabelResponse = { ok?: boolean; error?: string; message?: string; label?: DashboardLabel; collections?: Array<{ id: string; collectionId: string; name: string; description: string }> };
type FinderMessagesResponse = { ok?: boolean; error?: string; messages?: FinderMessage[]; message?: FinderMessage };

const maxPhotos = 4;
const maxOriginalSize = 8 * 1024 * 1024;
const targetPhotoBytes = 95 * 1024;

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

function emptyForm(): FormState {
  return {
    labelName: "",
    locationName: "",
    itemsInside: "",
    notes: "",
    photos: [],
    containerType: "",
    collectionId: "",
    collectionName: "",
    useMode: "storage",
    lostStatus: "not_lost",
    publicItemName: "",
    publicMessage: "",
    allowFinderContact: true,
    allowFinderLocation: true,
    archived: false,
  };
}

function formatUpdated(value?: string) {
  if (!value) return "Recently updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return `Updated ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function OwnedLabelEditor({ code }: { code: string }) {
  const safeCode = useMemo(() => code.toUpperCase().replace(/[^A-Z0-9]/g, ""), [code]);
  const { user, loading: authLoading } = useCustomerAuth();
  const [label, setLabel] = useState<DashboardLabel | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [collections, setCollections] = useState<Array<{ id: string; collectionId: string; name: string; description: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [finderMessages, setFinderMessages] = useState<FinderMessage[]>([]);
  const [finderMessagesLoading, setFinderMessagesLoading] = useState(false);
  const [finderActionId, setFinderActionId] = useState("");

  function sync(nextLabel: DashboardLabel) {
    setLabel(nextLabel);
    setForm({
      labelName: nextLabel.labelName || "",
      locationName: nextLabel.locationName || "",
      itemsInside: nextLabel.itemsInside || "",
      notes: nextLabel.notes || "",
      photos: nextLabel.photos || [],
      containerType: nextLabel.containerType || "",
      collectionId: nextLabel.collectionId || "",
      collectionName: nextLabel.collectionName || "",
      useMode: nextLabel.useMode || "storage",
      lostStatus: nextLabel.lostStatus || "not_lost",
      publicItemName: nextLabel.publicItemName || "",
      publicMessage: nextLabel.publicMessage || "",
      allowFinderContact: nextLabel.allowFinderContact,
      allowFinderLocation: nextLabel.allowFinderLocation,
      archived: nextLabel.archived,
    });
  }

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const token = await getUserToken(user);
        setFinderMessagesLoading(true);
        const [labelResponse, collectionsResponse, finderResponse] = await Promise.all([
          fetch(`/api/smart-labels/my-labels/${encodeURIComponent(safeCode)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
          fetch("/api/smart-labels/collections", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
          fetch(`/api/smart-labels/my-labels/${encodeURIComponent(safeCode)}/finder-messages`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        ]);
        const labelResult = (await labelResponse.json().catch(() => null)) as LabelResponse | null;
        const collectionsResult = (await collectionsResponse.json().catch(() => null)) as { ok?: boolean; collections?: Array<{ id: string; collectionId: string; name: string; description: string }> } | null;
        const finderResult = (await finderResponse.json().catch(() => null)) as FinderMessagesResponse | null;
        if (!labelResponse.ok || !labelResult?.ok || !labelResult.label) throw new Error(labelResult?.error || "Unable to load this label.");
        sync(labelResult.label);
        setCollections(collectionsResult?.collections || []);
        if (finderResponse.ok && finderResult?.ok) setFinderMessages(finderResult.messages || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load this label.");
      } finally {
        setLoading(false);
        setFinderMessagesLoading(false);
      }
    }
    load();
  }, [user, safeCode]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function updateFinderMessageStatus(messageId: string, status: "read" | "resolved") {
    if (!user) return;
    setFinderActionId(messageId);
    setError("");
    try {
      const token = await getUserToken(user);
      const response = await fetch(`/api/smart-labels/my-labels/${encodeURIComponent(safeCode)}/finder-messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messageId, status }),
      });
      const result = (await response.json().catch(() => null)) as FinderMessagesResponse | null;
      if (!response.ok || !result?.ok || !result.message) throw new Error(result?.error || "Unable to update this finder message.");
      setFinderMessages((previous) => previous.map((item) => item.id === messageId ? result.message as FinderMessage : item));
    } catch (finderError) {
      setError(finderError instanceof Error ? finderError.message : "Unable to update this finder message.");
    } finally {
      setFinderActionId("");
    }
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const openSlots = Math.max(0, maxPhotos - form.photos.length);
    const accepted = files.filter((file) => file.type.startsWith("image/") && file.size <= maxOriginalSize).slice(0, openSlots);
    if (!accepted.length) {
      setError(`Choose image files under ${maxOriginalSize / 1024 / 1024} MB. Up to ${maxPhotos} photos can be saved per label.`);
      return;
    }
    setPhotoBusy(true);
    setError("");
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

  async function save() {
    if (!user) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const selectedCollection = collections.find((collection) => collection.id === form.collectionId || collection.collectionId === form.collectionId);
      const token = await getUserToken(user);
      const response = await fetch(`/api/smart-labels/my-labels/${encodeURIComponent(safeCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          collectionName: selectedCollection?.name || form.collectionName,
        }),
      });
      const result = (await response.json().catch(() => null)) as LabelResponse | null;
      if (!response.ok || !result?.ok || !result.label) throw new Error(result?.error || "Unable to save this label.");
      sync(result.label);
      setMessage(result?.message || "Saved. Your Smart Label is updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save this label.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SmartLabelsShell title="Edit Label" subtitle="Update the name, location, contents, collection, and mode for this Smart Label.">
      {authLoading ? (
        <div className="grid place-items-center py-16"><div className="flex items-center gap-3 rounded-3xl bg-white px-5 py-4 font-black text-nest-teal shadow-soft"><Loader2 className="animate-spin" size={18} /> Loading account…</div></div>
      ) : !user ? (
        <CustomerAuthCard title="Sign in to edit this label" compact />
      ) : loading ? (
        <div className="grid place-items-center py-16"><div className="flex items-center gap-3 rounded-3xl bg-white px-5 py-4 font-black text-nest-teal shadow-soft"><Loader2 className="animate-spin" size={18} /> Loading label…</div></div>
      ) : error && !label ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
      ) : (
        <div className="grid gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/my-labels" className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-nest-teal/18 bg-white px-4 py-2 text-sm font-black text-nest-teal shadow-sm transition-all hover:-translate-y-0.5 hover:border-nest-teal/35 hover:bg-nest-mint/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/45"><ArrowLeft size={16} /> Back to My Labels</Link>
            <SignedInBadge user={user} />
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
          {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div>}

          <section className="rounded-[1.8rem] border border-nest-gold/16 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Image src={siteConfig.assets.logo} alt="NestHelper" width={190} height={64} className="h-auto w-36" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-nest-gold">Label code</p>
                  <h2 className="text-2xl font-black text-nest-teal">{label?.code || safeCode}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{label ? formatUpdated(label.updatedAtIso) : "Ready"}</p>
                </div>
              </div>
              <a href={label?.labelUrl || `/labels/${safeCode}`} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-nest-teal/18 bg-white px-4 py-2 text-sm font-black text-nest-teal shadow-sm transition-all hover:-translate-y-0.5 hover:border-nest-teal/35 hover:bg-nest-mint/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/45"><ScanLine size={16} /> Open public scan page</a>
            </div>
          </section>

          {(form.useMode === "lost_and_found" || finderMessages.length > 0) && (
            <FinderMessagesPanel
              messages={finderMessages}
              loading={finderMessagesLoading}
              busyId={finderActionId}
              onStatusChange={updateFinderMessageStatus}
            />
          )}

          <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="grid gap-5">
              <Field label="Label name" icon={<PencilLine size={18} />}><input className="input" value={form.labelName} onChange={(event) => update("labelName", event.target.value)} placeholder="Garage Tote 3" /></Field>
              <Field label="Location" icon={<MapPin size={18} />}><input className="input" value={form.locationName} onChange={(event) => update("locationName", event.target.value)} placeholder="Garage shelf" /></Field>
              <Field label="Container type" icon={<PackageOpen size={18} />}><input className="input" value={form.containerType} onChange={(event) => update("containerType", event.target.value)} placeholder="Box, bin, tote, drawer..." /></Field>
              <Field label="Collection" icon={<PackageOpen size={18} />}>
                <select className="input" value={form.collectionId} onChange={(event) => {
                  const selected = collections.find((item) => item.id === event.target.value || item.collectionId === event.target.value);
                  update("collectionId", event.target.value);
                  update("collectionName", selected?.name || "");
                }}>
                  <option value="">No collection selected</option>
                  {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
                </select>
              </Field>
              <Field label="Contents" icon={<PackageOpen size={18} />}><textarea className="input min-h-32" rows={5} value={form.itemsInside} onChange={(event) => update("itemsInside", event.target.value)} placeholder="extension cords, drill bits, tape measure, work gloves" /></Field>
              <Field label="Notes" icon={<PencilLine size={18} />}><textarea className="input min-h-28" rows={4} value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Anything extra you want to remember" /></Field>

              <section className="rounded-[1.6rem] border border-nest-gold/16 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-black text-nest-teal"><Camera size={18} /> Photos</div>
                    <p className="mt-1 text-sm font-semibold text-slate-600">Optional. Add up to {maxPhotos} small photos.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-nest-teal/20 bg-white px-4 py-2 text-sm font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5">
                    {photoBusy ? <Loader2 className="animate-spin" size={16} /> : <ImagePlus size={16} />} Add photos
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoUpload} />
                  </label>
                </div>
                {form.photos.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{form.photos.map((photo) => <div key={photo.id} className="overflow-hidden rounded-2xl border border-nest-gold/16 bg-white"><img src={photo.dataUrl} alt={photo.name} className="h-44 w-full object-cover" /><div className="flex items-center justify-between gap-2 p-3"><p className="truncate text-xs font-black text-nest-teal">{photo.name}</p><button type="button" onClick={() => removePhoto(photo.id)} className="cursor-pointer rounded-full bg-nest-cream p-2 text-nest-teal shadow-sm transition-all hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200" aria-label="Remove photo"><Trash2 size={15} /></button></div></div>)}</div>}
              </section>
            </div>

            <div className="grid gap-5">
              <section className="rounded-[1.6rem] border border-nest-gold/16 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-black text-nest-teal">Mode</h3>
                <p className="mt-2 text-sm font-semibold text-slate-600">Use storage mode for home organization or lost-and-found mode if you want the public scan page to help a finder contact you without seeing private contents.</p>
                <div className="mt-4 grid gap-3">
                  <button type="button" onClick={() => update("useMode", "storage")} className={`cursor-pointer rounded-2xl border px-4 py-3 text-left text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/45 ${form.useMode === "storage" ? "border-nest-teal bg-nest-mint/30 text-nest-teal shadow-md" : "border-nest-gold/16 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-nest-teal/30 hover:bg-nest-mint/20 hover:shadow-md"}`}>Storage</button>
                  <button type="button" onClick={() => update("useMode", "lost_and_found")} className={`cursor-pointer rounded-2xl border px-4 py-3 text-left text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-gold/45 ${form.useMode === "lost_and_found" ? "border-nest-teal bg-nest-mint/30 text-nest-teal shadow-md" : "border-nest-gold/16 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-nest-teal/30 hover:bg-nest-mint/20 hover:shadow-md"}`}>Lost &amp; Found</button>
                </div>
                {form.useMode === "lost_and_found" && (
                  <div className="mt-4 grid gap-3">
                    <label className="grid gap-2"><span className="text-sm font-black text-nest-teal">Public item name</span><input className="input" value={form.publicItemName} onChange={(event) => update("publicItemName", event.target.value)} placeholder="Blue sports tote" /></label>
                    <label className="grid gap-2"><span className="text-sm font-black text-nest-teal">Public message</span><textarea className="input min-h-24" value={form.publicMessage} onChange={(event) => update("publicMessage", event.target.value)} placeholder="If found, please use the contact button to reach the owner." /></label>
                    <label className="flex items-center gap-3 rounded-2xl border border-nest-gold/14 bg-[#fbf6ea] px-4 py-3 text-sm font-black text-nest-teal"><input type="checkbox" checked={form.allowFinderContact} onChange={(event) => update("allowFinderContact", event.target.checked)} className="h-5 w-5 accent-[#075c58]" /> Allow finder contact request</label>
                    <label className="flex items-center gap-3 rounded-2xl border border-nest-gold/14 bg-[#fbf6ea] px-4 py-3 text-sm font-black text-nest-teal"><input type="checkbox" checked={form.allowFinderLocation} onChange={(event) => update("allowFinderLocation", event.target.checked)} className="h-5 w-5 accent-[#075c58]" /> Allow finder to share location details</label>
                    <label className="grid gap-2"><span className="text-sm font-black text-nest-teal">Lost status</span><select className="input" value={form.lostStatus} onChange={(event) => update("lostStatus", event.target.value as FormState["lostStatus"])}><option value="not_lost">Not lost</option><option value="lost">Currently lost</option><option value="recovered">Recovered</option></select></label>
                  </div>
                )}
              </section>

              <section className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <div className="flex items-start gap-3 text-amber-800"><ShieldAlert size={20} className="mt-1 shrink-0" /><div><h3 className="text-lg font-black">Privacy reminder</h3><p className="mt-2 text-sm font-semibold leading-6">Do not store passwords, financial information, security codes, or sensitive private information in label notes.</p></div></div>
              </section>

              <label className="flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-nest-gold/16 bg-white px-4 py-4 text-sm font-black text-nest-teal shadow-sm transition-all hover:border-nest-teal/30 hover:bg-nest-mint/15 hover:shadow-md"><input type="checkbox" checked={form.archived} onChange={(event) => update("archived", event.target.checked)} className="h-5 w-5 accent-[#075c58]" /> Archive this label in your dashboard</label>

              <div className="sticky bottom-3 z-10 rounded-[1.4rem] border border-nest-gold/18 bg-white/92 p-3 shadow-xl backdrop-blur">
                <button type="button" onClick={save} disabled={saving} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Save Smart Label</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SmartLabelsShell>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <label className="grid gap-2 rounded-[1.5rem] border border-nest-gold/16 bg-white p-4 shadow-sm"><span className="flex items-center gap-2 font-black text-nest-teal">{icon} {label}</span>{children}</label>;
}
