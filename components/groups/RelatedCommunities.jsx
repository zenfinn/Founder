import Link from "next/link";
import { communityChannels } from "@/lib/founder-data";
import { isProLoungeCommunity } from "@/lib/communities";

export function RelatedCommunities({ currentSlug, limit = 4 }) {
  const related = communityChannels
    .filter((channel) => !isProLoungeCommunity(channel) && channel.slug !== currentSlug)
    .slice(0, limit);

  if (related.length === 0) return null;

  return (
    <aside className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6">
      <h2 className="font-serif text-xl font-bold text-slate-950">Verwandte Communities</h2>
      <p className="mt-1 text-sm text-slate-600">Weitere Branchen im Unternehmer Netzwerk Founder.</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {related.map((community) => (
          <li key={community.slug}>
            <Link
              href="/community"
              className="block rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-founder-200 hover:bg-founder-50 hover:text-founder-700"
            >
              {community.name}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
