"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { groupMentors, communityChannels } from "@/lib/founder-data";

const priceFilters = [
  { label: "Alle", max: Infinity },
  { label: "bis 150 EUR", max: 15000 },
  { label: "bis 200 EUR", max: 20000 },
];

function Stars({ rating }) {
  return <span className="text-sm font-bold text-amber-600">{"★".repeat(Math.round(rating))} {rating.toFixed(1)}</span>;
}

export function MentorsList() {
  const [industry, setIndustry] = useState("Alle");
  const [price, setPrice] = useState("Alle");

  const groups = ["Alle", ...communityChannels.filter((group) => !group.requires_founder_pro).map((group) => group.name)];

  const mentors = useMemo(() => {
    const selectedPrice = priceFilters.find((item) => item.label === price) ?? priceFilters[0];
    return groupMentors.filter((mentor) => {
      const industryMatch =
        industry === "Alle" ||
        mentor.group_slugs.some((slug) => communityChannels.find((group) => group.slug === slug)?.name === industry);
      return industryMatch && mentor.hourly_rate_cents <= selectedPrice.max;
    });
  }, [industry, price]);

  return (
    <>
      <div className="mt-8 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label>
          <span className="text-sm font-bold text-slate-700">Branche</span>
          <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" value={industry} onChange={(event) => setIndustry(event.target.value)}>
            {groups.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="text-sm font-bold text-slate-700">Preis</span>
          <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" value={price} onChange={(event) => setPrice(event.target.value)}>
            {priceFilters.map((item) => <option key={item.label}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {mentors.map((mentor) => (
          <article key={mentor.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="relative h-16 w-16 overflow-hidden rounded-3xl bg-founder-600">
              <Image src={mentor.avatar_url} alt="" fill className="object-cover" sizes="64px" />
            </div>
            <h2 className="mt-5 font-serif text-2xl font-bold text-slate-950">{mentor.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {mentor.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-founder-50 px-3 py-1 text-xs font-bold text-founder-700">{tag}</span>
              ))}
            </div>
            <p className="mt-4"><Stars rating={mentor.rating} /></p>
            <p className="mt-3 text-sm font-bold text-founder-600">{mentor.hourly_rate}</p>
            <Link href={`/mentoren/${mentor.id}`} className="mt-6 block rounded-2xl bg-founder-600 px-5 py-3 text-center text-sm font-bold text-white">
              Profil ansehen
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
