"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ShowcaseImageCarousel({
  images = [],
  alt = "Showcase",
  aspectClassName = "aspect-[4/3]",
  showControls = true,
  onClick,
}) {
  const urls = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  if (!urls.length) {
    return <div className={`relative ${aspectClassName} bg-slate-100`} />;
  }

  const safeIndex = Math.min(index, urls.length - 1);
  const hasMultiple = urls.length > 1;

  function goTo(nextIndex) {
    setIndex((nextIndex + urls.length) % urls.length);
  }

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX == null || !hasMultiple) return;

    const endX = event.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;
    if (delta > 48) goTo(safeIndex - 1);
    else if (delta < -48) goTo(safeIndex + 1);
  }

  return (
    <div
      className={`relative ${aspectClassName} overflow-hidden bg-slate-100`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
    >
      <Image src={urls[safeIndex]} alt={alt} fill className="object-cover" unoptimized />

      {hasMultiple && showControls ? (
        <>
          <button
            type="button"
            aria-label="Vorheriges Bild"
            onClick={(event) => {
              event.stopPropagation();
              goTo(safeIndex - 1);
            }}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/40 p-1.5 text-white backdrop-blur"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Nächstes Bild"
            onClick={(event) => {
              event.stopPropagation();
              goTo(safeIndex + 1);
            }}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/40 p-1.5 text-white backdrop-blur"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {urls.map((url, dotIndex) => (
              <button
                key={url}
                type="button"
                aria-label={`Bild ${dotIndex + 1}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setIndex(dotIndex);
                }}
                className={`h-1.5 rounded-full transition ${
                  dotIndex === safeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
