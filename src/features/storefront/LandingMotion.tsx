"use client";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

/** Once-per-section reveal; no hidden initial state or animation-gated action. */
export function LandingReveal({ children, className, delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const reduced = useReducedMotion();
  return <m.div className={className} data-landing-reveal initial={false}
    whileInView={reduced ? {} : { opacity: [0.35, 1], y: [16, 0] }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}>
    {children}
  </m.div>;
}
