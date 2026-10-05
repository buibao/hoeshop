"use client";
import {createContext, useContext, useEffect, useRef, useState, useSyncExternalStore} from "react";
import {useScroll, useTransform, type MotionValue} from "motion/react";
import * as m from "motion/react-m";
import {heroPhotoPath, heroPhases, type HeroGeometry} from "./landing-geometry";

// Subscribe to preference changes as well as width. Motion 14's hook snapshots the preference at mount.
const desktopQuery = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const subscribeDesktop = (callback: () => void) => {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
export function useDesktopMotion() {
  return useSyncExternalStore(subscribeDesktop, () => window.matchMedia(desktopQuery).matches, () => false);
}
const emptyGeometry: HeroGeometry = {width: 0, headingWidth: 0, headingTop: 0, headingHeight: 0, galleryCenter: 0, photoWidth: 0};
const HeroContext = createContext<{progress: MotionValue<number>; geometry: HeroGeometry; enabled: boolean; ready: boolean} | null>(null);
function useHero() {
  const value = useContext(HeroContext);
  if (!value) throw new Error("Hero layer requires LandingHeroMotion");
  return value;
}

/** One native-scroll timeline for every hero layer. Server children stay visible. */
export function LandingHeroMotion({children}: {children: React.ReactNode}) {
  const ref = useRef<HTMLElement>(null);
  const enabled = useDesktopMotion();
  const [geometry, setGeometry] = useState(emptyGeometry);
  const {scrollYProgress} = useScroll({target: ref, offset: ["start 0.15", "end 0.85"]});
  useEffect(() => {
    const root = ref.current!;
    const stage = root.querySelector<HTMLElement>(".olf-hero-stage")!;
    const heading = root.querySelector<HTMLElement>(".olf-hero-heading")!;
    const gallery = root.querySelector<HTMLElement>(".olf-hero-gallery")!;
    let active = true;
    const measure = () => {if (!active) return; setGeometry({width: stage.clientWidth, headingWidth: heading.offsetWidth, headingTop: heading.offsetTop,
      headingHeight: heading.offsetHeight, galleryCenter: gallery.offsetTop + gallery.offsetHeight / 2,
      photoWidth: stage.clientWidth * 0.27});};
    const observer = new ResizeObserver(measure);
    [stage, heading, gallery].forEach(el => observer.observe(el));
    void document.fonts.ready.then(measure);
    return () => {active = false; observer.disconnect();};
  }, []);
  return <HeroContext.Provider value={{progress: scrollYProgress, geometry, enabled: enabled && geometry.width > 0, ready: geometry.width > 0}}>
    <section ref={ref} className="olf-hero" aria-labelledby="home-title" data-hero-motion={enabled && geometry.width > 0}>
      {children}
    </section>
  </HeroContext.Provider>;
}

export function LandingTitleLine({children, index}: {children: React.ReactNode; index: number}) {
  const {progress, geometry, enabled} = useHero();
  // Bound the travel to the measured line box: wrapped Vietnamese copy cannot leave the stage.
  const room = Math.max(0, (geometry.width - geometry.headingWidth) / 2 - 24);
  const amplitude = Math.min(geometry.width * 0.065, room);
  const direction = index % 2 === 0 ? 1 : -1;
  const x = useTransform(progress, [0, 1], [amplitude * direction, -amplitude * direction]);
  return <m.span className="olf-title-line" data-hero-line initial={false} style={{x: enabled ? x : 0}}>{children}</m.span>;
}

export function LandingHeroPhoto({children, index}: {children: React.ReactNode; index: number}) {
  const {progress, geometry, enabled, ready} = useHero();
  const path = heroPhotoPath(index, geometry);
  const x = useTransform(progress, heroPhases, path.x);
  const y = useTransform(progress, heroPhases, path.y);
  const scale = useTransform(progress, heroPhases, path.scale);
  const rotate = useTransform(progress, heroPhases, path.rotate);
  return <m.div className={`olf-hero-photo olf-hero-photo--${["one", "two", "three"][index]}`} data-landing-photo data-landing-ready={ready} initial={false}
    style={enabled ? {left: 0, top: 0, bottom: "auto", width: geometry.photoWidth, x, y, scale, rotate} : {}}>{children}</m.div>;
}

export function LandingHeroOrnament({children, kind}: {children: React.ReactNode; kind: "flower" | "heart"}) {
  const {progress, enabled} = useHero();
  const rotate = useTransform(progress, [0, 1], kind === "flower" ? [0, 100] : [-12, 20]);
  const scale = useTransform(progress, [0, 0.5, 1], [1, 1.12, 1]);
  return <m.span className="olf-hero-ornament" aria-hidden="true" initial={false} style={enabled ? {rotate, scale} : {}}>{children}</m.span>;
}

export function LandingStoryPhoto({children}: {children: React.ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useDesktopMotion();
  const {scrollYProgress} = useScroll({target: ref, offset: ["start end", "end start"]});
  const y = useTransform(scrollYProgress, [0, 1], [-24, 24]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);
  return <m.div ref={ref} className="olf-story-photo" data-story-motion initial={false} style={enabled ? {y, rotate} : {}}>{children}</m.div>;
}
