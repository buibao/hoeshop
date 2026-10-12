"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useStoreScope } from "@/components/StoreScope";
import { storeMotionRole } from "@/lib/store-motion";
import { useReducedMotionPreference } from "./useReducedMotionPreference";

/** State updates immediately; only the changed value's background is highlighted. */
export function useStoreValueFeedback(ref: RefObject<HTMLElement | null>, value: string | number) {
  const previous = useRef(value);
  const reduced = useReducedMotionPreference();
  const { portalClassName } = useStoreScope();
  useEffect(() => {
    const changed = previous.current !== value;
    previous.current = value;
    const node = ref.current;
    if (!changed || !node || !portalClassName || reduced || typeof node.animate !== "function") return;
    const role = storeMotionRole(node, "feedback");
    if (!role.duration) return;
    const animation = node.animate([
      { backgroundColor: "var(--store-motion-highlight)" },
      { backgroundColor: getComputedStyle(node).backgroundColor },
    ], { duration: role.duration, easing: role.easing });
    return () => animation.cancel();
  }, [portalClassName, reduced, ref, value]);
}
