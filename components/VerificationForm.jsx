"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { verificationDocuments } from "@/lib/rank-system";

export function VerificationForm() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [userId, setUserId] = useState("");
  const [rank, setRank] = useState("starter");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const requirements = verificationDocuments[rank] ?? [];

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUserId(data.session.user.id);

      const { data: request } = await supabase
        .from("verification_requests")
        .select("status,rejection_reason,assigned_rank,requested_rank,submitted_at")
        .eq("user_id", data.session.user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setVerificationStatus(request);
    }

    loadSession();
  }, [router, supabase]);

  function handleFileChange(type, fileList) {
    setFiles((current) => ({ ...current, [type]: fileList?.[0] ?? null }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!userId) {
      setMessage("Bitte logge dich erneut ein.");
      return;
    }

    const missing = requirements.find((requirement) => !files[requirement.type]);
    if (missing) {
      setMessage(`Bitte lade folgendes Dokument hoch: ${missing.label}`);
      return;
    }

    setLoading(true);

    const { data: request, error: requestError } = await supabase
      .from("verification_requests")
      .insert({ user_id: userId, requested_rank: rank, status: "pending" })
      .select("id")
      .single();

    if (requestError) {
      setMessage(requestError.message);
      setLoading(false);
      return;
    }

    for (const requirement of requirements) {
      const file = files[requirement.type];
      const storagePath = `${userId}/${request.id}/${requirement.type}-${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("founder-verification-documents")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        setMessage(uploadError.message);
        setLoading(false);
        return;
      }

      const { error: documentError } = await supabase.from("verification_documents").insert({
        verification_request_id: request.id,
        document_type: requirement.type,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
      });

      if (documentError) {
        setMessage(documentError.message);
        setLoading(false);
        return;
      }
    }

    await fetch("/api/verification/notify-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verification_request_id: request.id, requested_rank: rank }),
    });

    setMessage("Deine Verifikation wurde eingereicht. Ziel: Admin-Pruefung innerhalb von 24 Stunden.");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-6 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-950">Verifikationsstatus</p>
        <p className="mt-2 text-sm font-semibold text-founder-600">
          {verificationStatus?.status === "approved"
            ? "Bestätigt"
            : verificationStatus?.status === "rejected"
              ? "Abgelehnt"
              : verificationStatus?.status === "pending"
                ? "Ausstehend"
                : "Noch nicht eingereicht"}
        </p>
        {verificationStatus?.rejection_reason && (
          <p className="mt-2 text-sm leading-6 text-red-700">Ablehnungsgrund: {verificationStatus.rejection_reason}</p>
        )}
      </div>
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Gewünschter Rang</span>
        <select
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold outline-none focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
          value={rank}
          onChange={(event) => {
            setRank(event.target.value);
            setFiles({});
          }}
        >
          <option value="starter">Starter</option>
          <option value="builder">Builder</option>
          <option value="scaler">Scaler</option>
          <option value="elite">Elite</option>
        </select>
      </label>

      <div className="mt-6 space-y-4">
        {requirements.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Für diesen Rang ist kein Dokument nötig.</p>
        ) : (
          requirements.map((requirement) => (
            <label key={requirement.type} className="block rounded-2xl bg-slate-50 p-4">
              <span className="text-sm font-bold text-slate-800">{requirement.label}</span>
              <input
                className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-founder-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(event) => handleFileChange(requirement.type, event.target.files)}
                required
              />
            </label>
          ))
        )}
      </div>

      {message && <p className="mt-5 rounded-2xl bg-founder-50 px-4 py-3 text-sm font-semibold text-founder-800">{message}</p>}

      <button
        className="mt-6 w-full rounded-2xl bg-founder-600 px-5 py-3 text-base font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Wird hochgeladen..." : "Verifikation einreichen"}
      </button>
    </form>
  );
}
