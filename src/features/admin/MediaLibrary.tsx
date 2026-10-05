"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
type Media = {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  bytes: number;
};
export function MediaLibrary({
  onSelect,
}: {
  onSelect?: (url: string) => void;
}) {
  const [rows, setRows] = useState<Media[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [alt, setAlt] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [confirm, setConfirm] = useState<Media | null>(null);
  const [page, setPage] = useState(0),
    [hasMore, setHasMore] = useState(false);
  async function refresh(nextPage = 0) {
    const response = await fetch(`/api/admin/media?page=${nextPage}`, {
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error.message);
    setRows((old) => (nextPage ? [...old, ...body.rows] : body.rows));
    setPage(nextPage);
    setHasMore(body.hasMore);
  }
  async function loadMore() {
    setBusy(true);
    try {
      await refresh(page + 1);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Chưa tải được thư viện.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/media", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error.message);
        setRows(body.rows);
        setHasMore(body.hasMore);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setMessage(e.message);
      });
    return () => controller.abort();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !alt.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      if (
        file.size > 5242880 ||
        !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
          file.type,
        )
      )
        throw new Error("Chọn ảnh JPEG, PNG, WebP hoặc AVIF, tối đa 5 MiB.");
      const extension = (
        {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/avif": "avif",
        } as Record<string, string>
      )[file.type];
      const prepare = await fetch("/api/admin/media/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extension }),
      });
      const prepared = await prepare.json();
      if (!prepare.ok) throw new Error(prepared.error.message);
      const blob = await upload(prepared.pathname, file, {
        access: "public",
        handleUploadUrl: "/api/admin/media/upload",
        contentType: file.type,
      });
      const finish = await fetch("/api/admin/media/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url, alt }),
      });
      const result = await finish.json();
      if (!finish.ok) throw new Error(result.error.message);
      await refresh();
      setMessage("Ảnh đã được xác minh và thêm vào thư viện.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Chưa tải được ảnh.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!confirm) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/media/${confirm.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error.message +
            (result.error.details?.references
              ?.map((r: { title: string }) => " " + r.title)
              .join(",") || ""),
        );
      setConfirm(null);
      await refresh();
      setMessage("Đã xóa ảnh.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Chưa xóa được ảnh.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <form onSubmit={submit} className="admin-media-upload">
        <label className="field">
          <span>Ảnh JPEG / PNG / WebP / AVIF, tối đa 5 MiB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <label className="field">
          <span>Mô tả ảnh cho người đọc</span>
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            maxLength={500}
            required
          />
        </label>
        <button className="button" disabled={busy || !file}>
          Tải ảnh lên
        </button>
      </form>
      <p role="status">{message}</p>
      {confirm && (
        <div className="notice" role="alert">
          <p>
            Xóa ảnh “{confirm.alt}”? Shop chỉ xóa được ảnh không có nội dung sử
            dụng.
          </p>
          <button className="button" disabled={busy} onClick={remove}>
            Xác nhận xóa
          </button>{" "}
          <button className="button secondary" onClick={() => setConfirm(null)}>
            Giữ ảnh
          </button>
        </div>
      )}
      <div className="admin-media-grid">
        {rows.map((m) => (
          <figure key={m.id}>
            <Image
              src={m.url}
              alt={m.alt}
              width={m.width}
              height={m.height}
              unoptimized
            />
            <figcaption>
              {m.alt}
              <small>
                {m.width} × {m.height} · {(m.bytes / 1024).toFixed(0)} KiB
              </small>
            </figcaption>
            {onSelect && (
              <button className="button" onClick={() => onSelect(m.url)}>
                Chọn ảnh
              </button>
            )}
            <button className="text-link" onClick={() => setConfirm(m)}>
              Xóa ảnh
            </button>
          </figure>
        ))}
      </div>
      {hasMore && (
        <button className="button secondary" disabled={busy} onClick={loadMore}>
          Xem thêm ảnh
        </button>
      )}
    </div>
  );
}
