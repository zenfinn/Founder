export function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-founder-600 font-serif text-2xl font-bold text-white">
        F
      </div>
      {!compact && (
        <div>
          <p className="font-serif text-xl font-bold leading-none text-slate-950">Founder</p>
        </div>
      )}
    </div>
  );
}
