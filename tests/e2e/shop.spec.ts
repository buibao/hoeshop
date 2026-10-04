import {test,expect,type Page} from "@playwright/test";
async function addTam(page:Page,emotion="Biết ơn"){
  await page.goto("/san-pham/mau-test-diu-dang");
  await page.getByLabel("Cảm xúc muốn gửi",{exact:true}).fill(emotion);
  await page.getByRole("button",{name:"Thêm vào giỏ hoa"}).click();
  await expect(page.getByText("Đã thêm vào giỏ hoa.")).toBeVisible();
}
async function addThoi(page:Page){
  await page.goto("/san-pham/mau-test-hoa-thoi");
  await page.getByRole("button",{name:"Thêm vào giỏ hoa"}).click();
  await expect(page.getByText("Đã thêm vào giỏ hoa.")).toBeVisible();
}
async function checkoutDetails(page:Page){
  await page.goto("/dat-hoa");
  await page.getByLabel("Họ tên người đặt",{exact:true}).fill("Khách test");
  await page.getByLabel("Số điện thoại",{exact:true}).fill("0901234567");
  await page.getByLabel("Tên người nhận",{exact:true}).fill("Người nhận test");
  await page.getByLabel("Địa chỉ nhận hoa",{exact:true}).fill("Địa chỉ kiểm thử");
}
test("home, navigation, keyboard and images work without horizontal overflow",async({page},testInfo)=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading",{level:1})).toContainText("Hòe gửi hoa");
  await expect(page.getByText("BẢN TEST",{exact:false})).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link",{name:"Đến nội dung chính"})).toBeFocused();
  if(testInfo.project.name==="mobile"){
    await page.getByRole("button",{name:"Mở menu"}).click();
    await expect(page.getByRole("navigation",{name:"Điều hướng chính"})).toBeVisible();
    await page.getByRole("button",{name:"Đóng menu"}).click();
  }
  await page.getByRole("link",{name:"Khám phá dịch vụ",exact:true}).first().click();
  await expect(page.locator("#dich-vu")).toBeInViewport();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await page.evaluate(()=>{document.querySelectorAll("img").forEach(img=>img.loading="eager");});
  await expect.poll(()=>page.locator("img").evaluateAll(images=>images.every(img=>(img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth>0))).toBe(true);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:testInfo.outputPath("home.png"),fullPage:true});
  expect(errors).toEqual([]);
});
test("mixed cart persists, separates configurations and supports editing/removal",async({page})=>{
  await addTam(page,"Biết ơn");await addTam(page,"Yêu thương");await addThoi(page);
  await page.goto("/san-pham/mau-test-nang");
  await page.getByRole("button",{name:"Thêm vào giỏ hoa"}).click();
  await page.goto("/gio-hang");
  await expect(page.locator(".cart-row")).toHaveCount(4);
  await page.locator(".cart-row").first().getByLabel("Số lượng").fill("2");
  await page.locator(".cart-row").first().getByRole("button",{name:"Sửa cấu hình"}).click();
  await page.locator(".cart-row").first().getByLabel("Lời nhắn trên thiệp",{exact:true}).fill("Cảm ơn bạn");
  await page.locator(".cart-row").first().getByRole("button",{name:"Lưu cấu hình"}).click();
  await page.reload();await expect(page.locator(".cart-row")).toHaveCount(4);
  await expect(page.locator(".cart-row").first().getByLabel("Số lượng")).toHaveValue("2");
  await page.locator(".cart-row").nth(1).getByRole("button",{name:/Xóa/}).click();
  await expect(page.locator(".cart-row")).toHaveCount(3);
  await expect(page.getByText("Tạm tính phần đã có giá",{exact:true})).toBeVisible();
  const storage=await page.evaluate(()=>localStorage.getItem("hoe.cart.v1"));
  expect(storage).toContain("Cảm ơn bạn");expect(storage).not.toContain("buyer");
});
test("checkout saves mixed services and clears cart only after receipt",async({page})=>{
  await addTam(page);await addThoi(page);
  await page.goto("/san-pham/mau-test-nang");await page.getByRole("button",{name:"Thêm vào giỏ hoa"}).click();
  await checkoutDetails(page);
  const requestPromise=page.waitForRequest(r=>r.url().endsWith("/api/orders") && r.method()==="POST");
  await page.getByRole("button",{name:"Gửi yêu cầu đặt hoa",exact:true}).click();
  const request=await requestPromise,payload=request.postDataJSON();
  expect(payload.items).toHaveLength(3);expect(payload.recipient.phone).toBe("");
  await expect(page.getByRole("status")).toContainText("Hòe đã nhận yêu cầu");
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("hoe.cart.v1")!).items)).toEqual([]);
  expect(await page.evaluate(()=>localStorage.getItem("hoe.cart.v1"))).not.toContain("Địa chỉ kiểm thử");
});
test("lost response retries same request ID without duplicate and retains input",async({page})=>{
  await addTam(page);await checkoutDetails(page);
  const ids:string[]=[];let first=true;let secondStatus=0;
  await page.route("**/api/orders",async route=>{
    ids.push(route.request().postDataJSON().requestId);
    const response=await route.fetch();
    if(first){first=false;await route.abort("failed");}
    else{secondStatus=response.status();await route.fulfill({response});}
  });
  await page.getByRole("button",{name:"Gửi yêu cầu đặt hoa",exact:true}).click();
  await expect(page.locator(".error[role='alert']")).toContainText("Chưa xác nhận");
  await expect(page.getByLabel("Họ tên người đặt",{exact:true})).toHaveValue("Khách test");
  expect(JSON.parse((await page.evaluate(()=>localStorage.getItem("hoe.cart.v1")))!).items).toHaveLength(1);
  await page.getByRole("button",{name:"Gửi yêu cầu đặt hoa",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("Hòe đã nhận yêu cầu");
  expect(ids).toHaveLength(2);expect(ids[0]).toBe(ids[1]);expect(secondStatus).toBe(200);
});
test("failed submissions keep cart and edits get a fresh request ID",async({page})=>{
  await addTam(page);await checkoutDetails(page);const ids:string[]=[];
  await page.route("**/api/orders",async route=>{
    ids.push(route.request().postDataJSON().requestId);
    await route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:{message:"Chưa lưu được. Thử lại."}})});
  });
  await page.getByRole("button",{name:"Gửi yêu cầu đặt hoa",exact:true}).click();
  await expect(page.locator(".error[role='alert']")).toContainText("Chưa lưu");
  await page.getByLabel("Ghi chú giao",{exact:true}).fill("Ghi chú đã sửa");
  await page.getByRole("button",{name:"Gửi yêu cầu đặt hoa",exact:true}).click();
  await expect(page.locator(".error[role='alert']")).toContainText("Chưa lưu");
  await expect.poll(()=>ids.length).toBe(2);expect(ids[0]).not.toBe(ids[1]);
  expect(JSON.parse((await page.evaluate(()=>localStorage.getItem("hoe.cart.v1")))!).items).toHaveLength(1);
});
test("Hoa Thời no-sample and general consultation stay separate from orders",async({page})=>{
  await page.goto("/dich-vu/hoa-thoi");
  expect(await page.locator('select[name="planId"],input[name="months"]').count()).toBe(0);
  await page.getByLabel("Họ tên",{exact:true}).fill("Khách tư vấn");
  await page.getByLabel("Số điện thoại",{exact:true}).fill("0901234567");
  await page.getByLabel("Nội dung yêu cầu",{exact:true}).fill("Tôi muốn được tư vấn nhận hoa");
  await page.getByRole("button",{name:"Gửi yêu cầu tư vấn"}).click();
  await expect(page.getByRole("status")).toContainText("yêu cầu tư vấn");
  await page.goto("/lien-he");
  await page.getByLabel("Họ tên",{exact:true}).fill("Khách tư vấn");
  await page.getByLabel("Số điện thoại",{exact:true}).fill("0901234567");
  await page.getByLabel("Nội dung yêu cầu",{exact:true}).fill("Tôi chưa biết chọn hoa");
  await page.getByRole("button",{name:"Gửi yêu cầu tư vấn"}).click();
  await expect(page.getByRole("status")).toContainText("Đây là yêu cầu tư vấn");
  await page.goto("/gio-hang");await expect(page.getByText("Giỏ hoa đang chờ một chút dịu dàng")).toBeVisible();
});
test("comments publish immediately as escaped text and survive a reload",async({page},testInfo)=>{
  await page.goto("/blog/chuyen-cua-hoe");
  const body="<script>window.hoeInjected=true</script> =SUM(1,2) " + testInfo.project.name;
  await page.getByLabel("Tên hiển thị",{exact:true}).fill("=Tên test");
  await page.getByLabel("Bình luận",{exact:true}).fill(body);
  await page.getByRole("button",{name:"Gửi bình luận",exact:true}).click();
  await expect(page.getByText("Bình luận của bạn đã được lưu và công khai.")).toBeVisible();
  await expect(page.locator(".comment").filter({hasText:body})).toHaveCount(1);
  expect(await page.evaluate(()=>("hoeInjected" in window))).toBe(false);
  await page.reload();
  await expect(page.locator(".comment").filter({hasText:body})).toHaveCount(1);
});
test("draft routes remain hidden and forms show readable validation",async({page})=>{
  for(const path of ["/san-pham/mau-test-chua-xuat-ban","/blog/bai-test-chua-xuat-ban","/chinh-sach/ban-hang"]){
    const response=await page.goto(path);expect(response?.status()).toBe(404);
  }
  await page.goto("/san-pham/mau-test-diu-dang");
  await page.getByRole("button",{name:"Thêm vào giỏ hoa"}).click();
  await expect(page.locator(".error[role='alert']")).toBeVisible();
  await expect(page.getByLabel("Cảm xúc muốn gửi",{exact:true})).toBeFocused();
  await page.goto("/dich-vu/hoa-y");
  await page.getByRole("button",{name:"Gửi yêu cầu tư vấn"}).click();
  await expect(page.locator(".error[role='alert']")).toBeVisible();
  expect(await page.locator('input[type="file"]').count()).toBe(0);
});
