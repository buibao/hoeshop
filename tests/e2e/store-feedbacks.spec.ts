import { test, expect } from './fixtures';
import { openCarouselHarness } from './carousel-harness';

test('ten slides auto move right one at a time, rest after settle, and loop twice', async ({page}) => {
 test.setTimeout(120000);
 await page.setViewportSize({width:1440,height:900});
 await openCarouselHarness(page);
 const carousel=page.locator('.olf-featured-carousel'),position=carousel.locator('.olf-carousel-position');
 await expect(position).toHaveAttribute('aria-live','off');
 const interval=await page.evaluate(()=>new Promise<{time:number,x:number}[]>(resolve=>{
   const samples:{time:number,x:number}[]=[];const start=performance.now();const slide=document.querySelectorAll('.olf-carousel-slide')[0];
   const tick=()=>{samples.push({time:performance.now()-start,x:slide.getBoundingClientRect().x});if(performance.now()-start<4400)requestAnimationFrame(tick);else resolve(samples);};tick();
 }));
 const initial=interval[0].x;
 expect(interval.filter(s=>s.time<2700).every(s=>Math.abs(s.x-initial)<1)).toBe(true);
 const changing=interval.filter(s=>s.time>2700&&s.time<4000&&s.x>initial+1);
 expect(changing.length).toBeGreaterThan(2);
 const end=interval.at(-1)!;
 expect(end.x-initial).toBeGreaterThan(200);
 expect(end.x-initial).toBeLessThan(300);
 await expect(position).toHaveText('10 / 10');
 // Continue with real time, enough to observe two full loops without synthetic ticks.
 for(let i=1;i<=20;i++) {
   const selected=((9-i)%10+10)%10+1;
   await expect(position).toHaveText(`${selected} / 10`,{timeout:6500});
 }
});

test('hover/focus/manual pause compose; leaving waits three seconds from the current snap',async({page})=>{
 test.setTimeout(60000);await openCarouselHarness(page);
 const carousel=page.locator('.olf-featured-carousel'),position=carousel.locator('.olf-carousel-position'),next=carousel.getByRole('button',{name:'Sản phẩm tiếp theo',exact:true});
 await next.focus();await page.mouse.move(0,0);await page.waitForTimeout(3400);await expect(position).toHaveText('1 / 10');
 await carousel.hover();await page.locator('#outside').focus();await page.waitForTimeout(3400);await expect(position).toHaveText('1 / 10');
 await next.click();await expect(position).toHaveText('2 / 10');await page.mouse.move(0,0);await page.waitForTimeout(3400);await expect(position).toHaveText('2 / 10');
 await page.locator('#outside').focus();await page.waitForTimeout(2700);await expect(position).toHaveText('2 / 10');await expect(position).toHaveText('1 / 10',{timeout:2000});
 await carousel.getByRole('button',{name:'Tạm dừng',exact:true}).click();await page.locator('#outside').focus();await page.mouse.move(0,0);await page.waitForTimeout(3400);await expect(position).toHaveText('1 / 10');
 await carousel.getByRole('button',{name:'Chạy tiếp',exact:true}).click();await page.locator('#outside').focus();await page.mouse.move(0,0);await page.waitForTimeout(2700);await expect(position).toHaveText('1 / 10');await expect(position).toHaveText('10 / 10',{timeout:2000});
});

test('overlay, viewport, reduced motion, fitting/empty slides and resize are safe',async({page})=>{
 test.setTimeout(60000);await openCarouselHarness(page);
 const carousel=page.locator('.olf-featured-carousel'),position=carousel.locator('.olf-carousel-position');
 await page.locator('#overlay').click();await page.waitForTimeout(3400);await expect(position).toHaveText('1 / 10');
 await page.locator('#overlay').click();await page.waitForTimeout(2700);await expect(position).toHaveText('1 / 10');await expect(position).toHaveText('10 / 10',{timeout:2000});
 await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(800);const paused=await position.textContent();await page.waitForTimeout(3400);await expect(position).toHaveText(paused!);
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>scrollTo(0,0));await expect(carousel.getByRole('button',{name:'Tạm dừng'})).toHaveCount(0);
 await page.waitForTimeout(3400);await expect(position).toHaveText(paused!);await carousel.getByRole('button',{name:'Sản phẩm tiếp theo',exact:true}).click();await expect(position).not.toHaveText(paused!);
 for(const width of [390,768,1024,1440]) {await page.setViewportSize({width,height:900});await expect(carousel).toHaveAttribute('data-carousel-ready','true');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
 await page.locator('#count').click();await expect(position).toHaveText('1 / 1');await expect(carousel.getByRole('button',{name:'Sản phẩm tiếp theo',exact:true})).toBeDisabled();
 await page.locator('#count').click();await expect(carousel).toHaveCount(0);await page.locator('#count').click();await expect(position).toHaveText('1 / 10');
});

test('rapid manual direction changes replace the target without queuing transitions', async ({ page }) => {
 await openCarouselHarness(page);
 const carousel = page.locator('.olf-featured-carousel'), position = carousel.locator('.olf-carousel-position');
 await carousel.getByRole('button', {name:'Sản phẩm tiếp theo',exact:true}).click();
 await expect(position).toHaveText('2 / 10');
 await carousel.getByRole('button', {name:'Sản phẩm trước',exact:true}).click();
 await expect(position).toHaveText('1 / 10');
 await page.waitForTimeout(2200);
 await expect(position).toHaveText('1 / 10');
});
