"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { MAX_SHOWCASE_IMAGES } from "@/lib/showcases";

const emptyForm = {
  title: "",
  description: "",
  website_url: "",
  instagram_url: "",
  tiktok_url: "",
  linkedin_url: "",
};

function showcaseToForm(showcase) {
  return {
    title: showcase?.title ?? "",
    description: showcase?.description ?? "",
    website_url: showcase?.websiteUrl ?? "",
    instagram_url: showcase?.instagramUrl ?? "",
    tiktok_url: showcase?.tiktokUrl ?? "",
    linkedin_url: showcase?.linkedinUrl ?? "",
  };
}

export function ShowcaseFormModal({ mode = "create", showcase = null, onClose, onSaved }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(() => (isEdit ? showcaseToForm(showcase) : emptyForm));
  const [imageUrls, setImageUrls] = useState(() => (isEdit ? showcase?.imageUrls ?? [] : []));
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imageUrls.length >= MAX_SHOWCASE_IMAGES) {
      setError(`Maximal ${MAX_SHOWCASE_IMAGES} Bilder.`);
      return;
    }

    setUploading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/showcases/upload", { method: "POST", body });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Upload fehlgeschlagen.");
    } else {
      setImageUrls((current) => [...current, payload.image_url].slice(0, MAX_SHOWCASE_IMAGES));
    }
    setUploading(false);
    event.target.value = "";
  }

  function removeImage(index) {
    setImageUrls((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!imageUrls.length) {
      setError("Mindestens ein Bild ist Pflicht.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = { ...form, image_urls: imageUrls };
    const response = await fetch(isEdit ? `/api/showcases/${showcase.id}` : "/api/showcases", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Speichern fehlgeschlagen.");
    } else {
      onSaved(data.showcase);
      onClose();
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={onClose}>
      <form
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-slate-950">
            {isEdit ? "Showcase bearbeiten" : "Showcase posten"}
          </h2>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {error ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <div className="mt-5 space-y-4">
          <div>
            <span className="text-sm font-bold text-slate-700">
              Bilder ({imageUrls.length}/{MAX_SHOWCASE_IMAGES})
            </span>
            <p className="mt-1 text-xs text-slate-500">Das erste Bild ist das Hauptbild in der Übersicht.</p>
            {imageUrls.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {imageUrls.map((url, index) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                    <Image src={url} alt={`Bild ${index + 1}`} fill className="object-cover" unoptimized />
                    {index === 0 ? (
                      <span className="absolute left-1 top-1 rounded bg-founder-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Haupt
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-600 shadow"
                      aria-label="Bild entfernen"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {imageUrls.length < MAX_SHOWCASE_IMAGES ? (
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm font-bold text-slate-600">
                <Upload className="h-4 w-4" />
                {uploading ? "Wird hochgeladen…" : "Bild hinzufügen"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            ) : null}
          </div>

          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            placeholder="Titel"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
          <textarea
            className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            placeholder="Beschreibung (max. 150 Zeichen)"
            maxLength={150}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            required
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            placeholder="Website URL"
            value={form.website_url}
            onChange={(event) => setForm({ ...form, website_url: event.target.value })}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            placeholder="Instagram URL"
            value={form.instagram_url}
            onChange={(event) => setForm({ ...form, instagram_url: event.target.value })}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            placeholder="TikTok URL"
            value={form.tiktok_url}
            onChange={(event) => setForm({ ...form, tiktok_url: event.target.value })}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            placeholder="LinkedIn URL"
            value={form.linkedin_url}
            onChange={(event) => setForm({ ...form, linkedin_url: event.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !imageUrls.length}
          className="mt-6 w-full rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting ? "Wird gespeichert…" : isEdit ? "Änderungen speichern" : "Showcase veröffentlichen"}
        </button>
      </form>
    </div>
  );
}
