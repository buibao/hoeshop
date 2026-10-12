# Scroll smoothness follow-up

User reported stuttering while scrolling. Changes are limited to the Store text controller; the Hero, carousel, Lenis clock, easing, duration and reveal distances retain the v3 baseline.

## Causes addressed

- Every text layer previously animated the inherited `--store-text-y` property. Ordinary headings and paragraphs now animate only `transform` and `opacity`. The counter-offset property remains only on paragraphs containing inline anchors, whose hit areas must stay fixed.
- Touch pointer-down on ordinary copy previously cancelled its entrance immediately, including a finger landing to begin a scroll. Scroll gestures now retain the running animation. Touching controls or links, keyboard focus and text selection still settle copy for immediate interaction. This also applies to the parser-time entrance before hydration.
- Observer callbacks now collect layout measurements before changing animations. They skip units already armed and rebuild observers only when the scroll root height changes. A small positive intersection threshold handles the transition from edge contact to actual intersection; current geometry guards against stale entries.
- Offscreen text no longer retains a paused WAAPI effect. Preparation uses controller-owned opacity that is restored on entry, bypass, error or disposal; only an actual entrance allocates an animation. Zero-size layout boxes choose visible fallback and cannot trigger a reset. This also avoids preparing effects while container-query descendants have no usable layout yet.

## Evidence

`before.json` and `after.json` come from `node scripts/profile-store-text.mjs [--before]`, against the mock production server on port 3101. Each run uses Chromium, a 900px-high viewport, 4× CPU slowdown and the same ten native wheel inputs with a direction reversal. Widths are 1440 and 390; the narrow run is a responsive desktop browser, not physical mobile hardware.

The profile records style/layout/script/task time, frame intervals, long tasks and actual entrance properties. These are diagnostic samples, not a hardware-independent FPS guarantee. The initial profile already had no frames over 34ms on this machine; the relevant comparison is reduced rendering work and protection against abrupt cancellation.

| Viewport | Style work before → after | Reduction | Total task time before → after |
|---|---|---|---|
| 1440 × 900 | 550 → 237 ms | 56.9% | 1995 → 1698 ms |
| 390 × 900 | 448 → 224 ms | 50.0% | 1533 → 1699 ms |

Both runs had no long tasks or frames over 34ms. The number of recorded entrances matched before/after (23 and 19 respectively); the improvement did not come from skipping animations. Exact raw values are in the JSON files.

Total task time did not improve consistently in these single samples (the narrow run increased). The supported result is lower style-recalculation cost and corrected touch cancellation, not a measured FPS increase or a claim that every rendering metric improved.

Regression assertions in `tests/e2e/store-text.spec.ts` cover compositor-friendly properties, one continuous animation during small scroll reversals, monotonic opacity/displacement, touch-scroll start versus control activation, replay bounds, focus, reduced motion and anchor geometry. Touch-start/cancel events are simulated; physical-device gesture feel remains a manual check.

See [the full report](../README.md), [browser results](../e2e.log), and [recorded clips](../review.html).

## Validation limits

- Production mock build, TypeScript and 177 unit tests pass; lint has 0 errors and 7 existing unused-variable warnings.
- The final [text run without tracing](text-no-trace.log) passes 30 tests with 2 intentional skips. [Touch/replay repetition](targeted.log) passed 12/12 after the touch fix. [Functional regression without tracing](flows-no-trace.log) passes 46 tests. Combined final coverage: 76 passing tests, 2 intentional skips.
- Runs with Playwright tracing intermittently report a zero-height `.ht-fields` container with visible computed styles and zero-size descendants, sometimes blocking a calendar click before any scroll. The controller now falls back visibly for zero-size targets. The underlying container-layout/trace interaction is not conclusively resolved; disabling tracing is a verification configuration, not a claimed product fix. Failed runs remain in `e2e.log` and `final-e2e.log` alongside the passing evidence.
