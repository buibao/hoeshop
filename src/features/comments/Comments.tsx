"use client";
import { useCallback,useEffect,useState } from "react";
import { commentSchema,type CommentPage,type PublicComment } from "@/domain/schemas";
import { Field,Honeypot } from "@/components/Fields";
import { useSubmission } from "@/features/checkout/useSubmission";
export function Comments({postId}: {postId:string}) {
  const [comments,setComments]=useState<PublicComment[]>([]); const [cursor,setCursor]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);const [readError,setReadError]=useState("");
  const submission=useSubmission<PublicComment>("/api/comments");
  const load=useCallback(async (next:string|null=null,signal?:AbortSignal)=>{
    try {
      const response=await fetch("/api/comments?postId="+encodeURIComponent(postId)+(next ? "&cursor="+encodeURIComponent(next) : ""),{cache:"no-store",signal});
      const data=await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Chưa tải được bình luận.");
      const page=data as CommentPage;
      setReadError("");
      setComments(prev=>next ? [...prev,...page.comments.filter(c=>!prev.some(p=>p.commentId===c.commentId))] : page.comments);
      setCursor(page.nextCursor);
    } catch (e) {
      if (e instanceof Error && e.name==="AbortError") return;
      setReadError(e instanceof Error ? e.message : "Chưa tải được bình luận.");
    } finally {if (!signal?.aborted) setLoading(false);}
  },[postId]);
  function reload(next: string | null = null) { setLoading(true); setReadError(""); void load(next); }
  useEffect(()=>{
    const controller=new AbortController();
    // Async network synchronization: state changes only after the fetch settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(null,controller.signal);
    return ()=>controller.abort();
  },[load]);
  async function handleSubmit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();const form=e.currentTarget,data=new FormData(form);
    const comment=await submission.submit({postId,displayName:String(data.get("displayName")||""),body:String(data.get("body")||""),honeypot:String(data.get("honeypot")||"")},commentSchema,form);
    if(comment) {
      form.reset();
      setComments(prev=>[comment,...prev.filter(c=>c.commentId!==comment.commentId)]);
      setReadError("");
    }
  }
  return <section className="comments" aria-label="Bình luận bài viết"><h2>Một lời gửi lại Hòe</h2><p>Bình luận được công khai ngay sau khi lưu. Tên hiển thị do người viết tự nhập, chưa được xác minh.</p>
    <form onSubmit={handleSubmit} noValidate onChange={()=>{if(submission.phase==="success")submission.reset();}}>
      <fieldset disabled={submission.phase==="submitting" || loading}><div className="form-grid">
        <Field name="displayName" label="Tên hiển thị" required full maxLength={80} errors={submission.errors}/>
        <Field name="body" label="Bình luận" required multiline full maxLength={1500} errors={submission.errors}/>
      </div><Honeypot/>
      {submission.error ? <div className="error" role="alert">{submission.error}</div> : null}
      {submission.phase==="success" ? <p className="success" role="status">Bình luận của bạn đã được lưu và công khai.</p> : null}
      <button className="button" type="submit" style={{marginTop:18}}>{submission.phase==="submitting" ? "Đang gửi…" : "Gửi bình luận"}</button>
      </fieldset>
    </form>
    <div style={{marginTop:30}}><button className="link-button" onClick={()=>reload()} disabled={loading}>Tải lại bình luận</button></div>
    {readError ? <div className="error" role="alert">{readError} <button className="link-button" onClick={()=>reload()}>Thử lại</button></div> : null}
    {loading ? <p role="status" className="form-note">Đang tải bình luận…</p> : !comments.length && !readError ? <p className="form-note">Chưa có bình luận. Bạn có thể là người đầu tiên gửi một lời dịu dàng.</p> : null}
    {comments.map(c=><article className="comment" key={c.commentId}><div className="comment-header"><strong>{c.displayName}</strong><time dateTime={c.createdAt}>{new Intl.DateTimeFormat("vi-VN",{dateStyle:"short",timeStyle:"short",timeZone:"Asia/Ho_Chi_Minh"}).format(new Date(c.createdAt))}</time></div><p>{c.body}</p></article>)}
    {cursor ? <button className="button secondary" style={{marginTop:25}} onClick={()=>reload(cursor)} disabled={loading}>Xem thêm bình luận</button> : null}
  </section>;
}
