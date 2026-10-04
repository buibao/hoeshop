import {beforeEach,afterEach,describe,it,expect,vi} from "vitest";
import {randomUUID} from "node:crypto";
import {POST as order} from "@/app/api/orders/route";
import {POST as inquiry} from "@/app/api/inquiries/route";
import {POST as comment,GET as comments} from "@/app/api/comments/route";
import {getProducts} from "@/server/content";
import {resetMock} from "@/server/integrations/mock";
import {configurationSchema} from "@/domain/schemas";
const req=(path:string,body:unknown)=>new Request("http://localhost:3000/api/"+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
beforeEach(()=>{vi.stubEnv("CONTENT_MODE","test");vi.stubEnv("DATA_ADAPTER","mock");resetMock();});
afterEach(()=>vi.unstubAllEnvs());
function orderInput(){
  const p=getProducts().find(p=>p.serviceType==="hoa-tam")!;
  return {requestId:randomUUID(),buyer:{name:"Người đặt test",phone:"0901234567"},recipient:{name:"Người nhận test"},address:"Địa chỉ test",items:[{lineId:randomUUID(),productId:p.id,expectedRevision:p.revision,quantity:1,configuration:configurationSchema.parse({serviceType:"hoa-tam",emotion:"Biết ơn"})}]};
}
describe("website API",()=>{
  it("receives once, replays the same receipt, rejects ID reuse",async()=>{
    const input=orderInput();
    const first=await order(req("orders",input));expect(first.status).toBe(201);
    expect(await first.json()).toEqual({requestId:input.requestId,status:"received"});
    const retry=await order(req("orders",input));expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual({requestId:input.requestId,status:"received"});
    expect((await order(req("orders",{...input,address:"Changed"}))).status).toBe(409);
  });
  it("requires price review, rejects draft and forged prices",async()=>{
    const input=orderInput();
    expect((await order(req("orders",{...input,items:[{...input.items[0],expectedRevision:"old"}]}))).status).toBe(409);
    expect((await order(req("orders",{...input,items:[{...input.items[0],productId:"test-draft"}]}))).status).toBe(422);
    expect((await order(req("orders",{...input,items:[{...input.items[0],price:0}]}))).status).toBe(422);
  });
  it("consultation remains independent of orders",async()=>{
    const requestId=randomUUID();
    const body={requestId,name:"Test",phone:"0901234567",serviceType:"hoa-thoi",body:"Tôi muốn nhận hoa định kỳ"};
    expect((await inquiry(req("inquiries",body))).status).toBe(201);
    // The same ID can be a separate order because resources are independent.
    expect((await order(req("orders",{...orderInput(),requestId}))).status).toBe(201);
  });
  it("publishes plain text comments, deduplicates, limits DTO and rejects draft posts",async()=>{
    const input={requestId:randomUUID(),postId:"chuyen-cua-hoe",displayName:"Test",body:"<script>alert(1)</script>"};
    const first=await comment(req("comments",input));expect(first.status).toBe(201);
    expect((await first.json()).body).toBe(input.body);
    await comment(req("comments",input));
    const response=await comments(new Request("http://localhost:3000/api/comments?postId=chuyen-cua-hoe"));
    const page=await response.json();expect(page.comments).toHaveLength(1);
    expect(Object.keys(page.comments[0]).sort()).toEqual(["body","commentId","createdAt","displayName","postId"]);
    expect((await comment(req("comments",{...input,requestId:randomUUID(),postId:"test-draft-blog"}))).status).toBe(422);
    expect((await comment(req("comments",{...input,honeypot:"bot"}))).status).toBe(422);
  });
  it("does not claim success when shop is closed or gateway is missing",async()=>{
    vi.stubEnv("DATA_ADAPTER","sheets");vi.stubEnv("SHEETS_GATEWAY_URL","");vi.stubEnv("SHEETS_GATEWAY_SECRET","");
    expect((await comments(new Request("http://localhost:3000/api/comments?postId=chuyen-cua-hoe"))).status).toBe(503);
    vi.stubEnv("CONTENT_MODE","live");vi.stubEnv("SHOP_LIVE","false");
    expect((await inquiry(req("inquiries",{requestId:randomUUID(),name:"Test",phone:"0901234567",serviceType:"tu-van",body:"Help"}))).status).toBe(503);
  });
  it("rejects malformed JSON, foreign origins and oversized inputs",async()=>{
    expect((await order(new Request("http://localhost:3000/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:"{"}))).status).toBe(400);
    expect((await order(new Request("http://localhost:3000/api/orders",{method:"POST",headers:{"Content-Type":"application/json",Origin:"https://evil.example"},body:JSON.stringify(orderInput())}))).status).toBe(400);
    expect((await order(req("orders",{body:"a".repeat(70000)}))).status).toBe(422);
  });
});
