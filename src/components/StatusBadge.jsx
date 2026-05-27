export function StatusBadge({ found, labels }) {
  if (found) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        {labels.receiptFound}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
      {labels.receiptMissing}
    </span>
  );
}
