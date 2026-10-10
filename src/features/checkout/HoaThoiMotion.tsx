"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import * as m from "motion/react-m";
import { useReducedMotionPreference } from "@/components/ui/useReducedMotionPreference";

/** Visible server fallback; decorative cards enter only once. */
export function HoaThoiReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduced = useReducedMotionPreference();
  return <m.div className="ht-reveal" initial={false}
    whileInView={reduced ? {} : { opacity: [0.75, 1], y: [8, 0] }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.28, delay: reduced ? 0 : delay, ease: "easeOut" }}>
    {children}
  </m.div>;
}

/** Highlight the changed value without remounting controls or delaying state. */
export function useHoaThoiFeedback(ref: RefObject<HTMLElement | null>, value: string) {
  const previous = useRef(value);
  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = ref.current?.animate?.([{ opacity: 0.72 }, { opacity: 1 }], { duration: 140, easing: "ease-out" });
    return () => animation?.cancel();
  }, [ref, value]);
}
