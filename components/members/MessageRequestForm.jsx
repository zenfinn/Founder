"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

export function MessageRequestForm({ recipientId, recipientName, pendingRequest = null, onSent }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(pendingRequest ? "pending" : "idle");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/message-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, message: message.trim() }),
      });

      const payload = await response.json();
      if (!response.ok) {
        if (payload.conversationId) {
          window.location.href = `/inbox?chat=${payload.conversationId}`;
          return;
        }
        throw new Error(payload.error ?? "Anfrage konnte nicht gesendet werden.");
      }

      setStatus("pending");
      setMessage("");
      onSent?.();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "pending") {
    return (
      <div className="rounded-2xl bg-emerald-50 px-5 py-4">
        <p className="text-sm font-bold text-emerald-800">Nachrichtenanfrage gesendet</p>
        <p className="mt-1 text-sm leading-6 text-emerald-700">
          {recipientName} wurde benachrichtigt. Du hörst in der Inbox Bescheid, sobald die Anfrage angenommen wird.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-founder-600" />
        <h2 className="font-serif text-2xl font-bold text-slate-950">Nachrichtenanfrage</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Schick {recipientName} eine kurze Anfrage. Kein Spam – eine offene Anfrage pro Person.
      </p>

      <label className="mt-4 block">
        <span className="text-sm font-bold text-slate-700">Deine Nachricht</span>
        <textarea
          className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium"
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, 500))}
          placeholder="Hey, ich würde gern über dein Setup sprechen..."
          maxLength={500}
          required
        />
        <span className="mt-1 block text-right text-xs font-semibold text-slate-400">{message.length}/500</span>
      </label>

      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !message.trim()}
        className="mt-4 w-full rounded-2xl bg-founder-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Wird gesendet..." : "Anfrage senden"}
      </button>
    </form>
  );
}
