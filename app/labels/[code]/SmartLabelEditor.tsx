"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, Home, ImagePlus, KeyRound, Loader2, LockKeyhole, MapPin, PackageOpen, PencilLine, ShieldCheck, Trash2 } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";
import type { SmartLabelPhoto, SmartLabelPublicPayload } from "@/lib/smartLabels";

type SmartLabelFormState = {
  labelName: string;
  locationName: string;
  itemsInside: string;
  notes: string;
  photos: SmartLabelPhoto[];
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
  const [label, setLabel] = useState<SmartLabelPublicPayload | null>(null);
  const [form, setForm] = useState<SmartLabelFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [removePin, setRemovePin] = useState(false);

  function syncLabel(nextLabel: SmartLabelPublicPayload) {
    setLabel(nextLabel);
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

  useEffect(() => {
    let active = true;
    async function loadLabel() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/smart-labels/${encodeURIComponent(safeCode)}`, { cache: "no-store" });
        const result = await response.json().catch(() => null);
        if (!active) return;
        if (!response.ok || !result?.ok) throw new Error(getErrorMessage(result, "This label could not be loaded."));
        syncLabel(result.label);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "This label could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadLabel();
    return () => {
      active = false;
    };
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
      syncLabel(result.label);
      setMessage("Label unlocked. You can update it now.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That PIN did not work.");
    } finally {
      setSaving(false);
    }
  }

  async function saveLabel() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        currentPin,
        newPin: newPin.trim(),
        removePin,
      };
      const response = await fetch(`/api/smart-labels/${encodeURIComponent(safeCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(getErrorMessage(result, "Unable to save this label."));
      syncLabel(result.label);
      if (newPin.trim()) setCurrentPin(newPin.trim());
      if (removePin) setCurrentPin("");
      setNewPin("");
      setRemovePin(false);
      setMessage("Saved. This label is updated for your family.");
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
    } catch (err) {
      console.error(err);
      setError("One photo could not be added. Try a smaller image.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function removePhoto(photoId: string) {
    update("photos", form.photos.filter((photo) => photo.id !== photoId));
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbf6ea] px-4 py-10 text-[#075c58]">
        <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-4 font-black shadow-soft"><Loader2 className="animate-spin" size={20} /> Loading Smart Label...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf6ea] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-nest-gold/18 bg-white shadow-soft">
        <div className="bg-gradient-to-br from-white via-nest-cream to-nest-mint/28 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Image src={siteConfig.assets.logo} alt="NestHelper" width={190} height={64} className="h-auto w-40" priority />
            </div>
            <div className="rounded-2xl border border-nest-gold/20 bg-white/76 px-4 py-3 text-center shadow-sm">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-nest-gold">Smart Label</p>
              <p className="font-mono text-2xl font-black text-nest-teal">{safeCode}</p>
            </div>
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-white/70 bg-white/74 p-4">
            <h1 className="text-2xl font-black text-nest-teal sm:text-3xl">Scan. Organize. Reset.</h1>
            <p className="mt-2 font-semibold leading-7 text-nest-ink/70">
              This customer-owned label can be updated by the family after setup. NestHelper can help during a reset, but the information stays with the sticker you keep.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-nest-teal">
              <span className="rounded-full bg-nest-mint/35 px-3 py-1">No PIN by default</span>
              <span className="rounded-full bg-nest-mint/35 px-3 py-1">Optional 4-digit PIN</span>
              <span className="rounded-full bg-nest-mint/35 px-3 py-1">{label ? formatUpdatedDate(label.updatedAtIso || label.createdAtIso) : "Ready"}</span>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700">{error}</div>}
          {message && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-700">{message}</div>}

          {!label ? (
            <div className="rounded-3xl border border-nest-gold/16 bg-nest-cream p-6 text-center font-bold text-nest-ink/70">Label not found.</div>
          ) : label.locked ? (
            <div className="rounded-[1.8rem] border border-nest-gold/20 bg-nest-cream p-5 sm:p-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-nest-teal shadow-sm"><LockKeyhole size={26} /></div>
              <h2 className="mt-4 text-center text-2xl font-black text-nest-teal">This label is PIN protected.</h2>
              <p className="mx-auto mt-2 max-w-lg text-center font-semibold leading-7 text-nest-ink/70">Enter the family&apos;s 4-digit PIN to view or update the label details.</p>
              <div className="mx-auto mt-5 grid max-w-sm gap-3">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  className="input text-center font-mono text-2xl tracking-[0.4em]"
                  placeholder="0000"
                  value={currentPin}
                  onChange={(event) => setCurrentPin(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                />
                <button type="button" onClick={unlockLabel} disabled={saving || currentPin.length !== 4} className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />} Unlock label
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              <SmartInput icon={<PencilLine size={18} />} label="Label name" placeholder="Winter clothes, Kids toys, Garage tools..." value={form.labelName} onChange={(value) => update("labelName", value)} />
              <SmartInput icon={<MapPin size={18} />} label="Location" placeholder="Garage — top shelf, hallway closet, pantry left side..." value={form.locationName} onChange={(value) => update("locationName", value)} />
              <SmartTextArea icon={<PackageOpen size={18} />} label="Items inside" placeholder="Coats, scarves, gloves, hats, snow pants..." value={form.itemsInside} onChange={(value) => update("itemsInside", value)} rows={5} />
              <SmartTextArea icon={<Home size={18} />} label="Notes" placeholder="Use during winter months. Keep away from moisture. Donate next reset if not used..." value={form.notes} onChange={(value) => update("notes", value)} rows={4} />

              <div className="rounded-[1.5rem] border border-nest-gold/16 bg-nest-cream/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-black text-nest-teal"><Camera size={18} /> Photos</div>
                    <p className="mt-1 text-sm font-semibold leading-6 text-nest-ink/64">Optional. Add up to {maxPhotos} small photos to help remember what is inside.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-nest-teal/20 bg-white px-4 py-2 text-sm font-black text-nest-teal shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    {photoBusy ? <Loader2 className="animate-spin" size={16} /> : <ImagePlus size={16} />} Add photos
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoUpload} />
                  </label>
                </div>
                {form.photos.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {form.photos.map((photo) => (
                      <div key={photo.id} className="overflow-hidden rounded-2xl border border-nest-gold/16 bg-white shadow-sm">
                        <img src={photo.dataUrl} alt={photo.name} className="h-44 w-full object-cover" />
                        <div className="flex items-center justify-between gap-2 p-3">
                          <p className="truncate text-xs font-black text-nest-teal">{photo.name}</p>
                          <button type="button" onClick={() => removePhoto(photo.id)} className="rounded-full bg-nest-cream p-2 text-nest-teal transition hover:bg-red-50 hover:text-red-700" aria-label="Remove photo">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-nest-gold/16 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-nest-mint/35 p-3 text-nest-teal"><ShieldCheck size={20} /></div>
                  <div>
                    <h2 className="text-xl font-black text-nest-teal">Optional privacy PIN</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-nest-ink/64">Default is OFF / no PIN. Add a 4-digit PIN when the label includes private notes or photos.</p>
                  </div>
                </div>

                {label.pinEnabled && (
                  <label className="mt-4 grid gap-2">
                    <span className="label">Current PIN required to save</span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      className="input max-w-xs font-mono tracking-[0.25em]"
                      placeholder="0000"
                      value={currentPin}
                      onChange={(event) => setCurrentPin(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                    />
                  </label>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="label">Add or change PIN</span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      className="input font-mono tracking-[0.25em]"
                      placeholder="Leave blank to keep current setting"
                      value={newPin}
                      onChange={(event) => setNewPin(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                    />
                  </label>
                  {label.pinEnabled && (
                    <label className="flex items-center gap-3 rounded-2xl border border-nest-gold/14 bg-nest-cream px-4 py-3 text-sm font-black text-nest-teal">
                      <input type="checkbox" checked={removePin} onChange={(event) => setRemovePin(event.target.checked)} className="h-5 w-5 accent-[#075c58]" />
                      Turn PIN off after save
                    </label>
                  )}
                </div>
              </div>

              <div className="sticky bottom-3 z-10 rounded-[1.4rem] border border-nest-gold/18 bg-white/92 p-3 shadow-xl backdrop-blur">
                <button type="button" onClick={saveLabel} disabled={saving} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Save Smart Label
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto mt-5 max-w-3xl rounded-[1.5rem] border border-nest-gold/16 bg-white/80 p-4 text-center text-xs font-bold leading-5 text-nest-ink/58 shadow-sm">
        Need help with this label? Contact NestHelper at <a href={`mailto:${siteConfig.email}`} className="text-nest-teal underline">{siteConfig.email}</a>. Do not store emergency, medical, financial, or password information here.
      </section>
    </main>
  );
}

function SmartInput({ icon, label, placeholder, value, onChange }: { icon: React.ReactNode; label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 rounded-[1.5rem] border border-nest-gold/16 bg-white p-4 shadow-sm">
      <span className="flex items-center gap-2 font-black text-nest-teal">{icon} {label}</span>
      <input className="input" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SmartTextArea({ icon, label, placeholder, value, onChange, rows }: { icon: React.ReactNode; label: string; placeholder: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <label className="grid gap-2 rounded-[1.5rem] border border-nest-gold/16 bg-white p-4 shadow-sm">
      <span className="flex items-center gap-2 font-black text-nest-teal">{icon} {label}</span>
      <textarea className="input min-h-28" rows={rows} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
