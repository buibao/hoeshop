"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { cancelFrame, frame, type FrameData } from "motion/react";

let controller: Lenis | null = null;

export function getSmoothScrollController() {
  return controller;
}

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      smoothWheel: true,
      duration: 1.1,
      syncTouch: false,
      autoRaf: false,
      // Lenis includes CSS scroll-padding and scroll-margin in its anchor offset.
      anchors: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      prevent: (node) => node.matches(".modal, .offcanvas"),
    });
    controller = lenis;

    // Share Motion's clock with the existing scroll-driven animations.
    const update = ({ timestamp }: FrameData) => lenis.raf(timestamp);
    frame.update(update, true);

    // React Bootstrap locks body, while Lenis scrolls the document root.
    const syncScrollLock = () => {
      const locked =
        document.body.hasAttribute("data-rr-ui-modal-open") ||
        window.getComputedStyle(document.body).overflowY === "hidden";
      if (locked) lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(syncScrollLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class", "data-rr-ui-modal-open"],
    });
    syncScrollLock();

    // Cancel momentum before browser history restores another page's position.
    const onPopState = () =>
      lenis.scrollTo(lenis.actualScroll, { immediate: true });
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      observer.disconnect();
      cancelFrame(update);
      if (controller === lenis) controller = null;
      lenis.destroy();
    };
  }, []);

  return null;
}
