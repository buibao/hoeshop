import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from '@playwright/test';
const bundle = build({entryPoints:['tests/e2e/carousel-harness.tsx'],bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',alias:{'@':path.resolve('src')}});
export async function openCarouselHarness(page:Page) {
 const result=await bundle;
 const css=await Promise.all(['src/styles/tokens.css','src/styles/landing-home.css','src/styles/store-typography.css'].map(file=>readFile(file,'utf8')));
 await page.route('**/carousel-harness',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="vi"><head><style>*{box-sizing:border-box}body{margin:0;background:#fffcf7}.hoe-store-scope{padding:24px;--font-store-body:Georgia;--font-store-heading:Georgia}h2{margin:20px 0}.icon-button{display:inline-flex;align-items:center;justify-content:center}a{color:inherit;text-decoration:none}${css.join('\n')}</style></head><body><div id="root"></div><script>${result.outputFiles[0].text}</script></body></html>`}));
 await page.goto('/carousel-harness');
 await page.locator('.olf-featured-carousel[data-carousel-ready="true"]').waitFor();
 await page.mouse.move(0,0);
}
