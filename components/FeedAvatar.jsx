import { getProfileInitial } from "@/lib/profiles";

export function FeedAvatar({ name, avatarUrl, size = 44 }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || getProfileInitial({ display_name: name });

  if (avatarUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl.trim()}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-2xl object-cover ring-2 ring-white"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl bg-founder-600 font-serif font-bold text-white ring-2 ring-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
