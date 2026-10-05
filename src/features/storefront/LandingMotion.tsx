"use client";
import { useRef, useSyncExternalStore } from "react";
import { useReducedMotion, useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";

const subscribeDesktop = (callback: () => void) => {
  const media = window.matchMedia("(min-width: 1024px) and (hover: hover)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
const desktopSnapshot = () => window.matchMedia("(min-width: 1024px) and (hover: hover)").matches;
const serverSnapshot = () => false;
const subscribeReady = () => () => {};
const readySnapshot = () => true;

/** Content is visible in SSR and without JS. Only decorative photos move. */
export function LandingPhoto({ children, className, depth = 24 }: {
  children: React.ReactNode; className: string; depth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const desktop = useSyncExternalStore(subscribeDesktop, desktopSnapshot, serverSnapshot);
  const ready = useSyncExternalStore(subscribeReady, readySnapshot, serverSnapshot);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, depth]);
  return <m.div ref={ref} className={className} data-landing-photo data-landing-ready={ready} initial={false}
    style={{ y: desktop && !reduced ? y : 0 }}>{children}</m.div>;
}

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
