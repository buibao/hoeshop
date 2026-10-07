"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useReducedMotionPreference } from "@/components/ui/useReducedMotionPreference";

/** Stable measurement outside; opacity alone changes inside. Server content stays visible. */
export function LandingScrollFade({ children, className }: {
  children: React.ReactNode; className?: string;
}) {
  const target = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPreference();
  const band = useMotionValue(0);
  const bypass = useMotionValue(true);
  const focused = useMotionValue(false);
  const { scrollYProgress } = useScroll({
    target, offset: ["start end", "end start"], trackContentSize: true,
  });
  const opacity = useTransform(() => {
    const r = band.get();
    const progress = scrollYProgress.get();
    // Read every value unconditionally so Motion subscribes to focus from SSR onward.
    const isBypassed = bypass.get();
    const isFocused = focused.get();
    if (isBypassed || isFocused || r <= 0) return 1;
    return Math.max(0, Math.min(1, progress / r, (1 - progress) / r));
  });

  useEffect(() => {
    const root = target.current!;
    const inner = content.current!;
    let active = true;
    const measure = () => {
      if (!active) return;
      const box = root.getBoundingClientRect();
      const viewport = document.documentElement.clientHeight;
      const distance = box.height + viewport;
      // Card padding must not consume the entire fade before its copy appears.
      // Keep the band at the viewport edges so the central reading area stays clear.
      const fade = Math.min(box.height * 0.45, viewport * 0.18);
      // Refresh progress when layout/fonts change without a scroll event.
      if (distance > 0) scrollYProgress.set((viewport - box.top) / distance);
      band.set(distance > 0 ? fade / distance : 0);
      bypass.set(reduced || box.height <= 0 || viewport <= 0);
    };
    const syncInteraction = (value: number) => {
      inner.inert = value === 0 && !focused.get();
    };
    const unsubscribe = opacity.on("change", syncInteraction);
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(document.documentElement);
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", measure);
    window.addEventListener("popstate", measure);
    window.addEventListener("hashchange", measure);
    void document.fonts.ready.then(measure);
    measure();
    syncInteraction(opacity.get());
    return () => {
      active = false;
      unsubscribe();
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", measure);
      window.removeEventListener("popstate", measure);
      window.removeEventListener("hashchange", measure);
      inner.inert = false;
    };
  }, [band, bypass, focused, opacity, reduced, scrollYProgress]);

  return <div ref={target} className={className} data-scroll-fade
    onFocusCapture={() => focused.set(true)}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) focused.set(false);
    }}>
    <m.div ref={content} data-scroll-fade-content initial={false} style={{ opacity }}>
      {children}
    </m.div>
  </div>;
}
