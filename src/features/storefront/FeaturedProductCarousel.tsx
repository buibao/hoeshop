"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Server-rendered cards are passed as children; only carousel state runs in the client.
export function FeaturedProductCarousel({ slides }: { slides: { id: string; card: ReactNode }[] }) {
  const [viewport, api] = useEmblaCarousel({ align: "center", slidesToScroll: 1,
    containScroll: false, loop: slides.length === 10, startIndex: 0, dragFree: false,
    breakpoints: { "(prefers-reduced-motion: reduce)": { duration: 0 } } });
  const [state, setState] = useState({ selected: 0, previous: false, next: slides.length > 1, ready: false });
  const sync = useCallback(() => {
    if (!api) return;
    setState({ selected: api.selectedScrollSnap(), previous: api.canScrollPrev(), next: api.canScrollNext(), ready: true });
  }, [api]);
  useEffect(() => {
    if (!api) return;
    api.on("select", sync).on("reInit", sync);
    const frame = requestAnimationFrame(sync);
    return () => { cancelAnimationFrame(frame); api.off("select", sync).off("reInit", sync); };
  }, [api, sync]);
  return <div className="olf-featured-carousel editorial-products" role="region" aria-roledescription="băng chuyền" aria-labelledby="featured-title" data-carousel-ready={state.ready}>
    <div className="olf-carousel-viewport" ref={viewport}>
      <div className="olf-carousel-track">
        {slides.map(({ id, card }, index) => <div key={id} className="olf-carousel-slide" role="group" aria-roledescription="sản phẩm" aria-label={`${index + 1} / ${slides.length}`} data-selected={state.selected === index}>
          <div className="olf-carousel-card">{card}</div>
        </div>)}
      </div>
    </div>
    <div className="olf-carousel-controls">
      <button type="button" className="icon-button" disabled={!state.ready || !state.previous} onClick={() => api?.scrollPrev()} aria-label="Sản phẩm trước"><ChevronLeft aria-hidden="true" size={22} /></button>
      <span className="olf-carousel-position" aria-live="polite" aria-atomic="true">{state.selected + 1} / {slides.length}</span>
      <button type="button" className="icon-button" disabled={!state.ready || !state.next} onClick={() => api?.scrollNext()} aria-label="Sản phẩm tiếp theo"><ChevronRight aria-hidden="true" size={22} /></button>
    </div>
  </div>;
}
