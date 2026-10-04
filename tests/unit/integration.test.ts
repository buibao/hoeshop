import {describe,it,expect,beforeEach,afterEach,vi} from "vitest";
import {randomUUID} from "node:crypto";
import {signEnvelope,verifyEnvelope,hashPayload} from "@/server/integrations/signing";
import {MockRepository,resetMock} from "@/server/integrations/mock";
import {getRepositories} from "@/server/repositories";
import {SheetsRepository} from "@/server/integrations/sheets";
describe("signing",()=>{
  it("detects tampering and stale signatures; hashes object order consistently",()=>{
    const now=Date.now(),signed=signEnvelope({action:"create",value:1},"test-secret",now);
    expect(verifyEnvelope(signed,"test-secret",now)).toBe(true);
    expect(verifyEnvelope(signed,"wrong",now)).toBe(false);
    expect(verifyEnvelope(signed,"test-secret",now+301000)).toBe(false);
    expect(verifyEnvelope({...signed,payload:'{"action":"create","value":2}'},"test-secret",now)).toBe(false);
    expect(hashPayload({a:1,b:2})).toBe(hashPayload({b:2,a:1}));
  });
});
describe("repository boundaries",()=>{
  beforeEach(()=>resetMock());afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
  it("deduplicates persisted retry and conflicts on changed payload",async()=>{
    const repo=new MockRepository(),requestId=randomUUID(),context={requestId,payloadHash:hashPayload("same"),rateKey:"test"};
    const input={requestId,postId:"chuyen-cua-hoe",displayName:"Test",body:"Xin chào",honeypot:"" as const};
    const first=await repo.saveComment(input,context);
    expect(await repo.saveComment(input,context)).toEqual(first);
    expect((await repo.listComments(input.postId,null)).comments).toHaveLength(1);
    await expect(repo.saveComment(input,{...context,payloadHash:hashPayload("different")})).rejects.toMatchObject({status:409});
  });
  it("uses shared rate state across repository instances and lets saved retries through",async()=>{
    const repo1=new MockRepository(),repo2=new MockRepository(),contexts=[];
    for(let i=0;i<5;i++){
      const context={requestId:randomUUID(),payloadHash:hashPayload(i),rateKey:"shared"};contexts.push(context);
      await repo1.saveComment({requestId:context.requestId,postId:"p",displayName:"Test",body:String(i),honeypot:""},context);
    }
    const next={requestId:randomUUID(),payloadHash:hashPayload(9),rateKey:"shared"};
    await expect(repo2.saveComment({requestId:next.requestId,postId:"p",displayName:"Test",body:"6",honeypot:""},next)).rejects.toMatchObject({status:429});
    await expect(repo2.saveComment({requestId:contexts[0].requestId,postId:"p",displayName:"Test",body:"0",honeypot:""},contexts[0])).resolves.toBeTruthy();
  });
  it("refuses mock outside local test mode",()=>{
    vi.stubEnv("DATA_ADAPTER","mock");vi.stubEnv("CONTENT_MODE","live");expect(()=>getRepositories()).toThrow("local");
    vi.stubEnv("CONTENT_MODE","test");vi.stubEnv("VERCEL","1");expect(()=>getRepositories()).toThrow("local");
  });
  it("returns no success when Sheets is unconfigured or times out",async()=>{
    vi.stubEnv("SHEETS_GATEWAY_URL","");vi.stubEnv("SHEETS_GATEWAY_SECRET","");
    const repo=new SheetsRepository();
    await expect(repo.listComments("p",null)).rejects.toMatchObject({status:503});
    vi.stubEnv("SHEETS_GATEWAY_URL","https://script.google.com/test");vi.stubEnv("SHEETS_GATEWAY_SECRET","test-only");
    vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("private upstream error")));
    await expect(repo.listComments("p",null)).rejects.toMatchObject({status:503});
  });
});
