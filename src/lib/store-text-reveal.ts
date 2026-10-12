export type TextRevealRole = "page" | "heading" | "eyebrow" | "body";
export const textRevealPresets = {
  page: { desktop: [56, 1000], mobile: [40, 900] },
  heading: { desktop: [48, 950], mobile: [32, 850] },
  eyebrow: { desktop: [24, 800], mobile: [20, 750] },
  body: { desktop: [32, 900], mobile: [24, 800] },
} as const;
export const textRevealEase = "cubic-bezier(0.22, 0.61, 0.36, 1)";
type State = "FALLBACK_VISIBLE" | "ARMED_OFFSCREEN" | "ENTERING" | "VISIBLE" | "BYPASS_VISIBLE";
export type EntranceNode = HTMLElement & { __hoeTextEntrance?: Animation; __hoeTextBypass?: boolean; __hoeTextSettled?: boolean };
type Unit = { node: EntranceNode; layers: HTMLElement[]; role: TextRevealRole; delay: number; state: State; animations: Animation[]; settle: () => void; enter: () => void; arm: () => void };

/** Parser-time, finite enhancement. No hidden style survives absent/late hydration. */
export function initialTextEntrance(id: string, presets: typeof textRevealPresets, role: TextRevealRole, delay: number) {
  const node = document.getElementById(id) as EntranceNode | null;
  if (!node || !node.closest(".hoe-store-scope") || node.closest("[data-text-exempt]") || !window.IntersectionObserver || typeof node.animate !== "function") return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const forced = matchMedia("(forced-colors: active)");
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (reduced.matches || forced.matches || location.hash || navigation?.type === "back_forward" || scrollY > 0 || document.readyState !== "loading" || performance.getEntriesByType("paint").length) { node.__hoeTextBypass = true; return; }
  const box = node.getBoundingClientRect(), height = document.documentElement.clientHeight;
  if (box.bottom <= height * .08 || box.top >= height * .85 || box.height <= 0) return;
  const layer = node.querySelector<HTMLElement>("[data-text-layer]");
  if (!layer) return;
  const [distance, duration] = presets[role][innerWidth < 768 ? "mobile" : "desktop"];
  const linked = !!layer.querySelector("a");
  const animation = layer.animate([
    { opacity: 0, transform: `translateY(${distance}px)`, ...(linked ? { "--store-text-y": `${distance}px` } : {}) },
    { opacity: 1, transform: "translateY(0px)", ...(linked ? { "--store-text-y": "0px" } : {}) },
  ], { duration, delay, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "backwards" });
  node.__hoeTextEntrance = animation;
  const group = node.closest("[data-text-group]") || node;
  const cleanup = () => { group.removeEventListener("focusin", bypass, true); group.removeEventListener("pointerdown", bypass, true); reduced.removeEventListener("change", preference); forced.removeEventListener("change", preference); };
  const bypass = (event?: Event) => {
    // A finger landing on copy may start a scroll, rather than activate it.
    if (event instanceof PointerEvent && event.pointerType === "touch" && !(event.target instanceof Element && event.target.closest('a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"]),[role="button"],[role="combobox"],[contenteditable="true"]'))) return;
    node.__hoeTextBypass = true; animation.cancel(); cleanup();
  };
  const preference = () => { if (reduced.matches || forced.matches) bypass(); };
  group.addEventListener("focusin", bypass, true);
  group.addEventListener("pointerdown", bypass, true);
  reduced.addEventListener("change", preference);
  forced.addEventListener("change", preference);
  animation.onfinish = cleanup;
  animation.oncancel = cleanup;
}

const pools = new Map<HTMLElement | null, ReturnType<typeof createPool>>();
let restoringHistory = false;

