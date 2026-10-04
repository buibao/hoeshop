import fs from "node:fs";
import vm from "node:vm";
import {createHmac,randomUUID} from "node:crypto";
import {describe,it,expect} from "vitest";
import {hashPayload,signEnvelope} from "@/server/integrations/signing";
type Row=(string|number)[]; type Sheet={rows:Row[];getLastRow:()=>number;getRange:(r:number,c:number,n:number,m:number)=>{getValues:()=>Row[];setNumberFormat:(s:string)=>void;setValues:(values:Row[])=>void};setFrozenRows:(n:number)=>void};
type Shared={props:Map<string,string>;sheets:Map<string,Sheet>;locked:boolean;flushFails:boolean;formulaCells:string[]};
function shared():Shared{return {props:new Map([["SHEET_ID","sheet-test"],["GATEWAY_SECRET","gateway-test-secret"]]),sheets:new Map(),locked:false,flushFails:false,formulaCells:[]};}
function createSheet(state:Shared):Sheet{
  const rows:Row[]=[];
  return {rows,getLastRow:()=>rows.length,setFrozenRows:()=>{},getRange:(r,c,n,m)=>({
    getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>rows[r-1+i]?.[c-1+j]??"")),
    setNumberFormat:()=>{},
    setValues:(values:Row[])=>{
      values.forEach((row,i)=>{
        rows[r-1+i]||=[];
        row.forEach((value,j)=>{
          if(typeof value==="string" && /^[\s]*[=+\-@]/.test(value))state.formulaCells.push(value);
          // Sheets treats a leading apostrophe as the literal-text escape.
          rows[r-1+i][c-1+j]=typeof value==="string" && value.startsWith("'") ? value.slice(1) : value;
        });
      });
    },
  })};
}
function gateway(state=shared()){
  const book={getSheetByName:(name:string)=>state.sheets.get(name)||null,insertSheet:(name:string)=>{const sheet=createSheet(state);state.sheets.set(name,sheet);return sheet;}};
  let ownsLock=false;
  const sandbox={
    Date,JSON,Number,String,Object,Array,Math,Error,
    PropertiesService:{getScriptProperties:()=>({
      getProperty:(key:string)=>state.props.get(key)||null,
      setProperty:(key:string,value:string)=>{state.props.set(key,value);},
      deleteProperty:(key:string)=>{state.props.delete(key);},
      getProperties:()=>Object.fromEntries(state.props),
    })},
    LockService:{getScriptLock:()=>({
      tryLock:()=>{if(state.locked)return false;state.locked=true;ownsLock=true;return true;},
      waitLock:()=>{if(state.locked)throw new Error("busy");state.locked=true;ownsLock=true;},
      hasLock:()=>ownsLock,
      releaseLock:()=>{if(ownsLock){state.locked=false;ownsLock=false;}},
    })},
    SpreadsheetApp:{openById:()=>book,flush:()=>{if(state.flushFails)throw new Error("flush response lost");}},
    Utilities:{Charset:{UTF_8:"utf8"},computeHmacSha256Signature:(value:string,secret:string)=>[...createHmac("sha256",secret).update(value).digest()],
      formatDate:(date:Date)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit"}).format(date)},
    ContentService:{MimeType:{JSON:"json"},createTextOutput:(text:string)=>({setMimeType:()=>text})},
  };
  const context=vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync("integrations/google-sheets/Code.gs","utf8"),context);
  const call=(payload:unknown)=>JSON.parse(context.doPost({postData:{contents:JSON.stringify(signEnvelope(payload,"gateway-test-secret"))}}));
  context.initializeHoeSheets();
  return {state,context,call};
}
function commentPayload(index=0,key="a".repeat(64)){
  const requestId=randomUUID();
  return {action:"create",resource:"Comments",requestId,payloadHash:hashPayload({index,requestId}),rateKey:key,
    record:{requestId,postId:"chuyen-cua-hoe",displayName:"Test",body:"Bình luận "+index,honeypot:""}};
}
function column(sheet:Sheet,key:string){return sheet.rows[0].indexOf(key);}
describe("actual Apps Script gateway",()=>{
  it("verifies signature and timestamp before accessing records",()=>{
    const g=gateway(),payload=commentPayload();
    const envelope=signEnvelope(payload,"wrong-secret");
    const result=JSON.parse(g.context.doPost({postData:{contents:JSON.stringify(envelope)}}));
    expect(result).toMatchObject({ok:false,status:401});
    const expired=signEnvelope(payload,"gateway-test-secret",Date.now()-301000);
    expect(JSON.parse(g.context.doPost({postData:{contents:JSON.stringify(expired)}})).status).toBe(401);
    expect(JSON.parse(g.context.doGet()).status).toBe(405);
    expect(g.state.sheets.get("Comments")!.rows).toHaveLength(1);
  });
  it("check-and-write persists once across fresh gateway instances",()=>{
    const state=shared(),first=gateway(state),second=gateway(state),payload=commentPayload();
    const received=first.call(payload);expect(received.ok).toBe(true);
    expect(second.call(payload).data).toEqual(received.data);
    expect(state.sheets.get("Comments")!.rows).toHaveLength(2);
    expect(second.call({...payload,payloadHash:hashPayload("different")})).toMatchObject({ok:false,status:409});
  });
  it("retries a lost response without a duplicate row",()=>{
    const g=gateway(),payload=commentPayload();g.state.flushFails=true;
    expect(g.call(payload)).toMatchObject({ok:false,status:503});
    g.state.flushFails=false;
    const received=g.call(payload);expect(received.ok).toBe(true);
    expect(g.state.sheets.get("Comments")!.rows).toHaveLength(2);
  });
  it("requires ScriptLock and releases only the lock it owns",()=>{
    const g=gateway();g.state.locked=true;
    expect(g.call(commentPayload())).toMatchObject({ok:false,status:503,code:"LOCK_BUSY"});
    expect(g.state.sheets.get("Comments")!.rows).toHaveLength(1);
    expect(g.state.locked).toBe(true);
    g.state.locked=false;expect(g.call(commentPayload()).ok).toBe(true);
    expect(g.state.locked).toBe(false);
  });
  it("has shared rate state across instances; dedup precedes rate checks",()=>{
    const state=shared(),one=gateway(state),two=gateway(state),payloads=[];
    for(let i=0;i<5;i++){const p=commentPayload(i);payloads.push(p);expect(one.call(p).ok).toBe(true);}
    expect(two.call(commentPayload(6))).toMatchObject({status:429});
    expect(two.call(payloads[0]).ok).toBe(true);
    const rates=[...state.props.entries()].filter(([k])=>k.startsWith("rate:"));expect(rates).toHaveLength(1);
    state.props.set(rates[0][0],JSON.stringify({count:5,until:Date.now()-100}));
    expect(two.call(commentPayload(7)).ok).toBe(true);
  });
  it("neutralizes formulas while returning plain original text",()=>{
    const g=gateway(),p=commentPayload();p.record.displayName="=HYPERLINK(test)";p.record.body=" +SUM(1,2)";
    const saved=g.call(p);
    expect(saved.data.displayName).toBe(p.record.displayName);
    expect(g.state.formulaCells).toEqual([]);
    const page=g.call({action:"listComments",postId:p.record.postId,cursor:null});
    expect(page.data.comments[0].body).toBe(p.record.body);
    expect(Object.keys(page.data.comments[0]).sort()).toEqual(["body","commentId","createdAt","displayName","postId"]);
  });
  it("filters by post, paginates, and hides immediately even when cursor is hidden",()=>{
    const g=gateway(),ids=[];
    for(let i=0;i<23;i++){const p=commentPayload(i,String(i).padStart(64,"a"));expect(g.call(p).ok).toBe(true);ids.push(p.requestId);}
    const other=commentPayload(99,"b".repeat(64));other.record.postId="other-post";g.call(other);
    const first=g.call({action:"listComments",postId:"chuyen-cua-hoe",cursor:null}).data;
    expect(first.comments).toHaveLength(20);expect(first.comments[0].commentId).toBe(ids[22]);
    const sheet=g.state.sheets.get("Comments")!,idCol=column(sheet,"commentId"),statusCol=column(sheet,"status");
    sheet.rows.find(r=>r[idCol]===first.nextCursor)![statusCol]="Hidden";
    expect(g.call({action:"listComments",postId:"chuyen-cua-hoe",cursor:first.nextCursor}).data.comments).toHaveLength(3);
    const fresh=g.call({action:"listComments",postId:"chuyen-cua-hoe",cursor:null}).data;
    expect(fresh.comments.some((c:{commentId:string})=>c.commentId===first.nextCursor)).toBe(false);
    const hiddenId=first.nextCursor;
    const hiddenRow=sheet.rows.find(r=>r[idCol]===hiddenId)!;
    expect(g.call({action:"create",resource:"Comments",requestId:hiddenId,payloadHash:hiddenRow[column(sheet,"payloadHash")],rateKey:"a".repeat(64)})).toMatchObject({status:409,code:"COMMENT_HIDDEN"});
    expect(g.call({action:"listComments",postId:"chuyen-cua-hoe",cursor:randomUUID()})).toMatchObject({status:422});
  });
  it("validates honeypot and unknown actions without exposing orders",()=>{
    const g=gateway(),payload=commentPayload();
    payload.record.honeypot="bot";expect(g.call(payload)).toMatchObject({status:422});
    expect(g.call({action:"listOrders"})).toMatchObject({status:422});
  });
  it("keeps an order snapshot canonical and returns only its receipt",()=>{
    const g=gateway(),requestId=randomUUID();
    const record={requestId,createdAt:new Date().toISOString(),status:"received",buyer:{name:"Test",phone:"0901234567",email:""},
      recipient:{name:"Test",phone:"0901234567"},address:"Địa chỉ test",notes:"=formula",shipping:"pending",
      items:[{productId:"p",name:"Mẫu test",revision:"v1",quantity:1,configuration:{serviceType:"hoa-thoi"},price:{mode:"quote"}}],
      totals:{min:0,max:0,quoteCount:1,pricedCount:0}};
    const p={action:"create",resource:"Orders",requestId,payloadHash:hashPayload(record),rateKey:"f".repeat(64),record};
    const received=g.call(p);expect(received.data).toEqual({requestId,status:"received"});
    const sheet=g.state.sheets.get("Orders")!;
    expect(JSON.parse(String(sheet.rows[1][column(sheet,"snapshot")]))).toEqual(record);
    sheet.rows[1][column(sheet,"status")]="confirmed";
    expect(g.call({...p,action:"lookup"}).data).toEqual({requestId,status:"received"});
    expect(g.state.formulaCells).toEqual([]);
    const invalid={...p,requestId:randomUUID(),record:{...record,requestId:"different"}};
    expect(g.call(invalid)).toMatchObject({status:422});
  });
});
