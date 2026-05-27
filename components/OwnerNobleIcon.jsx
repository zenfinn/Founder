import { ShieldCheck } from "lucide-react";

export function OwnerNobleIcon({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border border-white bg-white p-0.5 shadow-md ring-1 ring-amber-300/70 ${className}`}
      title="Founder Owner"
    >
      <ShieldCheck className="h-3 w-3 text-amber-600" strokeWidth={2.25} />
    </span>
  );
}