function createPool(root: HTMLElement | null) {
  const units = new Map<Element, Unit>();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const forced = matchMedia("(forced-colors: active)");
  let trigger!: IntersectionObserver;
  let reset!: IntersectionObserver;
  let resize: ResizeObserver | undefined;
  let observedHeight = -1;
  let finding = false;
  let interactingTarget: Element | null = null;
  const bounds = () => {
    if (!root) return { top: 0, bottom: document.documentElement.clientHeight, height: document.documentElement.clientHeight };
    const top = root.getBoundingClientRect().top + root.clientTop;
    return { top, bottom: top + root.clientHeight, height: root.clientHeight };
  };
  const hashTarget = () => {
    try { return location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; }
    catch { return null; }
  };
  const protectedUnit = (unit: Unit) => {
    const group = unit.node.closest("[data-text-group]") || unit.node;
    const anchor = hashTarget();
    const selection = document.getSelection();
    const active = document.activeElement;
    const focusedOwner = active instanceof Element && active.matches("a[href], [tabindex]") && active.contains(unit.node);
    const interactingOwner = interactingTarget?.matches("a[href]") && interactingTarget.contains(unit.node);
    return reduced.matches || forced.matches || finding || group.contains(active) || focusedOwner || !!unit.node.closest("form")?.contains(active) || !!(interactingTarget && group.contains(interactingTarget)) || !!interactingOwner || !!(anchor && (anchor.contains(unit.node) || group.contains(anchor))) || !!(selection?.anchorNode && group.contains(selection.anchorNode) && !selection.isCollapsed);
  };
  const farAway = (unit: Unit, box = unit.node.getBoundingClientRect()) => {
    if (box.width <= 0 || box.height <= 0) return false;
    const viewport = bounds();
    return box.bottom < viewport.top - 120 || box.top > viewport.bottom + 120;
  };
  const observe = () => {
    const { height } = bounds();
    // Document content can resize while its viewport does not. Rebuilding both
    // observers then needlessly queues every target again during scrolling.
    if (height === observedHeight) return;
    observedHeight = height;
    trigger?.disconnect(); reset?.disconnect();
    trigger = new IntersectionObserver(entries => {
      const viewport = bounds();
      // Read geometry in one batch before any animation/style writes. Entries
      // can precede the latest scroll; reconcile against the current layout.
      const entering = entries.flatMap(entry => {
        const unit = units.get(entry.target);
        if (!unit || unit.state !== "ARMED_OFFSCREEN") return [];
        const box = unit.node.getBoundingClientRect();
        return box.height > 0 && box.bottom > viewport.top + viewport.height * .08 && box.top < viewport.top + viewport.height * .85 ? [unit] : [];
      });
      for (const unit of entering) {
        if (protectedUnit(unit)) unit.settle(); else unit.enter();
      }
    }, { root, rootMargin: `${-height * .08}px 0px ${-height * .15}px 0px`, threshold: [0, .001] });
    reset = new IntersectionObserver(entries => {
      const rearming = entries.flatMap(entry => {
        const unit = units.get(entry.target);
        // Entry rectangles can be stale after a rapid scroll or route/resize
        // commit. Never hide a target based on an earlier offscreen snapshot.
        return unit && unit.state !== "ARMED_OFFSCREEN" && farAway(unit) && !protectedUnit(unit) ? [unit] : [];
      });
      for (const unit of rearming) unit.arm();
    }, { root, rootMargin: "120px 0px 120px 0px", threshold: 0 });
    for (const unit of units.values()) { trigger.observe(unit.node); reset.observe(unit.node); }
  };
  const settleAll = () => { for (const unit of units.values()) unit.settle(); };
  const preference = () => { if (reduced.matches || forced.matches) settleAll(); };
  const history = () => { restoringHistory = true; settleAll(); };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted) history(); };
  const interaction = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    // Do not snap an entrance to its end when a touch starts native scrolling.
    // Actual controls still settle synchronously before their own handlers.
    if (event instanceof PointerEvent && event.type === "pointerdown" && event.pointerType === "touch" && !target.closest('a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"]),[role="button"],[role="combobox"],[contenteditable="true"]')) { userScroll(); return; }
    if (event.type === "pointerdown") { interactingTarget = target; userScrollAt = performance.now(); }
    for (const unit of units.values()) {
      const group = unit.node.closest("[data-text-group]") || unit.node;
      if (group.contains(target) || target.contains(unit.node) && (event.type === "focusin" || target.matches("a[href]")) || target.closest("form")?.contains(unit.node)) unit.settle();
    }
    if (event.type === "click") {
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (link && link.origin === location.origin) {
        if (link.hash) {
          try {
            const anchor = document.getElementById(decodeURIComponent(link.hash.slice(1)));
            if (anchor) for (const unit of units.values()) if (anchor.contains(unit.node)) unit.settle();
          } catch { /* Invalid hashes leave readable fallback. */ }
        } else { restoringHistory = false; finding = false; }
      }
    }
  };
  const interactionEnd = () => {
    interactingTarget = null;
    queueMicrotask(() => {
      const rearming = [...units.values()].filter(unit => unit.state !== "ARMED_OFFSCREEN" && farAway(unit) && !protectedUnit(unit));
      for (const unit of rearming) unit.arm();
    });
  };
  const hashchange = () => {
    const anchor = hashTarget();
    if (anchor) for (const unit of units.values()) if (anchor.contains(unit.node) || unit.node.contains(anchor)) unit.settle();
  };
  const selection = () => {
    const selected = document.getSelection();
    if (!selected || selected.isCollapsed) return;
    for (const unit of units.values()) if (selected.containsNode(unit.node, true)) unit.settle();
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.key === "F3" || (event.ctrlKey || event.metaKey) && ["f", "g"].includes(event.key.toLowerCase())) { finding = true; settleAll(); }
    else if (event.key === "Escape" && finding) {
      finding = false;
      for (const unit of units.values()) if (farAway(unit) && !protectedUnit(unit)) unit.arm();
    }
  };
  // Browser-menu find and AT jumps have no portable DOM event. On an unprompted
  // scroll jump, reveal the newly visible copy rather than delay its readability.
  let lastScroll = root?.scrollTop ?? scrollY;
  let userScrollAt = 0;
  const userScroll = () => { userScrollAt = performance.now(); };
  const drag = (event: PointerEvent) => { if (event.buttons) userScroll(); };
  const scroll = () => {
    const position = root?.scrollTop ?? scrollY;
    // Cover the existing 1.1s Lenis wheel tail without changing its clock.
    if (Math.abs(position - lastScroll) > 2 && performance.now() - userScrollAt > 2000) {
      const viewport = bounds();
      const visible = [...units.values()].filter(unit => {
        if (unit.state !== "ARMED_OFFSCREEN" && unit.state !== "ENTERING") return false;
        const box = unit.node.getBoundingClientRect();
        return box.bottom > viewport.top && box.top < viewport.bottom;
      });
      for (const unit of visible) unit.settle();
    }
    lastScroll = position;
  };
  const scrollOwner = root ?? window;
  try {
    observe();
    if (typeof ResizeObserver !== "undefined") { resize = new ResizeObserver(observe); resize.observe(root ?? document.documentElement); }
    window.addEventListener("resize", observe);
    window.addEventListener("popstate", history);
    window.addEventListener("pageshow", pageshow);
    window.addEventListener("hashchange", hashchange);
    document.addEventListener("focusin", interaction, true);
    document.addEventListener("pointerdown", interaction, true);
    document.addEventListener("pointerup", interactionEnd, true);
    document.addEventListener("pointercancel", interactionEnd, true);
    document.addEventListener("focusout", interactionEnd, true);
    document.addEventListener("click", interaction, true);
    document.addEventListener("selectionchange", selection);
    document.addEventListener("keydown", keydown);
    document.addEventListener("wheel", userScroll, { passive: true });
    document.addEventListener("touchmove", userScroll, { passive: true });
    document.addEventListener("pointermove", drag, { passive: true });
    document.addEventListener("keydown", userScroll);
    scrollOwner.addEventListener("scroll", scroll, { passive: true });
    reduced.addEventListener("change", preference); forced.addEventListener("change", preference);
  } catch { trigger?.disconnect(); reset?.disconnect(); resize?.disconnect(); throw new Error("Text observer unavailable"); }

  const remove = (unit: Unit) => {
    unit.settle(); units.delete(unit.node); trigger.unobserve(unit.node); reset.unobserve(unit.node);
    if (units.size) return;
    trigger.disconnect(); reset.disconnect(); resize?.disconnect();
    window.removeEventListener("resize", observe); window.removeEventListener("popstate", history); window.removeEventListener("pageshow", pageshow); window.removeEventListener("hashchange", hashchange);
    document.removeEventListener("focusin", interaction, true); document.removeEventListener("pointerdown", interaction, true); document.removeEventListener("click", interaction, true);
    document.removeEventListener("pointerup", interactionEnd, true); document.removeEventListener("pointercancel", interactionEnd, true); document.removeEventListener("focusout", interactionEnd, true);
    document.removeEventListener("selectionchange", selection); document.removeEventListener("keydown", keydown); document.removeEventListener("keydown", userScroll);
    document.removeEventListener("wheel", userScroll); document.removeEventListener("touchmove", userScroll);
    document.removeEventListener("pointermove", drag);
    scrollOwner.removeEventListener("scroll", scroll);
    reduced.removeEventListener("change", preference); forced.removeEventListener("change", preference);
    pools.delete(root);
  };
  return {
    add(unit: Unit, clientCreated: boolean) {
      units.set(unit.node, unit);
      const box = unit.node.getBoundingClientRect(), viewport = bounds();
      if (box.width <= 0 || box.height <= 0 || unit.node.__hoeTextBypass || unit.node.__hoeTextSettled || protectedUnit(unit) || (restoringHistory && box.bottom > viewport.top && box.top < viewport.bottom)) unit.settle();
      else if (unit.node.__hoeTextEntrance) {
        const animation = unit.node.__hoeTextEntrance;
        if (animation.playState === "finished" || animation.playState === "idle") unit.state = "VISIBLE";
        else { unit.state = "ENTERING"; unit.animations = [animation]; animation.addEventListener("finish", () => { if (unit.state === "ENTERING") unit.state = "VISIBLE"; unit.node.dataset.textState = unit.state; }, { once: true }); }
      } else if (box.bottom <= viewport.top || box.top >= viewport.bottom) unit.arm();
      else if (clientCreated && box.bottom > viewport.top + viewport.height * .08 && box.top < viewport.top + viewport.height * .85) unit.enter();
      else unit.settle();
      unit.node.dataset.textState = unit.state;
      trigger.observe(unit.node); reset.observe(unit.node);
      return () => remove(unit);
    },
  };
}

