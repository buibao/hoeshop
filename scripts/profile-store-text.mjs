import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const phase = process.argv.includes("--before") ? "before" : "after";
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto("http://localhost:3101/dich-vu/hoa-thoi");
    await page.locator('.ht-form-heading h2[data-text-state]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const before = await cdp.send("Performance.getMetrics");
    await page.evaluate(() => {
      window.textProfile = { frames: [], longTasks: [], entrances: [], running: true };
      const animate = Element.prototype.animate;
      Element.prototype.animate = function(frames, options) {
        if (this.matches('[data-text-layer]') && Array.isArray(frames) && frames.length === 2) window.textProfile.entrances.push({ owner: this.parentElement.id, properties: Object.keys(frames[0]) });
        return animate.call(this, frames, options);
      };
      new PerformanceObserver(list => window.textProfile.longTasks.push(...list.getEntries().map(entry => entry.duration))).observe({ type: "longtask" });
      let previous = performance.now();
      const frame = time => {
        window.textProfile.frames.push(time - previous); previous = time;
        if (window.textProfile.running) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    // Real wheel input exercises the existing Lenis clock, including reversal.
    for (const delta of [420, 420, 420, 420, 420, 420, -420, -420, -420, -420]) {
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(220);
    }
    await page.waitForTimeout(1500);
    const observed = await page.evaluate(() => { window.textProfile.running = false; return window.textProfile; });
    const after = await cdp.send("Performance.getMetrics");
    const frames = observed.frames.filter(value => value > 0).sort((a, b) => a - b);
    const delta = Object.fromEntries(after.metrics.filter(metric => /^(TaskDuration|ScriptDuration|LayoutDuration|RecalcStyleDuration|LayoutCount|RecalcStyleCount)$/.test(metric.name)).map(metric => [metric.name, metric.value - (before.metrics.find(old => old.name === metric.name)?.value ?? 0)]));
    results.push({ width, cpuSlowdown: 4, ...delta, frameP95Ms: frames[Math.floor(frames.length * .95)], framesOver34Ms: frames.filter(value => value > 34).length, longTasks: observed.longTasks, entrances: observed.entrances });
    await page.close();
  }
} finally { await browser.close(); }
await mkdir("docs/store-motion/v3/smoothness", { recursive: true });
await writeFile(`docs/store-motion/v3/smoothness/${phase}.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));
