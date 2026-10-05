"use client";
import { Form } from "@/components/ui/Form";
import { Action } from "@/components/ui/Action";

import { useEffect, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { FileUpload } from "@/components/untitled/application/file-upload/file-upload-base";
import { Input } from "@/components/untitled/base/input/input";
import { LibraryDialog } from "@/components/ui/LibraryDialog";
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
    [confirm, setConfirm] = useState<Media | null>(null),
    [progress, setProgress] = useState(0),
    [verifying, setVerifying] = useState(false);
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
    setProgress(0);
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
        onUploadProgress: (event) => setProgress(event.percentage),
      });
      setVerifying(true);
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
      setVerifying(false);
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
      <Form
        onSubmit={submit}
        className="admin-media-upload flex flex-col gap-4"
      >
        <FileUpload.DropZone
          hint="JPEG, PNG, WebP hoặc AVIF, tối đa 5 MiB"
          accept="image/jpeg,image/png,image/webp,image/avif"
          allowsMultiple={false}
          maxSize={5242880}
          isDisabled={busy}
          onDropFiles={(files) => {
            setFile(files[0] || null);
            setProgress(0);
            setMessage("");
          }}
          onDropUnacceptedFiles={() => {
            setFile(null);
            setMessage("Chọn ảnh JPEG, PNG, WebP hoặc AVIF.");
          }}
          onSizeLimitExceed={() => {
            setFile(null);
            setMessage("Ảnh vượt quá 5 MiB.");
          }}
        />
        {file && (
          <FileUpload.List>
            <FileUpload.ListItemProgressBar
              name={file.name}
              size={file.size}
              progress={progress}
              onDelete={busy ? undefined : () => setFile(null)}
            />
          </FileUpload.List>
        )}
        {verifying && (
          <p role="status">Đang xác minh bytes và định dạng ảnh…</p>
        )}
        <Input
          size="md"
          label="Mô tả ảnh cho người đọc"
          value={alt}
          onChange={setAlt}
          maxLength={500}
          isRequired
          isDisabled={busy}
        />
        <Action className="button" disabled={busy || !file}>
          Tải ảnh lên
        </Action>
      </Form>
      <p role="status">{message}</p>
      <LibraryDialog
        title="Xóa ảnh"
        busy={busy}
        open={Boolean(confirm)}
        close={() => {
          if (!busy) setConfirm(null);
        }}
      >
        <p>
          Xóa ảnh “{confirm?.alt}”? Shop chỉ xóa được ảnh không có nội dung sử
          dụng.
        </p>
        {message && (
          <p role="alert" className="text-sm text-error-primary">
            {message}
          </p>
        )}
        <Action
          className="button"
          disabled={busy}
          isLoading={busy}
          onClick={remove}
        >
          Xác nhận xóa
        </Action>{" "}
        <Action
          className="button secondary"
          disabled={busy}
          onClick={() => setConfirm(null)}
        >
          Giữ ảnh
        </Action>
      </LibraryDialog>
      <div className="admin-media-grid mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
              <Action className="button" onClick={() => onSelect(m.url)}>
                Chọn ảnh
              </Action>
            )}
            <Action
              className="text-link"
              onClick={() => {
                setMessage("");
                setConfirm(m);
              }}
            >
              Xóa ảnh
            </Action>
          </figure>
        ))}
      </div>
      {hasMore && (
        <Action className="button secondary" disabled={busy} onClick={loadMore}>
          Xem thêm ảnh
        </Action>
      )}
    </div>
  );
}