/** Read-only diagnostics for the browser harness; no extra product listeners. */
export function textRevealPoolCount() { return pools.size; }

function framesFor(layer: HTMLElement, distance: number): Keyframe[] {
  // Keep ordinary text on the compositor. An inherited animated custom
  // property forces style recalculation on every frame, even without links.
  const linked = !!layer.querySelector("a");
  return [
    { opacity: 0, transform: `translateY(${distance}px)`, ...(linked ? { "--store-text-y": `${distance}px` } : {}) },
    { opacity: 1, transform: "translateY(0px)", ...(linked ? { "--store-text-y": "0px" } : {}) },
  ];
}

export function registerTextReveal(node: EntranceNode, role: TextRevealRole, delay: number, root: HTMLElement | null, clientCreated: boolean) {
  const layers = Array.from(node.querySelectorAll<HTMLElement>("[data-text-layer]"));
  const unit: Unit = { node, layers, role, delay: Math.max(0, Math.min(180, delay)), state: "FALLBACK_VISIBLE", animations: [], settle: () => {}, enter: () => {}, arm: () => {} };
  const prepared = new Map<HTMLElement, { opacity: string; priority: string }>();
  const cancel = () => {
    for (const animation of unit.animations) animation.cancel();
    unit.animations = []; node.__hoeTextEntrance?.cancel();
    for (const [layer, original] of prepared) {
      if (original.opacity) layer.style.setProperty("opacity", original.opacity, original.priority);
      else layer.style.removeProperty("opacity");
    }
    prepared.clear();
  };
  unit.settle = () => { unit.state = "BYPASS_VISIBLE"; cancel(); node.__hoeTextSettled = true; node.dataset.textState = unit.state; };
  unit.arm = () => {
    if (unit.state === "ARMED_OFFSCREEN") return;
    cancel(); node.__hoeTextSettled = false; node.__hoeTextBypass = false;
    try {
      // Offscreen preparation needs no paused animation or transformed layer.
      // Only allocate an effect once the target actually enters the viewport.
      for (const layer of layers) {
        prepared.set(layer, { opacity: layer.style.getPropertyValue("opacity"), priority: layer.style.getPropertyPriority("opacity") });
        layer.style.opacity = "0";
      }
      unit.state = "ARMED_OFFSCREEN"; node.dataset.textState = unit.state;
    } catch { unit.settle(); }
  };
  unit.enter = () => {
    if (unit.state === "ENTERING") return;
    cancel();
    const [distance, duration] = textRevealPresets[role][innerWidth < 768 ? "mobile" : "desktop"];
    try {
      unit.state = "ENTERING"; node.dataset.textState = unit.state;
      unit.animations = layers.map(layer => layer.animate(framesFor(layer, distance), { duration, delay: unit.delay, easing: textRevealEase, fill: "backwards" }));
      const animations = unit.animations;
      Promise.all(animations.map(animation => animation.finished)).then(() => {
        if (unit.state !== "ENTERING" || unit.animations !== animations) return;
        unit.state = "VISIBLE"; node.dataset.textState = unit.state; cancel();
      }).catch(() => { if (unit.state === "ENTERING" && unit.animations === animations) unit.settle(); });
    } catch { unit.settle(); }
  };
  try {
    if (!window.IntersectionObserver || typeof node.animate !== "function") { unit.settle(); return { dispose: unit.settle, settle: unit.settle }; }
    let pool = pools.get(root);
    if (!pool) { pool = createPool(root); pools.set(root, pool); }
    return { dispose: pool.add(unit, clientCreated), settle: unit.settle };
  } catch { unit.settle(); return { dispose: unit.settle, settle: unit.settle }; }
}
