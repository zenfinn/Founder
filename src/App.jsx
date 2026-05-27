import { useCallback, useEffect, useMemo, useState } from "react";
import { t } from "./i18n";
import { Sidebar } from "./components/Sidebar";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { SupportRequestModal } from "./components/SupportRequestModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthModalProvider, useAuthModal } from "./context/AuthModalContext";
import { SubscriptionProvider, useSubscription } from "./context/SubscriptionContext";
import { supabase } from "./lib/supabaseClient";
import { mapInvoiceRow } from "./utils/invoiceRow";
import { GUEST_DEMO_TRANSACTIONS } from "./utils/guestDemoData";
import { useGmailLiveScan } from "./hooks/useGmailLiveScan";
import { DashboardPage } from "./pages/DashboardPage";
import { EmailSyncPage } from "./pages/EmailSyncPage";
import { ReceiptArchivePage } from "./pages/ReceiptArchivePage";
import { AIAssistantPage } from "./pages/AIAssistantPage";

const VALID_VIEWS = new Set(["dashboard", "ai-assistant", "receipt-archive", "email-sync"]);

const detectedEmails = [
  {
    id: "e1",
    subject: "Ihre Rechnung von Amazon",
    sender: "billing@amazon.de",
    detectedDate: "18.04.2026",
    detectedAmount: 129.9,
  },
  {
    id: "e2",
    subject: "Adobe Creative Cloud Invoice",
    sender: "no-reply@adobe.com",
    detectedDate: "16.04.2026",
    detectedAmount: 59.49,
  },
  {
    id: "e3",
    subject: "Google Ads Payment Receipt",
    sender: "ads-noreply@google.com",
    detectedDate: "14.04.2026",
    detectedAmount: 420.0,
  },
  {
    id: "e4",
    subject: "Notion Subscription Confirmation",
    sender: "team@makenotion.com",
    detectedDate: "12.04.2026",
    detectedAmount: 15.0,
  },
];

