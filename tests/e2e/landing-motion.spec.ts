import {test,expect} from './fixtures';

async function transforms(page: import('@playwright/test').Page) {
  return page.locator('[data-landing-photo]').evaluateAll(nodes=>nodes.map(node=>{
    const m=new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return {x:m.m41,y:m.m42,scale:Math.hypot(m.a,m.b),angle:Math.atan2(m.b,m.a)*180/Math.PI};
  }));
}
test('shared hero journey reverses and keeps its final gallery clear of services',async({page})=>{
  await page.setViewportSize({width:1440,height:960});await page.goto('/');
  await expect(page.locator('[data-landing-ready=true]')).toHaveCount(3);
  await expect(page.locator('.olf-hero')).toHaveAttribute('data-hero-motion','true');
  const start=await transforms(page);
  const initialLines=await page.locator('[data-hero-line]').evaluateAll(nodes=>nodes.map(n=>new DOMMatrixReadOnly(getComputedStyle(n).transform).m41));
  expect(initialLines[0]).toBeGreaterThan(0);expect(initialLines[1]).toBeLessThan(0);
  const heroEnd=await page.locator('.olf-hero').evaluate(n=>n.getBoundingClientRect().bottom+scrollY-innerHeight*.85);
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),heroEnd+1);
  await expect.poll(async()=>(await transforms(page))[0].scale).toBeGreaterThan(.99);
  const end=await transforms(page);
  expect(end[0].x).toBeGreaterThan(start[0].x);expect(end[1].x).toBeLessThan(start[1].x);
  expect(end[0].angle).toBeCloseTo(-18,0);expect(end[2].angle).toBeCloseTo(4,0);
  const lines=await page.locator('[data-hero-line]').evaluateAll(nodes=>nodes.map(n=>new DOMMatrixReadOnly(getComputedStyle(n).transform).m41));
  expect(lines[0]).toBeLessThan(0);expect(lines[1]).toBeGreaterThan(0);
  const boxes=await page.locator('[data-landing-photo]').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().bottom));
  const services=await page.locator('.olf-services').boundingBox();expect(Math.max(...boxes)).toBeLessThan(services!.y);
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await expect.poll(async()=>(await transforms(page))[0].scale).toBeCloseTo(start[0].scale,3);
  for(const [i,value]of (await transforms(page)).entries()){expect(value.x).toBeCloseTo(start[i].x,1);expect(value.y).toBeCloseTo(start[i].y,1);}
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('.olf-hero')).toHaveAttribute('data-hero-motion','false');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('benefit track crosses a sticky intro, reverses, and releases for reduced motion/mobile',async({page})=>{
  await page.setViewportSize({width:1440,height:960});await page.goto('/');
  const benefits=page.locator('.olf-benefits'),track=page.locator('[data-benefit-track]');
  await expect(benefits).toHaveAttribute('data-benefits-motion','true');
  const box=await benefits.evaluate(n=>({top:n.getBoundingClientRect().top+scrollY,height:n.getBoundingClientRect().height}));
  const end=box.top+box.height-960,start=box.top-100;
  const samples=[];
  for(const progress of [.25,.5,.75,.25]){
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),start+(end-start)*progress);
    await page.waitForTimeout(80);
    samples.push({x:await track.evaluate(n=>new DOMMatrixReadOnly(getComputedStyle(n).transform).m41),top:(await page.locator('.olf-benefits-intro').boundingBox())!.y});
  }
  expect(samples[0].x).toBeGreaterThan(samples[1].x);expect(samples[1].x).toBeGreaterThan(samples[2].x);
  expect(samples[3].x).toBeCloseTo(samples[0].x,1);expect(samples[2].top).toBeCloseTo(samples[0].top,1);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(benefits).toHaveAttribute('data-benefits-motion','false');
  await expect(track).toHaveCSS('transform','none');
  expect((await benefits.boundingBox())!.height).toBeLessThan(960);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:768,height:900});
  await expect(benefits).toHaveAttribute('data-benefits-motion','false');
  await page.setViewportSize({width:390,height:844});await benefits.scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('desktop no-JS keeps every benefit in flow with no scroll stage',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,javaScriptEnabled:false,viewport:{width:1440,height:960}});
  try{const page=await context.newPage();await page.goto('/');
    await expect(page.locator('.olf-benefits')).toHaveAttribute('data-benefits-motion','false');
    await expect(page.locator('.olf-benefits-stage')).toHaveCSS('position','relative');
    expect((await page.locator('.olf-benefits').boundingBox())!.height).toBeLessThan(960);
    await expect(page.locator('[data-benefit-card]')).toHaveCount(3);
    const cta=page.locator('.olf-hero-description .olf-button');await cta.click();await expect(page).toHaveURL(/\/san-pham$/);
  }finally{await context.close();}
});

test('short desktop windows settle in static flow without a measurement loop',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:960});await page.goto('/');
  await expect(page.locator('.olf-benefits')).toHaveAttribute('data-benefits-motion','true');
  for(const height of [580,600,620]){
    await page.setViewportSize({width:1440,height});
    await expect(page.locator('.olf-benefits')).toHaveAttribute('data-benefits-motion','false');
    const changes=await page.locator('.olf-benefits').evaluate(node=>new Promise<number>(resolve=>{
      let count=0;const observer=new MutationObserver(()=>count++);observer.observe(node,{attributes:true,attributeFilter:['data-benefits-motion']});
      setTimeout(()=>{observer.disconnect();resolve(count)},350);
    }));expect(changes).toBe(0);
  }
  await page.setViewportSize({width:1440,height:960});await expect(page.locator('.olf-benefits')).toHaveAttribute('data-benefits-motion','true');expect(errors).toEqual([]);
});
