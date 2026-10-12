import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const phase = process.argv.includes("--before") ? "before" : "after";
const root = `docs/store-motion/v1/${phase}`;
await mkdir(root, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "no-preference" });
    await page.goto("http://localhost:3100/");
    await page.locator('[data-carousel-ready="true"]').waitFor();
    await page.goto("http://localhost:3100/dich-vu/hoa-thoi");
    await page.locator('.ht-calendar-summary[data-sticky]').waitFor();
    const session = await page.context().newCDPSession(page);
    await session.send("Performance.enable");
    const before = await session.send("Performance.getMetrics");
    await session.send("Tracing.start", { categories: "devtools.timeline,blink.user_timing", transferMode: "ReturnAsStream" });
    await page.evaluate(() => {
      window.motionTrace = { shifts: [], longTasks: [] };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.motionTrace.shifts.push(entry.value); }).observe({ type: "layout-shift" });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.motionTrace.longTasks.push(entry.duration); }).observe({ type: "longtask" });
    });
    for (const top of [600, 1200, 1800, 2400, 1600, 800]) {
      await page.evaluate(top => scrollTo({ top, behavior: "instant" }), top);
      await page.waitForTimeout(180);
    }
    await page.locator('.ht-calendar-day-button:not([disabled])').first().click();
    await page.getByRole('button', { name: 'Tháng sau', exact: true }).click();
    await page.getByRole('button', { name: 'Tháng trước', exact: true }).click();
    await page.locator('[data-component="select-10"] [role="combobox"]').nth(2).click();
    await page.waitForTimeout(260);
    await page.keyboard.press("Escape");
    const observed = await page.evaluate(() => window.motionTrace);
    const after = await session.send("Performance.getMetrics");
    const finished = new Promise(resolve => session.once("Tracing.tracingComplete", resolve));
    await session.send("Tracing.end");
    const { stream } = await finished;
    let trace = "";
    while (true) { const chunk = await session.send("IO.read", { handle: stream }); trace += chunk.data; if (chunk.eof) break; }
    await session.send("IO.close", { handle: stream });
    await writeFile(`${root}/${width}-performance.trace.json`, trace);
    const delta = Object.fromEntries(after.metrics.filter(metric => /^(TaskDuration|ScriptDuration|LayoutDuration|RecalcStyleDuration|LayoutCount|RecalcStyleCount)$/.test(metric.name)).map(metric => [metric.name, metric.value - (before.metrics.find(old => old.name === metric.name)?.value ?? 0)]));
    results.push({ width, height: 900, mode: "webpack development, warmed route, Chromium", route: "/dich-vu/hoa-thoi", ...delta, layoutShiftTotal: observed.shifts.reduce((sum, value) => sum + value, 0), longTasks: observed.longTasks });
    await page.close();
  }
} finally { await browser.close(); await writeFile(`${root}/performance.json`, JSON.stringify(results, null, 2)); }
console.log(JSON.stringify(results));
