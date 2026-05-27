import { useEffect, useRef, useState } from "react";
import { t } from "../i18n";
import { supabase } from "../lib/supabaseClient";
import { extractInvoiceData } from "../utils/aiExtractor";
import { GMAIL_SCAN_DEMO_TRANSACTIONS } from "../utils/guestDemoData";
import { getSupportContactForVendor, textHasKnownProvider } from "../utils/supportDatabase";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const OAUTH_REDIRECT_URI = "https://receipto-drab.vercel.app";
const TOKEN_STORAGE_KEY = "receipto.gmailToken";
const LOOKBACK_DAYS = 30;
const INVOICE_KEYWORDS = [
  "Rechnung",
  "Invoice",
  "Receipt",
  "Quittung",
  "Beleg",
  "Abrechnung",
  "Order Confirmation",
  "Bestellbestätigung",
  "Zahlungsbeleg",
  "Tax Invoice",
];
const VENDOR_PATTERNS = [
  { regex: /amazon/i, vendor: "Amazon" },
  { regex: /adobe/i, vendor: "Adobe" },
  { regex: /apple/i, vendor: "Apple" },
  { regex: /google/i, vendor: "Google" },
  { regex: /microsoft/i, vendor: "Microsoft" },
  { regex: /stripe/i, vendor: "Stripe" },
  { regex: /paypal/i, vendor: "PayPal" },
  { regex: /linkedin/i, vendor: "LinkedIn" },
  { regex: /meta/i, vendor: "Meta" },
  { regex: /uber/i, vendor: "Uber" },
  { regex: /bolt/i, vendor: "Bolt" },
  { regex: /digitalocean/i, vendor: "DigitalOcean" },
  { regex: /hetzner/i, vendor: "Hetzner" },
  { regex: /canva/i, vendor: "Canva" },
  { regex: /ebay/i, vendor: "eBay" },
  { regex: /dhl/i, vendor: "DHL" },
  { regex: /notion/i, vendor: "Notion" },
  { regex: /slack/i, vendor: "Slack" },
  { regex: /openai|chatgpt/i, vendor: "OpenAI" },
  { regex: /aws|amazon web services/i, vendor: "AWS" },
  { regex: /github/i, vendor: "GitHub" },
  { regex: /gitlab/i, vendor: "GitLab" },
  { regex: /atlassian|jira|confluence/i, vendor: "Atlassian" },
  { regex: /dropbox/i, vendor: "Dropbox" },
  { regex: /shopify/i, vendor: "Shopify" },
  { regex: /booking/i, vendor: "Booking.com" },
  { regex: /airbnb/i, vendor: "Airbnb" },
  { regex: /wolt/i, vendor: "Wolt" },
  { regex: /lieferando/i, vendor: "Lieferando" },
];

function buildAfterDate(daysBack) {
  const now = new Date();
  now.setDate(now.getDate() - daysBack);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function decodeHeaderValue(headers, name) {
  const match = headers.find((header) => header.name.toLowerCase() === name.toLowerCase());
  return match?.value ?? "";
}

function parseVendor(fromHeader, snippet) {
  const haystack = `${fromHeader} ${snippet}`;
  const knownVendor = VENDOR_PATTERNS.find((entry) => entry.regex.test(haystack));
  if (knownVendor) {
    return knownVendor.vendor;
  }

  return "Unbekannt";
}

function hasInvoiceKeywordInHeader(subject, fromHeader) {
  const headerText = `${subject} ${fromHeader}`.toLowerCase();
  return INVOICE_KEYWORDS.some((keyword) => headerText.includes(keyword.toLowerCase()));
}

function decodeBase64Url(input) {
  if (!input) return "";
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  try {
    return window.atob(padded);
  } catch {
    return "";
  }
}

function extractBodyTextFromPayload(payload) {
  if (!payload) return "";

  const chunks = [];
  if (payload.body?.data) {
    chunks.push(decodeBase64Url(payload.body.data));
  }
  if (Array.isArray(payload.parts)) {
    payload.parts.forEach((part) => {
      chunks.push(extractBodyTextFromPayload(part));
    });
  }

  return chunks.join(" ");
}

function hasInvoiceKeywordInBody(payload) {
  const bodyText = extractBodyTextFromPayload(payload).toLowerCase();
  return INVOICE_KEYWORDS.some((keyword) => bodyText.includes(keyword.toLowerCase()));
}

function formatHeaderDate(dateHeader, language) {
  const date = new Date(dateHeader);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString(language === "en" ? "en-US" : "de-DE");
}

async function gmailFetch(path, accessToken) {
  try {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Gmail API Anfrage fehlgeschlagen. Bitte Gmail-Berechtigung erneut bestaetigen.");
    }

    return response.json();
  } catch (error) {
    throw new Error(error?.message || "Netzwerkfehler bei Gmail API. Bitte erneut versuchen.");
  }
}

