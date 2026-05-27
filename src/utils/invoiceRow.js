import { getSupportContactForVendor } from "./supportDatabase";

/** Maps a Supabase `invoices` row (snake_case or camelCase) to dashboard transaction shape. */
export function mapInvoiceRow(row) {
  if (!row) {
    return {
      id: "",
      vendor: "",
      date: "",
      category: "General",
      amount: 0,
      currency: "EUR",
      receiptFound: false,
      vatReceiptMissing: false,
      supportEmail: "",
      isProFeature: false,
      aiStatus: "",
    };
  }


  const receiptFound = row.receipt_found ?? row.receiptFound ?? false;
  const vatReceiptMissing = row.vat_receipt_missing ?? row.vatReceiptMissing ?? false;
  let supportEmail = row.support_email ?? row.supportEmail ?? "";
  const receiptPath = row.receipt_path ?? row.receiptPath ?? row.storage_path ?? row.storagePath ?? row.file_path ?? "";
  const receiptBucket = row.receipt_bucket ?? row.receiptBucket ?? "";
  if (!supportEmail && (!receiptFound || vatReceiptMissing)) {
    const guessed = getSupportContactForVendor(row.vendor ?? "");
    if (guessed) supportEmail = guessed;
  }

  return {
    id: String(row.id ?? row.gmail_message_id ?? ""),
    vendor: row.vendor ?? "",
    date: row.date ?? "",
    category: row.category ?? "General",
    amount: Number(row.amount ?? 0),
    currency: row.currency ?? "EUR",
    receiptFound,
    vatReceiptMissing,
    supportEmail,
    receiptPath,
    receiptBucket,
    isProFeature: row.is_pro_feature ?? row.isProFeature ?? false,
    aiStatus: row.ai_status ?? row.aiStatus ?? "",
  };
}
