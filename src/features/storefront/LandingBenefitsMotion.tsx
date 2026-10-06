"use client";
import {useEffect, useRef, useState} from "react";
import {useScroll, useTransform, type MotionValue} from "motion/react";
import * as m from "motion/react-m";
import {useDesktopMotion} from "./LandingHeroMotion";
import {benefitJourney} from "./landing-geometry";

function BenefitCard({children, index, progress, enabled}: {children: React.ReactNode; index: number; progress: MotionValue<number>; enabled: boolean}) {
  const rotate = useTransform(progress, [0, 0.5, 1], index % 2 ? [-8, 4, 10] : [10, -4, -10]);
  const y = useTransform(progress, [0, 0.5, 1], index % 2 ? [24, -16, 24] : [-16, 24, -16]);
  return <m.article className="olf-benefit-card" data-benefit-card initial={false} style={enabled ? {rotate, y} : {}}>{children}</m.article>;
}

/** No wheel interception. Without JS/reduced motion/small screens, cards stay in normal flow. */
export function LandingBenefitsMotion({intro, cards}: {intro: React.ReactNode; cards: React.ReactNode[]}) {
  const ref = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const desktop = useDesktopMotion();
  const [size, setSize] = useState({width: 0, cardWidth: 0, cardHeight: 0, introHeight: 0, viewportHeight: 0});
  const stageHeight = Math.max(size.cardHeight + 120, size.introHeight + 100, size.viewportHeight - 120);
  // Very tall copy falls back to flow so every word remains reachable, even on short desktop windows.
  const enabled = false //Remove animation desktop && cards.length > 1 && size.width > 0 && stageHeight <= size.viewportHeight - 80;
  const trackWidth = size.cardWidth * cards.length + 48 * Math.max(0, cards.length - 1);
  const journey = benefitJourney(size.width, trackWidth, size.cardWidth, stageHeight);
  const {scrollYProgress} = useScroll({target: ref, offset: ["start 100px", "end end"]});
  const x = useTransform(scrollYProgress, [0, 1], [journey.start, journey.end]);
  useEffect(() => {
    const root = ref.current!;
    let active = true;
    const measure = () => {
      if (!active) return;
      const width = stage.current!.clientWidth;
      const cardWidth = Math.min(420, width * 0.34);
      setSize({width, cardWidth, cardHeight: Math.max(0, ...Array.from(root.querySelectorAll<HTMLElement>(".olf-benefit-card")).map(el => el.offsetHeight)),
        introHeight: root.querySelector<HTMLElement>(".olf-benefits-intro")!.offsetHeight, viewportHeight: innerHeight});
    };
    const observer = new ResizeObserver(measure);
    [stage.current!, ...root.querySelectorAll<HTMLElement>(".olf-benefit-card"), root.querySelector<HTMLElement>(".olf-benefits-intro")!].forEach(el => observer.observe(el));
    window.addEventListener("resize", measure);
    void document.fonts.ready.then(measure);
    return () => {active = false; observer.disconnect(); window.removeEventListener("resize", measure);};
  }, [cards.length]);
  // className="olf-benefits"
  return <div ref={ref} className="" data-benefits-motion={enabled} style={enabled ? {height: journey.height, "--benefit-card-width": `${size.cardWidth}px`, "--benefit-stage-height": `${stageHeight}px`} as React.CSSProperties : {}}>
    <div ref={stage} className="olf-benefits-stage">
      <div className="olf-benefits-intro">{intro}</div>
      <div className="olf-benefits-viewport">
        <m.div ref={track} className="olf-benefit-grid" data-benefit-track initial={false} style={enabled ? {x} : {}}>
          {cards.map((card, index) => <BenefitCard key={index} index={index} progress={scrollYProgress} enabled={enabled}>{card}</BenefitCard>)}
        </m.div>
      </div>
    </div>
  </div>;
}
