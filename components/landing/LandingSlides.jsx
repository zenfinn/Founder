"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bot,
  Calendar,
  ChevronRight,
  Coins,
  Crown,
  Flame,
  Gem,
  Globe,
  LayoutGrid,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Star,
  Store,
  TrendingUp,
  Users,
  Video,
  Youtube,
  Zap,
} from "lucide-react";
import { LandingHeader } from "@/components/LandingHeader";
import { SEO } from "@/components/SEO";
import { RankBadge } from "@/components/RankBadge";
import { communityChannels, ranks } from "@/lib/founder-data";
import { buildLocalBusinessSchema, buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo";

const SLIDE_COUNT = 8;

const rankIcons = { aspiring: Sprout, starter: Zap, builder: Flame, scaler: Gem, elite: Crown };
const groupIcons = {
  Reselling: ShoppingBag,
  Dropshipping: Package,
  "E-Commerce": Store,
  "Amazon FBA": Package,
  "TikTok Creator": Video,
  "TikTok Shop": ShoppingBag,
  "KI Creator": Bot,
  Trading: TrendingUp,
  "Memecoin Trading": Coins,
  "YouTube Automation": Youtube,
  "Digital Business": Globe,
};

const testimonials = [
  {
    name: "Jonas Weber",
    company: "Weber Commerce GmbH",
    quote: "Endlich eine Community, in der man sofort merkt, wer wirklich operativ baut.",
    rank: "scaler",
  },
  {
    name: "Nina Brandt",
    company: "CreatorFlow Studio",
    quote: "Die Mentor-Sessions und Events haben mir mehr gebracht als Monate in offenen Gruppen.",
    rank: "builder",
  },
  {
    name: "Emir Kaya",
    company: "Kaya Trading Systems",
    quote: "Verifizierte Ränge verändern die Gesprächsqualität komplett.",
    rank: "elite",
  },
];

function AnimatedCounter({ target, duration = 1800 }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return <span>{value.toLocaleString("de-DE")}</span>;
}

function SlideShell({ children, className = "" }) {
  return (
    <div className={`flex h-[100dvh] w-full flex-col items-center justify-center px-4 py-16 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function LandingSlides({ memberCount = 500 }) {
  const [index, setIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);

  const groups = useMemo(() => communityChannels.filter((group) => !group.requires_founder_pro), []);

  const goTo = useCallback((next) => {
    setIndex((current) => {
      if (next === "next") return Math.min(current + 1, SLIDE_COUNT - 1);
      if (next === "prev") return Math.max(current - 1, 0);
      if (typeof next === "number") return Math.max(0, Math.min(next, SLIDE_COUNT - 1));
      return current;
    });
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        goTo("next");
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo("prev");
      }
      if (event.key === "Escape") {
        event.preventDefault();
        goTo(0);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo]);

  useEffect(() => {
    if (paused || index >= SLIDE_COUNT - 1) return undefined;
    const timer = window.setTimeout(() => goTo("next"), 8000);
    return () => window.clearTimeout(timer);
  }, [index, paused, goTo]);

  function onTouchStart(event) {
    touchStart.current = event.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(event) {
    if (touchStart.current == null) return;
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
    if (delta > 60) goTo("prev");
    if (delta < -60) goTo("next");
    touchStart.current = null;
  }

  const variants = {
    enter: { opacity: 0, x: 80 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -80 },
  };

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-slate-950 text-white" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <SEO jsonLd={[buildOrganizationSchema(), buildWebSiteSchema(), buildLocalBusinessSchema()]} />
      <div className="absolute left-0 right-0 top-0 z-40 bg-white/95 backdrop-blur">
        <LandingHeader />
        <div className="h-1 bg-white/20">
          <div className="h-full bg-founder-400 transition-all duration-500" style={{ width: `${((index + 1) / SLIDE_COUNT) * 100}%` }} />
        </div>
      </div>

      <div className="absolute inset-0 pt-28" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <AnimatePresence mode="wait">
          <motion.div key={index} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.45 }} className="h-full">
            {index === 0 && (
              <SlideShell className="bg-founder-600 text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-white font-serif text-5xl font-bold text-founder-600">F</div>
                  <h1 className="mt-8 font-serif text-5xl font-bold sm:text-7xl">Founder</h1>
                  <p className="mx-auto mt-6 max-w-2xl text-lg text-founder-100 sm:text-xl">
                    Die verifizierte Community für echte Unternehmer
                  </p>
                  <div className="mt-10 flex flex-col items-center gap-3">
                    <Link href="/login" className="w-full max-w-xs rounded-2xl bg-white px-7 py-4 text-base font-bold text-founder-600 sm:w-auto">
                      Einloggen
                    </Link>
                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                      <Link href="/register" className="rounded-2xl border border-white/40 px-7 py-3.5 text-sm font-bold text-white">
                        Kostenlos starten
                      </Link>
                      <button
                        type="button"
                        onClick={() => goTo("next")}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 px-7 py-3.5 text-sm font-bold text-white"
                      >
                        Mehr erfahren
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="mt-12 inline-flex">
                    <ArrowDown className="h-6 w-6 text-founder-100" />
                  </motion.div>
                </motion.div>
              </SlideShell>
            )}

            {index === 1 && (
              <SlideShell className="bg-slate-950">
                <div className="mx-auto max-w-4xl text-center">
                  <h2 className="font-serif text-3xl font-bold sm:text-5xl">Warum gibt es keine ernsthafte Unternehmer-Community in Deutschland?</h2>
                  <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {[
                      "Facebook Gruppen – voller Anfänger",
                      "Discord – anonym und unverified",
                      "LinkedIn – zu formal",
                    ].map((text, cardIndex) => (
                      <motion.div
                        key={text}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + cardIndex * 0.15 }}
                        className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-left"
                      >
                        <p className="text-lg font-bold text-white">{text}</p>
                      </motion.div>
                    ))}
                  </div>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-10 text-founder-200">
                    Founder ist die Antwort →
                  </motion.p>
                </div>
              </SlideShell>
            )}

            {index === 2 && (
              <SlideShell className="bg-gradient-to-br from-founder-700 to-founder-900">
                <div className="mx-auto max-w-4xl text-center">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white font-serif text-3xl font-bold text-founder-600">
                    F
                  </motion.div>
                  <h2 className="mt-6 font-serif text-4xl font-bold sm:text-5xl">Verifizierte Unternehmer. Echte Gespräche.</h2>
                  <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {[
                      { Icon: ShieldCheck, title: "Verifikation", text: "Dokumente statt Behauptungen" },
                      { Icon: Star, title: "Ränge", text: "Zugang nach Unternehmensgröße" },
                      { Icon: Users, title: "Nischen", text: "Branchen-Communities statt Mischmasch" },
                    ].map(({ Icon, title, text }, i) => (
                      <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i }} className="rounded-[1.5rem] bg-white/10 p-6">
                        <Icon className="mx-auto h-8 w-8" />
                        <p className="mt-4 text-lg font-bold">{title}</p>
                        <p className="mt-2 text-sm text-founder-100">{text}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </SlideShell>
            )}

            {index === 3 && (
              <SlideShell className="bg-slate-50 text-slate-950">
                <div className="mx-auto max-w-6xl">
                  <h2 className="text-center font-serif text-4xl font-bold">Rang-System</h2>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {ranks.map((rank, i) => {
                      const Icon = rankIcons[rank.id] ?? Sprout;
                      return (
                        <motion.div
                          key={rank.id}
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="rounded-[1.25rem] border border-slate-200 bg-white p-4"
                        >
                          <Icon className="h-7 w-7 text-founder-600" />
                          <div className={`mt-4 h-1.5 w-12 rounded-full ${rank.accent}`} />
                          <h3 className="mt-4 font-serif text-xl font-bold">{rank.label}</h3>
                          <p className="mt-2 text-xs leading-5 text-slate-600">{rank.description}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </SlideShell>
            )}

            {index === 4 && (
              <SlideShell className="bg-white text-slate-950">
                <div className="mx-auto max-w-6xl">
                  <h2 className="text-center font-serif text-4xl font-bold">Deine Branche. Dein Netzwerk.</h2>
                  <div className="mt-8 grid max-h-[52vh] gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group, i) => {
                      const Icon = groupIcons[group.category] ?? Globe;
                      return (
                        <motion.div key={group.slug} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <Icon className="h-6 w-6 text-founder-600" />
                          <p className="mt-3 font-bold">{group.name}</p>
                          <p className="text-xs text-slate-500">{group.member_count.toLocaleString("de-DE")} Mitglieder</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </SlideShell>
            )}

            {index === 5 && (
              <SlideShell className="bg-slate-100 text-slate-950">
                <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
                  {[
                    { Icon: Calendar, title: "Events", text: "Workshops, Dinner und Live-Formate für echte Kontakte.", href: "/events" },
                    { Icon: Star, title: "Mentoren", text: "1:1 Sessions mit verifizierten Builder, Scaler und Elite.", href: "/mentoren" },
                    { Icon: LayoutGrid, title: "Showcases", text: "Teile Projekte, Shops und Launches wie auf Instagram.", href: "/showcases" },
                  ].map(({ Icon, title, text, href }, i) => (
                    <motion.div key={title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                      <Icon className="h-10 w-10 text-founder-600" />
                      <h3 className="mt-5 font-serif text-2xl font-bold">{title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
                      <Link href={href} className="mt-5 inline-flex text-sm font-bold text-founder-600">
                        Entdecken →
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </SlideShell>
            )}

            {index === 6 && (
              <SlideShell className="bg-slate-950">
                <div className="mx-auto max-w-5xl text-center">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-300">Social Proof</p>
                  <p className="mt-4 font-serif text-5xl font-bold">
                    <AnimatedCounter target={Math.max(memberCount, 500)} />+ Mitglieder
                  </p>
                  <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {testimonials.map((item, i) => (
                      <motion.div key={item.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-left">
                        <RankBadge rank={item.rank} />
                        <p className="mt-4 text-sm leading-6 text-slate-200">&quot;{item.quote}&quot;</p>
                        <p className="mt-4 font-bold text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.company}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </SlideShell>
            )}

            {index === 7 && (
              <SlideShell className="bg-founder-600 text-center">
                <div className="mx-auto max-w-xl">
                  <h2 className="font-serif text-4xl font-bold sm:text-5xl">Jetzt kostenlos beitreten</h2>
                  <p className="mt-4 text-founder-100">Registriere dich in Sekunden – monatliche Verlosungen für aktive Mitglieder.</p>
                  <form
                    className="mt-8 flex flex-col gap-3 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault();
                      window.location.href = `/register?email=${encodeURIComponent(email.trim())}`;
                    }}
                  >
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="deine@email.de"
                      className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-founder-200"
                    />
                    <button type="submit" className="rounded-2xl bg-white px-6 py-3 font-bold text-founder-600">
                      Starten
                    </button>
                  </form>
                  <Link href="/register" className="mt-6 inline-flex rounded-2xl border border-white/30 px-6 py-3 font-bold text-white">
                    Direkt zur Registrierung
                  </Link>
                </div>
              </SlideShell>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <button type="button" aria-label="Vorheriger Slide" onClick={() => goTo("prev")} className="absolute left-3 top-1/2 z-40 hidden rounded-full border border-white/20 bg-black/20 p-3 text-white backdrop-blur sm:block">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <button type="button" aria-label="Nächster Slide" onClick={() => goTo("next")} className="absolute right-3 top-1/2 z-40 hidden rounded-full border border-white/20 bg-black/20 p-3 text-white backdrop-blur sm:block">
        <ArrowRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center gap-2">
        {Array.from({ length: SLIDE_COUNT }).map((_, dotIndex) => (
          <button
            key={dotIndex}
            type="button"
            aria-label={`Slide ${dotIndex + 1}`}
            onClick={() => goTo(dotIndex)}
            className={`h-2.5 rounded-full transition ${dotIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/40"}`}
          />
        ))}
      </div>
    </main>
  );
}
