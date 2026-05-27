import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthInviteModal } from "../components/AuthInviteModal";
import { supabase } from "../lib/supabaseClient";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("receipto.language") : null;
    return saved === "en" ? "en" : "de";
  });

  const openAuthModal = useCallback(() => {
    try {
      const saved = window.localStorage.getItem("receipto.language");
      setLanguage(saved === "en" ? "en" : "de");
    } catch {
      setLanguage("de");
    }
    setOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setOpen(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      openAuthModal,
      closeAuthModal,
      authModalOpen: open,
    }),
    [open, openAuthModal, closeAuthModal]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthInviteModal open={open} onClose={closeAuthModal} language={language} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}
