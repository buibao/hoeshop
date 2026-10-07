"use client";
import { useEffect, useState } from "react";

export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.origin !== location.origin ||
        anchor.pathname + anchor.search === location.pathname + location.search) return;
      if (!window.confirm("Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [dirty]);
}

export function useSettingsEditor<T, Latest extends { editVersion: number }>(endpoint: string, initial: T, initialVersion: number) {
  const [data, setData] = useState(initial);
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const [version, setVersion] = useState(initialVersion);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState(false);
  const [latest, setLatest] = useState<Latest | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const dirty = JSON.stringify(data) !== baseline;
  useUnsavedChanges(dirty);
  function change(next: T) { setData(next); setMessage(""); setErrors({}); }
  async function save(payload: Record<string, unknown>) {
    setSaving(true); setMessage(""); setErrors({});
    try {
      const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, editVersion: version }) });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.error?.message || "Chưa lưu được. Nội dung đang nhập được giữ nguyên.");
        setErrors(Object.fromEntries((body.error?.fields || []).map((f: { path: string; message: string }) => [f.path, f.message])));
        setConflict(response.status === 409); setLatest(null);
        return;
      }
      setVersion(body.editVersion); setBaseline(JSON.stringify(data));
      setConflict(false); setLatest(null); setMessage("Đã lưu thay đổi.");
    } catch { setMessage("Chưa lưu được. Nội dung đang nhập được giữ nguyên."); }
    finally { setSaving(false); }
  }
  async function review() {
    setReviewing(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error();
      setLatest(body);
    } catch { setMessage("Chưa tải được bản mới. Nội dung đang nhập được giữ nguyên."); }
    finally { setReviewing(false); }
  }
  function resolve(next: T, keepMine: boolean) {
    if (!latest) return;
    setVersion(latest.editVersion);
    setBaseline(JSON.stringify(next));
    if (!keepMine) setData(next);
    setConflict(false); setLatest(null); setErrors({});
    setMessage(keepMine ? "Đã đối chiếu phiên bản mới. Kiểm tra lựa chọn rồi bấm lưu lại." : "Đã tải bản mới nhất.");
  }
  return { data, change, saving, save, dirty, message, errors, conflict, latest, reviewing, review, resolve };
}