function AppShell() {
  const { user, loading, profile, trialDaysRemaining } = useSubscription();
  const { openAuthModal } = useAuthModal();

  const [activeView, setActiveView] = useState(() => {
    try {
      const saved = window.localStorage?.getItem?.("receipto.activeView");
      return saved && VALID_VIEWS.has(saved) ? saved : "dashboard";
    } catch {
      return "dashboard";
    }
  });

  const [language, setLanguage] = useState(() => {
    try {
      const saved = window.localStorage.getItem("receipto.language");
      return saved === "de" || saved === "en" ? saved : "de";
    } catch {
      return "de";
    }
  });

  const [transactions, setTransactions] = useState([]);
  const [requestTarget, setRequestTarget] = useState(null);

  const loadInvoices = useCallback(async () => {
    const { data, error } = await supabase.from("invoices").select("*");
    if (error) {
      console.error("Supabase invoices select:", error.message);
      return;
    }
    const rows = (data ?? []).map(mapInvoiceRow);
    if (rows.length > 0) {
      setTransactions(rows);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("receipto.language", language);
    } catch {
      /* ignore */
    }
  }, [language]);

  useEffect(() => {
    if (!VALID_VIEWS.has(activeView)) {
      setActiveView("dashboard");
    }
  }, [activeView]);

  useEffect(() => {
    try {
      if (VALID_VIEWS.has(activeView)) {
        window.localStorage.setItem("receipto.activeView", activeView);
      }
    } catch {
      /* ignore */
    }
  }, [activeView]);

  useEffect(() => {
    if (!user) {
      setTransactions(GUEST_DEMO_TRANSACTIONS);
      return;
    }
    setTransactions([]);
  }, [user]);

  const liveScan = useGmailLiveScan(language, {
    onInvoiceInserted: async () => {
      await loadInvoices();
    },
    onDemoTransactions: (demoRows) => {
      setTransactions(demoRows);
    },
  });

  const planBadge = useMemo(() => {
    if (!user) {
      return { variant: "basic", label: t(language, "planBadgeBasic") };
    }
    if (profile?.plan === "pro") {
      return { variant: "pro", label: "Pro" };
    }
    if (trialDaysRemaining !== null) {
      return { variant: "trial", label: t(language, "planBadgeTrial", { days: trialDaysRemaining }) };
    }
    return { variant: "basic", label: t(language, "planBadgeBasic") };
  }, [user, profile, trialDaysRemaining, language]);

  const handleOutreachMailSent = useCallback(
    async (transaction) => {
      if (!transaction?.id) return;

      setTransactions((prev) =>
        prev.map((item) => (item.id === transaction.id ? { ...item, aiStatus: "request_sent" } : item))
      );

      if (user) {
        const { error } = await supabase.from("invoices").update({ ai_status: "request_sent" }).eq("id", transaction.id);
        if (error) {
          console.error("Outreach status update failed:", error.message);
        }
      }

      setRequestTarget(null);
    },
    [user]
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "100vh",
          margin: 0,
          paddingTop: "50px",
          backgroundColor: "#f8fafc",
          color: "#334155",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Lade Receipto…
      </div>
    );
  }

  const foundReceipts = transactions.filter((item) => item.receiptFound);

  async function handleLogout() {
    liveScan.resetLiveScanState();
    setTransactions([]);
    setRequestTarget(null);
    await supabase.auth.signOut();
  }

  const topBarAuth = {
    user,
    onSignIn: openAuthModal,
    onLogout: user ? handleLogout : undefined,
    planBadge,
  };

  const resolvedView = VALID_VIEWS.has(activeView) ? activeView : "dashboard";

  let mainContent;
  if (resolvedView === "dashboard") {
    mainContent = (
      <DashboardPage
        viewMode={resolvedView}
        language={language}
        onLanguageChange={setLanguage}
        onRequestReceipt={setRequestTarget}
        topBarAuth={topBarAuth}
        transactions={transactions}
        liveScan={liveScan}
      />
    );
  } else if (resolvedView === "ai-assistant") {
    mainContent = (
      <AIAssistantPage
        language={language}
        onLanguageChange={setLanguage}
        onRequestReceipt={setRequestTarget}
        topBarAuth={topBarAuth}
        transactions={transactions}
      />
    );
  } else if (resolvedView === "receipt-archive") {
    mainContent = (
      <ReceiptArchivePage
        language={language}
        onLanguageChange={setLanguage}
        receipts={foundReceipts}
        allTransactions={transactions}
        topBarAuth={topBarAuth}
      />
    );
  } else if (resolvedView === "email-sync") {
    mainContent = (
      <EmailSyncPage
        language={language}
        onLanguageChange={setLanguage}
        emails={detectedEmails}
        topBarAuth={topBarAuth}
      />
    );
  } else {
    mainContent = (
      <DashboardPage
        viewMode="dashboard"
        language={language}
        onLanguageChange={setLanguage}
        onRequestReceipt={setRequestTarget}
        topBarAuth={topBarAuth}
        transactions={transactions}
        liveScan={liveScan}
      />
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <Sidebar activeView={resolvedView} onChangeView={setActiveView} language={language} />

          <SubscriptionGuard language={language}>
            <div className="min-w-0 flex-1">{mainContent}</div>
          </SubscriptionGuard>
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white py-4">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 text-sm text-slate-600">
            <a href="/privacy" className="font-medium text-slate-700 underline-offset-4 hover:text-brand-600 hover:underline">
              Datenschutz
            </a>
            <a href="/terms" className="font-medium text-slate-700 underline-offset-4 hover:text-brand-600 hover:underline">
              AGB
            </a>
          </div>
        </footer>
      </div>

      <SupportRequestModal
        language={language}
        transaction={requestTarget}
        onClose={() => setRequestTarget(null)}
        onMailSent={handleOutreachMailSent}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SubscriptionProvider>
        <AuthModalProvider>
          <AppShell />
        </AuthModalProvider>
      </SubscriptionProvider>
    </ErrorBoundary>
  );
}
