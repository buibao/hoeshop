"use client";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
/** Server-rendered content remains visible; motion never gates interaction. */
export function EditorialReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={false}
      data-editorial-reveal="true"
      whileInView={reduced ? {} : { opacity: [0, 1], y: [28, 0] }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: reduced ? 0 : 0.7,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </m.div>
  );
}
