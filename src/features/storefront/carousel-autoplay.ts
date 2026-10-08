export const AUTOPLAY_WAIT_MS = 1500;
export type PauseReason = "hover" | "focus" | "pointer" | "hidden" | "viewport" | "overlay" | "manual" | "reduced" | "unavailable";

/** One clock, independent blockers, and a fresh reading interval after every settle. */
export function createCarouselAutoplay(step: () => void, canStep: () => boolean) {
  const blockers = new Set<PauseReason>(["viewport", "unavailable"]);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let moving = false;
  let destroyed = false;
  function clear() { clearTimeout(timer); timer = undefined; }
  function schedule() {
    clear();
    if (destroyed || moving || blockers.size || !canStep()) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (destroyed || moving || blockers.size || !canStep()) return;
      moving = true;
      step();
    }, AUTOPLAY_WAIT_MS);
  }
  return {
    pause(reason: PauseReason, paused: boolean) {
      if (blockers.has(reason) === paused) return;
      if (paused) blockers.add(reason); else blockers.delete(reason);
      schedule();
    },
    startTransition() { moving = true; clear(); },
    settle() { moving = false; schedule(); },
    isMoving() { return moving; },
    destroy() { destroyed = true; clear(); },
  };
}
