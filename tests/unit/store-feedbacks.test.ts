import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ServiceTypeIcon } from "@/components/ServiceTypeIcon";
import { AUTOPLAY_WAIT_MS, createCarouselAutoplay, type PauseReason } from "@/features/storefront/carousel-autoplay";

afterEach(() => vi.useRealTimers());
describe("service identity", () => {
  it("follows IDs in any order and safely omits unknown IDs", () => {
    for (const [serviceId, icon] of [["hoa-y", "sparkles"], ["hoa-tam", "heart"], ["hoa-thoi", "calendar-days"], ["hoa-tam", "heart"]]) {
      const html = renderToStaticMarkup(createElement(ServiceTypeIcon, { serviceId }));
      expect(html).toContain(`lucide-${icon}`);
      expect(html).toContain('aria-hidden="true"');
    }
    for (const serviceId of ["unknown", "toString", "__proto__"]) expect(renderToStaticMarkup(createElement(ServiceTypeIcon, { serviceId }))).toBe("");
  });
});
describe("carousel reading clock", () => {
  function setup() {
    vi.useFakeTimers();
    const step = vi.fn();
    const canStep = vi.fn(() => true);
    const autoplay = createCarouselAutoplay(step, canStep);
    autoplay.pause("viewport", false); autoplay.pause("unavailable", false);
    return { step, canStep, autoplay };
  }
  it("waits a full interval after settling and never queues or catches up", () => {
    const { step, autoplay } = setup();
    vi.advanceTimersByTime(AUTOPLAY_WAIT_MS - 1); expect(step).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(step).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60000); expect(step).toHaveBeenCalledTimes(1);
    autoplay.settle();
    vi.advanceTimersByTime(2999); expect(step).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1); expect(step).toHaveBeenCalledTimes(2);
    autoplay.destroy(); expect(vi.getTimerCount()).toBe(0);
  });
  it.each(["hover", "focus", "pointer", "hidden", "viewport", "overlay", "manual", "reduced", "unavailable"] as PauseReason[])("keeps %s independent of other blockers", (reason) => {
    const { step, autoplay } = setup();
    vi.advanceTimersByTime(2500);
    autoplay.pause(reason, true); autoplay.pause("focus", true); autoplay.pause("hover", true);
    autoplay.pause("hover", false); autoplay.pause("focus", false);
    if (reason === "hover" || reason === "focus") autoplay.pause(reason, true);
    vi.advanceTimersByTime(60000); expect(step).not.toHaveBeenCalled();
    autoplay.pause(reason, false);
    vi.advanceTimersByTime(2999); expect(step).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(step).toHaveBeenCalledTimes(1);
    autoplay.destroy();
  });
  it("manual transition clears a pending tick and reInit never duplicates clocks", () => {
    const { step, autoplay } = setup();
    vi.advanceTimersByTime(2900); autoplay.startTransition();
    vi.advanceTimersByTime(10000); expect(step).not.toHaveBeenCalled();
    autoplay.settle(); autoplay.settle(); expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(3000); expect(step).toHaveBeenCalledTimes(1);
    autoplay.destroy();
  });
  it("stops at a finite boundary and cleans up on unmount", () => {
    const { step, canStep, autoplay } = setup();
    canStep.mockReturnValue(false);
    vi.advanceTimersByTime(3000); expect(step).not.toHaveBeenCalled();
    canStep.mockReturnValue(true); autoplay.settle(); autoplay.destroy();
    vi.advanceTimersByTime(60000); expect(step).not.toHaveBeenCalled();
  });
});
