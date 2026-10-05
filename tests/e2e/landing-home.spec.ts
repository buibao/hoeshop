import {test, expect} from './fixtures';

test('Home cards lead through configuration and checkout with existing controls',async({page})=>{
  await page.goto('/');
  const card=page.locator('.olf-product-card').filter({hasText:'Dịu dàng'});
  await card.getByRole('link',{name:'Xem mẫu hoa',exact:true}).click();
  await expect(page).toHaveURL(/san-pham\/mau-test-diu-dang$/);
  await page.getByLabel('Cảm xúc muốn gửi',{exact:true}).fill('Nghiệm thu Home');
  await page.getByRole('button',{name:'Thêm vào giỏ hoa',exact:true}).click();
  await expect(page.getByText('Đã thêm vào giỏ hoa.',{exact:true})).toBeVisible();
  await page.goto('/gio-hang');
  await expect(page.getByText('Nghiệm thu Home',{exact:false})).toBeVisible();
  await page.goto('/dat-hoa');
  for(const [name,value] of [['Họ tên người đặt','Khách TEST Home'],['Số điện thoại','0901234567'],['Tên người nhận','Người nhận TEST'],['Địa chỉ nhận hoa','Địa chỉ kiểm thử Home']])await page.getByLabel(name,{exact:true}).fill(value);
  await page.getByRole('button',{name:'Gửi yêu cầu đặt hoa',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Hòe đã nhận yêu cầu');
});

test('Home is usable without JavaScript and at 200% equivalent layout width',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,javaScriptEnabled:false,viewport:{width:720,height:900}});
  const page=await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toContainText('chill ghé nhà.');
  const cta=page.getByRole('link',{name:'Chọn một chút hoa',exact:true}).first();
  await expect(cta).toBeVisible();await cta.click();await expect(page).toHaveURL(/san-pham$/);
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await context.close();
});

test('long copy, card focus, reduced motion and shared footer stay readable',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:360,height:900});await page.goto('/');
  await expect(page.locator('[data-landing-ready="true"]')).toHaveCount(3);
  await page.locator('.olf-title-line').first().evaluate(n=>{n.textContent='Hòe gửi những điều dịu dàng đến người bạn thương';});
  await page.locator('.olf-product-card h3 a').first().evaluate(n=>{n.textContent='Một mẫu hoa với tên thật dài để kiểm tra khả năng xuống dòng';});
  await page.locator('.olf-product-card a').first().focus();
  await expect(page.locator('.olf-product-card').first().locator('img')).toHaveCSS('transform','none');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  for(const path of ['/san-pham','/dich-vu/hoa-tam','/san-pham/mau-test-nang','/gio-hang','/dat-hoa','/blog','/ve-hoe','/lien-he']){
    await page.goto(path);await expect(page.locator('.hoe-store-header')).toBeVisible();await expect(page.locator('.hoe-store-footer')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  expect(errors).toEqual([]);
});
