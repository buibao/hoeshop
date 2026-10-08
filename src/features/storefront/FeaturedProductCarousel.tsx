"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useStoreScope } from "@/components/StoreScope";
import { useReducedMotionPreference } from "@/components/ui/useReducedMotionPreference";
import { createCarouselAutoplay } from "./carousel-autoplay";

// ProductCard stays server-rendered. Embla alone owns all horizontal movement.
export function FeaturedProductCarousel({ slides }: { slides: { id: string; card: ReactNode }[] }) {
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof createCarouselAutoplay> | null>(null);
  const { backgroundBlocked } = useStoreScope();
  const reduced = useReducedMotionPreference();
  const [manualPause, setManualPause] = useState(false);
  const [centered, setCentered] = useState(0);
  const [viewport, api] = useEmblaCarousel({ align: "center", slidesToScroll: 1,
    containScroll: false, loop: slides.length > 1, startIndex: 0, dragFree: false, duration: 24,
    breakpoints: { "(prefers-reduced-motion: reduce)": { duration: 0 } } });
  const [state, setState] = useState({ selected: 0, previous: false, next: false, ready: false, overflow: false });

  useEffect(() => {
    if (!api || !root.current) return;
    const region = root.current;
    let overflow = false;
    const autoplay = createCarouselAutoplay(() => api.scrollPrev(), () => overflow && api.canScrollPrev());
    controller.current = autoplay;
    const sync = () => setState({ selected: api.selectedScrollSnap(), previous: overflow && api.canScrollPrev(), next: overflow && api.canScrollNext(), ready: true, overflow });
    const measure = () => {
      const track = api.containerNode();
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const width = api.slideNodes().reduce((total, slide) => total + slide.offsetWidth, 0) + Math.max(0, slides.length - 1) * gap;
      overflow = width > api.rootNode().clientWidth + 1;
      // Fitting content uses Embla's bounded layout; overflow keeps centered edge snaps.
      const containScroll = overflow ? false : "trimSnaps";
      if (api.internalEngine().options.containScroll !== containScroll) {
        api.reInit({ containScroll });
        return;
      }
      autoplay.pause("unavailable", !overflow);
      autoplay.settle();
      sync();
      setCentered(api.selectedScrollSnap());
    };
    const settle = () => { sync(); setCentered(api.selectedScrollSnap()); autoplay.settle(); };
    const scroll = () => { if (!autoplay.isMoving()) autoplay.startTransition(); };
    const down = () => autoplay.pause("pointer", true);
    const up = () => autoplay.pause("pointer", false);
    const enter = (event: PointerEvent) => { if (event.pointerType !== "touch") autoplay.pause("hover", true); };
    const leave = () => autoplay.pause("hover", false);
    const focus = () => autoplay.pause("focus", true);
    const blur = (event: FocusEvent) => { if (!region.contains(event.relatedTarget as Node | null)) autoplay.pause("focus", false); };
    const visibility = () => autoplay.pause("hidden", document.hidden);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => autoplay.pause("reduced", motion.matches);
    const observer = new IntersectionObserver(([entry]) => autoplay.pause("viewport", !entry.isIntersecting), { threshold: 0 });
    region.addEventListener("pointerenter", enter);
    region.addEventListener("pointerleave", leave);
    region.addEventListener("pointerdown", down);
    region.addEventListener("focusin", focus);
    region.addEventListener("focusout", blur);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", preference);
    api.on("scroll", scroll).on("settle", settle).on("select", sync).on("reInit", measure).on("pointerDown", down).on("pointerUp", up);
    observer.observe(region);
    visibility(); preference();
    autoplay.pause("focus", region.contains(document.activeElement));
    autoplay.pause("hover", window.matchMedia("(hover: hover)").matches && region.matches(":hover"));
    const frame = requestAnimationFrame(measure);
    let mounted = true;
    void document.fonts.ready.then(() => { if (mounted) api.reInit(); });
    return () => {
      mounted = false;
      cancelAnimationFrame(frame); autoplay.destroy(); controller.current = null; observer.disconnect();
      region.removeEventListener("pointerenter", enter); region.removeEventListener("pointerleave", leave);
      region.removeEventListener("pointerdown", down); region.removeEventListener("focusin", focus); region.removeEventListener("focusout", blur);
      document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
      document.removeEventListener("visibilitychange", visibility); motion.removeEventListener("change", preference);
      api.off("scroll", scroll).off("settle", settle).off("select", sync).off("reInit", measure).off("pointerDown", down).off("pointerUp", up);
    };
  }, [api, slides.length]);

  useEffect(() => { controller.current?.pause("overlay", backgroundBlocked); }, [api, backgroundBlocked, slides.length]);
  useEffect(() => { controller.current?.pause("manual", manualPause); }, [api, manualPause, slides.length]);
  // The loop seam needs the same gap as ordinary neighbours. Measure it once the
  // overflow attribute has applied the end margin, preserving the current snap.
  useEffect(() => { if (api) api.reInit(); }, [api, state.overflow]);
  function move(direction: "previous" | "next") {
    if (!api) return;
    controller.current?.startTransition();
    if (direction === "previous") api.scrollPrev(reduced); else api.scrollNext(reduced);
    // Jump transitions for reduced motion do not emit settle.
    if (reduced) { setCentered(api.selectedScrollSnap()); controller.current?.settle(); }
  }
  if (!slides.length) return null;
  return <div ref={root} className="olf-featured-carousel editorial-products" role="region" aria-roledescription="băng chuyền" aria-labelledby="featured-title" data-carousel-ready={state.ready} data-carousel-overflow={state.overflow}>
    <div className="olf-carousel-viewport" ref={viewport}>
      <div className="olf-carousel-track">
        {slides.map(({ id, card }, index) => <div key={id} className="olf-carousel-slide" role="group" aria-roledescription="sản phẩm" aria-label={`${index + 1} / ${slides.length}`} data-selected={centered === index}>
          <div className="olf-carousel-card">{card}</div>
        </div>)}
      </div>
    </div>
    <div className="olf-carousel-controls">
      <button type="button" className="icon-button" disabled={!state.ready || !state.previous} onClick={() => move("previous")} aria-label="Sản phẩm trước"><ChevronLeft aria-hidden="true" size={22} /></button>
      {/* <span className="olf-carousel-position" aria-live="off">{state.selected + 1} / {slides.length}</span> */}
      <button type="button" className="icon-button" disabled={!state.ready || !state.next} onClick={() => move("next")} aria-label="Sản phẩm tiếp theo"><ChevronRight aria-hidden="true" size={22} /></button>
      {/* {!reduced && state.overflow && <button type="button" className="olf-carousel-play" onClick={() => setManualPause((paused) => !paused)} aria-label={manualPause ? "Chạy tiếp" : "Tạm dừng"}>
        {manualPause ? <Play aria-hidden="true" size={18} /> : <Pause aria-hidden="true" size={18} />}{manualPause ? "Chạy tiếp" : "Tạm dừng"}
      </button>} */}
    </div>
  </div>;
}
