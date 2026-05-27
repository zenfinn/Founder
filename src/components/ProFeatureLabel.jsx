import { Sparkles } from "lucide-react";
import { t } from "../i18n";

export function ProFeatureLabel({ language, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ${className}`}
      title={t(language, "proFeatureHint")}
    >
      <Sparkles className="h-3 w-3" aria-hidden />
      Pro
    </span>
  );
}