export function useGmailLiveScan(language, options = {}) {
  const { onInvoiceInserted, onDemoTransactions } = options;
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(t(language, "scanReady"));
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [scanResults, setScanResults] = useState([]);
  const tokenRef = useRef(null);
  const tokenExpiryRef = useRef(0);

  useEffect(() => {
    if (!isScanning && progress === 0) {
      setStatusText(t(language, "scanReady"));
    }
  }, [language, isScanning, progress]);

  function readStoredToken() {
    try {
      const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.accessToken || !parsed?.expiresAt) return null;
      if (Date.now() >= Number(parsed.expiresAt)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function persistToken(accessToken, expiresInSeconds) {
    const expiresAt = Date.now() + Number(expiresInSeconds ?? 3600) * 1000 - 30_000;
    tokenRef.current = accessToken;
    tokenExpiryRef.current = expiresAt;
    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ accessToken, expiresAt }));
    } catch {
      /* ignore */
    }
  }

  function getValidAccessToken() {
    if (tokenRef.current && Date.now() < tokenExpiryRef.current) {
      return tokenRef.current;
    }
    const stored = readStoredToken();
    if (stored) {
      tokenRef.current = stored.accessToken;
      tokenExpiryRef.current = Number(stored.expiresAt);
      return stored.accessToken;
    }
    return null;
  }

  function startRedirectOAuth(clientId) {
    const state = "receipto_gmail_scan";
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: OAUTH_REDIRECT_URI,
      response_type: "token",
      scope: GMAIL_SCOPE,
      include_granted_scopes: "true",
      prompt: "consent",
      state,
    });
    window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  function buildDemoScanRows() {
    return GMAIL_SCAN_DEMO_TRANSACTIONS.map((transaction) => ({
      id: transaction.id,
      date: transaction.date,
      sender: `${transaction.vendor} <billing@example.com>`,
      subject: `Demo-Rechnung von ${transaction.vendor}`,
    }));
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  async function animateDemoProgress() {
    const steps = [15, 32, 48, 64, 82, 100];
    for (const step of steps) {
      await wait(400);
      setProgress(step);
    }
  }

  function resetLiveScanState() {
    tokenRef.current = null;
    tokenExpiryRef.current = 0;
    setProgress(0);
    setStatusText(t(language, "scanReady"));
    setIsScanning(false);
    setIsConnected(false);
    setErrorMessage("");
    setScanResults([]);
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem("receipto.gmailScanState");
      window.localStorage.removeItem("receipto.dashboardTransactions");
    } catch {
      /* ignore */
    }
  }

  async function activateDemoFallback(error) {
    console.warn("Gmail live scan failed, loading demo receipts instead:", error);
    const demoRows = [...GMAIL_SCAN_DEMO_TRANSACTIONS];
    setErrorMessage("");
    setIsConnected(false);
    setScanResults([]);
    await animateDemoProgress();
    setStatusText(t(language, "scanDemoFallback", { count: demoRows.length }));
    setScanResults(buildDemoScanRows());
    if (typeof onDemoTransactions === "function") {
      await Promise.resolve(onDemoTransactions(demoRows));
    }
  }

  async function startLiveScan(options = {}) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setErrorMessage(t(language, "oauthMissingClientId"));
      setStatusText(t(language, "scanFailed"));
      return;
    }

    try {
      setIsScanning(true);
      setErrorMessage("");
      setScanResults([]);
      if (typeof onDemoTransactions === "function") {
        await Promise.resolve(onDemoTransactions([]));
      }
      setProgress(0);
      setStatusText(t(language, "scanPrepareLogin"));
      let accessToken = options.accessToken || getValidAccessToken();
      if (options.accessToken) {
        persistToken(options.accessToken, options.expiresIn ?? 3600);
      }
      if (!accessToken) {
        setProgress(10);
        setStatusText(t(language, "scanOpenPopup"));
        startRedirectOAuth(clientId);
        return;
      }
      setIsConnected(true);

      setProgress(20);
      setStatusText(t(language, "scanMailbox"));
      const afterDate = buildAfterDate(LOOKBACK_DAYS);
      const query = `label:inbox after:${afterDate} (subject:Rechnung OR subject:Invoice OR subject:"Order Confirmation")`;
      const ids = [];
      let pageToken = "";
      do {
        const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
        const listData = await gmailFetch(
          `messages?q=${encodeURIComponent(query)}&maxResults=100${tokenParam}`,
          accessToken
        );
        ids.push(...(listData.messages ?? []).map((item) => item.id));
        pageToken = listData.nextPageToken ?? "";
      } while (pageToken);

      if (ids.length === 0) {
        setScanResults([]);
        setProgress(100);
        setStatusText(t(language, "scanNoResults"));
        return;
      }

      const displayRows = [];
      const total = ids.length;

      for (let index = 0; index < ids.length; index += 1) {
        const id = ids[index];
        setStatusText(t(language, "scanProcessing", { current: index + 1, total }));
        const message = await gmailFetch(
          `messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=Subject`,
          accessToken
        );
        const headers = message.payload?.headers ?? [];
        const from = decodeHeaderValue(headers, "From");
        const date = decodeHeaderValue(headers, "Date");
        const subject = decodeHeaderValue(headers, "Subject");
        const snippet = message.snippet ?? "";

        const rowDate = formatHeaderDate(date, language);
        displayRows.push({
          id,
          date: rowDate === "-" ? new Date().toLocaleDateString(language === "en" ? "en-US" : "de-DE") : rowDate,
          sender: from || "—",
          subject: subject || "—",
        });
        setScanResults([...displayRows]);

        let isInvoiceLike = hasInvoiceKeywordInHeader(subject, from);
        let fullMessage = null;

        if (!isInvoiceLike) {
          fullMessage = await gmailFetch(`messages/${id}?format=full`, accessToken);
          isInvoiceLike = hasInvoiceKeywordInBody(fullMessage.payload);
        }

        if (!isInvoiceLike) {
          const haystack = `${from} ${subject} ${snippet}`;
          if (textHasKnownProvider(haystack)) {
            const extractedVendor = parseVendor(from, `${subject} ${snippet}`);
            const support = getSupportContactForVendor(extractedVendor) ?? "";
            const extractedDate = formatHeaderDate(date, language);
            const normalizedDate =
              extractedDate === "-"
                ? new Date().toLocaleDateString(language === "en" ? "en-US" : "de-DE")
                : extractedDate;

            const insertMissing = {
              gmail_message_id: id,
              vendor: extractedVendor,
              amount: 0,
              currency: "EUR",
              date: normalizedDate,
              subject: subject || "(kein Betreff)",
              receipt_found: false,
              vat_receipt_missing: true,
              support_email: support,
              category: "Gmail Scan",
              is_pro_feature: true,
              ai_status: "no_receipt_support_lookup",
            };

            const { error: missErr } = await supabase.from("invoices").insert(insertMissing);
            const missDup =
              missErr &&
              (missErr.code === "23505" ||
                String(missErr.message).toLowerCase().includes("duplicate"));
            if (!missErr || missDup) {
              if (typeof onInvoiceInserted === "function") {
                await Promise.resolve(onInvoiceInserted());
              }
            }
          }

          const doneRatio = (index + 1) / total;
          setProgress(20 + Math.round(doneRatio * 80));
          continue;
        }

        const fullBodyText = fullMessage ? extractBodyTextFromPayload(fullMessage.payload) : "";
        const emailTextForAi = `From: ${from}\nSubject: ${subject}\n${snippet}\n${fullBodyText}`;
        const ai = extractInvoiceData(emailTextForAi);
        const extractedDate = formatHeaderDate(date, language);
        const extractedVendor =
          ai.vendor && ai.vendor.trim() !== ""
            ? ai.vendor
            : parseVendor(from, `${subject} ${snippet} ${fullBodyText}`);
        const normalizedAmount = ai.amount ?? 0;
        const normalizedCurrency = ai.currency ?? "EUR";
        const normalizedDate =
          extractedDate === "-"
            ? new Date().toLocaleDateString(language === "en" ? "en-US" : "de-DE")
            : extractedDate;

        const supportEmail = getSupportContactForVendor(extractedVendor) ?? "";

        const insertPayload = {
          gmail_message_id: id,
          vendor: extractedVendor,
          amount: normalizedAmount,
          currency: normalizedCurrency,
          date: normalizedDate,
          subject: subject || "(kein Betreff)",
          receipt_found: true,
          vat_receipt_missing: false,
          support_email: supportEmail,
          category: "Gmail Scan",
          is_pro_feature: true,
          ai_status: "regex_extracted",
        };

        const { error: insertError } = await supabase.from("invoices").insert(insertPayload);
        const isDuplicate =
          insertError &&
          (insertError.code === "23505" ||
            String(insertError.message).toLowerCase().includes("duplicate"));

        if (insertError && !isDuplicate) {
          setErrorMessage(insertError.message || t(language, "scanFailed"));
          const doneRatio = (index + 1) / total;
          setProgress(20 + Math.round(doneRatio * 80));
          continue;
        }

        if (!insertError || isDuplicate) {
          if (typeof onInvoiceInserted === "function") {
            await Promise.resolve(onInvoiceInserted());
          }
        }

        const doneRatio = (index + 1) / total;
        setProgress(20 + Math.round(doneRatio * 80));
      }

      setScanResults(displayRows);
      setStatusText(t(language, "scanDone", { count: displayRows.length }));
    } catch (error) {
      await activateDemoFallback(error);
    } finally {
      setIsScanning(false);
    }
  }

  return {
    isScanning,
    progress,
    statusText,
    errorMessage,
    isConnected,
    scanResults,
    startLiveScan,
    resetLiveScanState,
  };
}
