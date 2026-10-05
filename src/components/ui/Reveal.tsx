"use client";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
export function Reveal({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <m.div
      initial={false}
      whileInView={reduced ? {} : { y: [8, 0] }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}
