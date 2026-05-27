import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { t } from "../i18n";

export function AuthInviteModal({ open, onClose, language }) {
  const [step, setStep] = useState("choice");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  if (!open) {
    return null;
  }

  const redirectTo = "https://receipto-drab.vercel.app";

  function resetAndClose() {
    setStep("choice");
    setEmail("");
    setInfo("");
    onClose();
  }

  async function handleGoogle() {
    setBusy(true);
    setInfo("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/gmail.readonly",
          queryParams: {
            prompt: "consent",
            access_type: "offline",
          },
        },
      });
      if (error) setInfo(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setInfo("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setInfo(error.message);
        return;
      }
      setInfo(t(language, "authInviteEmailSent"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-10 shadow-2xl">
        <button
          type="button"
          onClick={resetAndClose}
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {step === "choice" ? (
          <>
            <h2 className="pr-10 text-xl font-semibold tracking-tight text-slate-900">{t(language, "authInviteTitle")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{t(language, "authInviteBody")}</p>

            <div className="mt-10 flex flex-col gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogle}
                className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                {t(language, "authInviteGoogle")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep("email")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
              >
                {t(language, "authInviteEmail")}
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setStep("choice");
                setInfo("");
              }}
              className="mb-4 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
            >
              {t(language, "authInviteBack")}
            </button>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">{t(language, "authInviteEmailTitle")}</h2>
            <p className="mt-2 text-sm text-slate-600">{t(language, "authInviteEmailHint")}</p>
            <form onSubmit={handleMagicLink} className="mt-6 space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder={t(language, "authInviteEmailPlaceholder")}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-slate-200 transition focus:border-slate-400 focus:ring-2"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {t(language, "authInviteSendLink")}
              </button>
            </form>
          </>
        )}

        {info ? <p className="mt-6 text-center text-xs text-slate-600">{info}</p> : null}
      </div>
    </div>
  );
}
