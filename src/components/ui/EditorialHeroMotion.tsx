"use client";
import { useRef } from "react";
import { useReducedMotion, useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";

/** Animate decoration only; the hero image and primary action stay ready immediately. */
export function EditorialHeroMotion({
  children,
}: {
  children: React.ReactNode;
}) {
  const target = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 36]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0.65]);
  return (
    <m.div
      ref={target}
      className="editorial-hero-art"
      initial={false}
      style={{ y: reduced ? 0 : y, opacity: reduced ? 1 : opacity }}
    >
      {children}
    </m.div>
  );
}
