"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AdminVerificationQueue() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [adminId, setAdminId] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("verification_requests")
      .select("id,user_id,requested_rank,status,submitted_at,rejection_reason,verification_documents(id,document_type,file_name,storage_path)")
      .order("submitted_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setRequests(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setAdminId(data.session.user.id);
      await loadRequests();
    }

    boot();
  }, [loadRequests, router, supabase]);

  async function approveRequest(request) {
    setMessage("");
    const nextReviewDueAt = new Date();
    nextReviewDueAt.setFullYear(nextReviewDueAt.getFullYear() + 1);

    const { error: requestError } = await supabase
      .from("verification_requests")
      .update({
        status: "approved",
        assigned_rank: request.requested_rank,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        next_review_due_at: nextReviewDueAt.toISOString(),
      })
      .eq("id", request.id);

    if (requestError) {
      setMessage(requestError.message);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ current_rank: request.requested_rank, updated_at: new Date().toISOString() })
      .eq("id", request.user_id);

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    await supabase.from("admin_action_logs").insert({
      admin_user_id: adminId,
      target_user_id: request.user_id,
      action: "verification.approved",
      metadata: { verification_request_id: request.id, assigned_rank: request.requested_rank },
    });

    await fetch("/api/verification/notify-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: request.user_id, status: "approved", rank: request.requested_rank }),
    });

    await loadRequests();
    setMessage("Verifikation genehmigt, Rang gesetzt und User benachrichtigt.");
  }

  async function rejectRequest(request) {
    const rejectionReason = window.prompt("Ablehnungsgrund fuer den User:");
    if (!rejectionReason) return;

    const { error } = await supabase
      .from("verification_requests")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq("id", request.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await supabase.from("admin_action_logs").insert({
      admin_user_id: adminId,
      target_user_id: request.user_id,
      action: "verification.rejected",
      metadata: { verification_request_id: request.id, rejection_reason: rejectionReason },
    });

    await fetch("/api/verification/notify-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: request.user_id, status: "rejected", reason: rejectionReason }),
    });

    await loadRequests();
    setMessage("Verifikation abgelehnt und User benachrichtigt.");
  }

  if (loading) {
    return <p className="mt-8 rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600">Verifikationen werden geladen...</p>;
  }

  return (
    <section className="mt-8 space-y-4">
      {message && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</p>}
      {requests.length === 0 && (
        <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600">
          Keine Verifikationsanfragen gefunden.
        </p>
      )}
      {requests.map((request) => (
        <article key={request.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-founder-600">{request.status}</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-slate-950">{request.requested_rank}</h2>
              <p className="mt-1 text-sm text-slate-600">User ID: {request.user_id}</p>
              <p className="text-sm text-slate-600">Eingereicht: {new Date(request.submitted_at).toLocaleString("de-DE")}</p>
            </div>
            {request.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => approveRequest(request)}
                  className="rounded-full bg-founder-600 px-4 py-2 text-sm font-bold text-white"
                  type="button"
                >
                  Genehmigen
                </button>
                <button
                  onClick={() => rejectRequest(request)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                  type="button"
                >
                  Ablehnen
                </button>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(request.verification_documents ?? []).map((document) => (
              <span key={document.id} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                {document.document_type}: {document.file_name}
              </span>
            ))}
          </div>
          {request.rejection_reason && <p className="mt-4 text-sm font-semibold text-red-700">{request.rejection_reason}</p>}
        </article>
      ))}
    </section>
  );
}
