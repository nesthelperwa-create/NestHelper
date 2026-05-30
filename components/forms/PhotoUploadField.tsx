"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";

export type PhotoUpload = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

const MAX_PHOTOS = 4;
const MAX_ORIGINAL_SIZE = 8 * 1024 * 1024;
const TARGET_BYTES = 170 * 1024;

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read image"));
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

async function compressImage(file: File): Promise<PhotoUpload> {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image compression is not available in this browser");

  let maxDimension = 950;
  let quality = 0.72;
  let output = originalDataUrl;

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    output = canvas.toDataURL("image/jpeg", quality);

    if (estimateDataUrlBytes(output) <= TARGET_BYTES) break;
    maxDimension = Math.max(520, Math.round(maxDimension * 0.82));
    quality = Math.max(0.48, quality - 0.06);
  }

  return {
    name: file.name,
    type: "image/jpeg",
    size: estimateDataUrlBytes(output),
    dataUrl: output,
  };
}

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "compressed preview";
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function photoUploadSummary(photos: PhotoUpload[]) {
  return photos.length ? photos.map((photo) => `${photo.name} (${formatSize(photo.size)})`).join(", ") : "";
}

export function PhotoUploadField({
  photos,
  onChange,
  label = "Photos (optional)",
  description = "Add up to 4 optional photos. They are compressed before submission so NestHelper can review the scope in the admin dashboard.",
}: {
  photos: PhotoUpload[];
  onChange: (photos: PhotoUpload[]) => void;
  label?: string;
  description?: string;
}) {
  const [error, setError] = useState("");

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    setError("");
    if (!files.length) return;

    const openSlots = Math.max(0, MAX_PHOTOS - photos.length);
    const accepted = files
      .filter((file) => file.type.startsWith("image/") && file.size <= MAX_ORIGINAL_SIZE)
      .slice(0, openSlots);

    if (!accepted.length) {
      setError(`Please choose image files under ${MAX_ORIGINAL_SIZE / 1024 / 1024} MB. Up to ${MAX_PHOTOS} photos can be added.`);
      return;
    }

    try {
      const compressed = await Promise.all(accepted.map((file) => compressImage(file)));
      onChange([...photos, ...compressed].slice(0, MAX_PHOTOS));
    } catch (err) {
      console.error(err);
      setError("One of the photos could not be prepared. Try a different image or paste a photo link instead.");
    }
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="grid gap-3 rounded-[1.5rem] border border-nest-gold/15 bg-white/75 p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="label">{label}</div>
          <p className="mt-1 text-sm leading-6 text-nest-ink/64">{description}</p>
        </div>
        <label className="focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-nest-teal/20 bg-nest-mint/25 px-4 py-2 text-sm font-black text-nest-teal transition hover:-translate-y-0.5 hover:bg-nest-mint/45">
          <ImagePlus size={16} /> Upload photos
          <input type="file" accept="image/*" multiple className="sr-only" onChange={handleFiles} />
        </label>
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

      {photos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <div key={`${photo.name}-${index}`} className="overflow-hidden rounded-2xl border border-nest-gold/15 bg-nest-cream shadow-sm">
              <img src={photo.dataUrl} alt={`Uploaded preview ${index + 1}`} className="h-32 w-full object-cover" />
              <div className="grid gap-2 p-3">
                <p className="truncate text-xs font-black text-nest-teal" title={photo.name}>{photo.name}</p>
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-nest-ink/60">
                  <span>{formatSize(photo.size)}</span>
                  <button type="button" onClick={() => removePhoto(index)} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-black text-nest-teal shadow-sm hover:bg-nest-mint/35">
                    <X size={12} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-nest-cream px-4 py-3 text-sm font-semibold leading-6 text-nest-ink/64">
          Optional — useful for before photos, laundry piles, cluttered areas, entry/access notes, flooring, restrooms, or commercial walkthrough planning.
        </div>
      )}
    </div>
  );
}
