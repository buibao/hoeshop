"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, X } from "lucide-react";
import { priceLabel } from "@/domain/pricing";
import type { Product } from "@/domain/schemas";
import { imageSource } from "@/domain/content";
import { selectionCount, type SelectionKind } from "@/domain/home-products";
import { useSettingsEditor } from "./useSettingsEditor";

export type ProductOption = Pick<Product, "id" | "name" | "image" | "imageAlt" | "price"> & { publicationStatus: string; eligible: boolean };
export type HomeSelection = { editVersion: number; productIds: string[]; products: ProductOption[] };
function Thumbnail({ product }: { product?: ProductOption }) {
  const src = product?.image && imageSource.safeParse(product.image).success ? product.image : "/images/floral-mark.svg";
  return <span className="admin-product-thumbnail"><Image src={src} alt={product?.imageAlt || product?.name || "Sản phẩm không còn hợp lệ"} fill sizes="72px" /></span>;
}
export function HomeProductPicker({ kind, initial }: { kind: SelectionKind; initial: HomeSelection }) {
  const count = selectionCount[kind];
  const editor = useSettingsEditor<string[], HomeSelection>(`/api/admin/home/${kind}`, initial.productIds, initial.editVersion);
  const [known, setKnown] = useState<Record<string, ProductOption>>(() => Object.fromEntries(initial.products.map((p) => [p.id, p])));
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setLoadError("");
      try {
        const response = await fetch(`/api/admin/product-options?${new URLSearchParams({ q: query, page: String(page) })}`, { signal: controller.signal, cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || "Chưa tải được sản phẩm.");
        if (controller.signal.aborted) return;
        setOptions(body.products); setHasMore(body.hasMore);
        setKnown((current) => ({ ...current, ...Object.fromEntries(body.products.map((p: ProductOption) => [p.id, p])) }));
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Chưa tải được sản phẩm.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, page, retry]);
  const invalid = editor.data.some((id) => !known[id]?.eligible);
  const canSave = (kind === "hero" ? editor.data.length === count : editor.data.length <= count) && new Set(editor.data).size === editor.data.length && !invalid;
  function move(index: number, direction: number) {
    const next = [...editor.data];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    editor.change(next);
  }
  function resolveLatest(keepMine: boolean) {
    const latest = editor.latest;
    if (!latest) return;
    if (!keepMine && !window.confirm("Thay lựa chọn đang nhập bằng bản mới nhất?")) return;
    setKnown((current) => ({ ...current, ...Object.fromEntries(latest.products.map((p) => [p.id, p])) }));
    editor.resolve(latest.productIds, keepMine);
  }
  return <>
    <Link className="text-link" href="/admin/settings">← Website</Link>
    <h1 className="admin-title">{kind === "hero" ? "Sản phẩm Hero" : "Sản phẩm nổi bật"}</h1>
    <p className="admin-hint">{kind === "hero" ? "Chọn đủ 3 sản phẩm công khai có ảnh hợp lệ theo thứ tự Ảnh 1, Ảnh 2, Ảnh 3. Giữ bố cục ảnh đầu trang hiện tại." : "Chọn và sắp xếp tối đa 10 sản phẩm công khai có ảnh hợp lệ cho slider trên trang chủ. Có thể lưu ít hơn 10; bỏ hết và lưu để ẩn danh sách sản phẩm nổi bật."}</p>
    <form className="admin-editor" onSubmit={(event) => { event.preventDefault(); if (canSave) void editor.save({ productIds: editor.data }); }}>
      <fieldset disabled={editor.saving}>
        <section className="admin-panel" aria-labelledby="selected-products-title">
          <div className="admin-panel-heading"><h2 id="selected-products-title">Đã chọn <span aria-live="polite">{editor.data.length}/{count}</span></h2></div>
          {invalid && <p role="alert" className="admin-warning">Có sản phẩm không còn hợp lệ. Bỏ mục đó và chọn lại trước khi lưu.</p>}
          <ol className="admin-selected-products">
            {editor.data.map((id, index) => <li key={id} className="admin-selected-product">
              <Thumbnail product={known[id]} />
              <div className="admin-product-copy"><strong>{kind === "hero" ? "Ảnh" : "Vị trí"} {index + 1}</strong><p>{known[id]?.name || "Sản phẩm không còn tồn tại"}</p>
                {known[id] && <small>{priceLabel(known[id].price)} · {known[id].eligible ? "Công khai" : "Không còn hợp lệ — cần chọn lại"}</small>}</div>
              <div className="admin-product-actions">
                <button type="button" className="icon-button" aria-label={`Đưa sản phẩm vị trí ${index + 1} lên`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={18} /></button>
                <button type="button" className="icon-button" aria-label={`Đưa sản phẩm vị trí ${index + 1} xuống`} disabled={index === editor.data.length - 1} onClick={() => move(index, 1)}><ArrowDown size={18} /></button>
                <button type="button" className="icon-button" aria-label={`Bỏ sản phẩm vị trí ${index + 1}`} onClick={() => editor.change(editor.data.filter((_, i) => i !== index))}><X size={18} /></button>
              </div>
            </li>)}
          </ol>
          {!editor.data.length && <p>Chưa chọn sản phẩm. Cấu hình hiện tại vẫn được giữ đến khi bạn lưu.</p>}
        </section>
        <section className="admin-panel" aria-labelledby="product-options-title">
          <h2 id="product-options-title">Chọn từ catalog</h2>
          <label className="field"><span>Tìm theo tên sản phẩm</span><input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); setLoading(true); }} /></label>
          {loading && <p role="status">Đang tải sản phẩm…</p>}
          {loadError && <div role="alert"><p>{loadError}</p><button className="button secondary" type="button" onClick={() => setRetry((n) => n + 1)}>Thử lại</button></div>}
          {!loading && !loadError && <>
            <div className="admin-product-options">{options.map((p) => {
              const selected = editor.data.includes(p.id);
              return <label className={`admin-product-option${selected ? " is-selected" : ""}`} key={p.id}>
                <input type="checkbox" checked={selected} disabled={!selected && (!p.eligible || editor.data.length >= count)} onChange={() => editor.change(selected ? editor.data.filter((id) => id !== p.id) : [...editor.data, p.id])} />
                <Thumbnail product={p} /><span className="admin-product-copy"><strong>{p.name}</strong><span>{priceLabel(p.price)}</span><small>{p.eligible ? "Công khai" : p.publicationStatus === "published" ? "Ảnh không hợp lệ" : p.publicationStatus === "draft" ? "Bản nháp — chưa thể chọn" : "Đã lưu trữ — chưa thể chọn"}</small></span>
              </label>;
            })}</div>
            {!options.length && <p>Không tìm thấy sản phẩm phù hợp.</p>}
          </>}
          <nav className="admin-pagination" aria-label="Phân trang sản phẩm">
            <button className="button secondary" type="button" disabled={page === 0 || loading} onClick={() => { setPage((n) => n - 1); setLoading(true); }}>Trang trước</button>
            <span>Trang {page + 1}</span>
            <button className="button secondary" type="button" disabled={!hasMore || loading} onClick={() => { setPage((n) => n + 1); setLoading(true); }}>Trang sau</button>
          </nav>
        </section>
        <div className="admin-save"><button className="button" type="submit" disabled={!canSave || editor.conflict}>{editor.saving ? "Đang lưu…" : "Lưu lựa chọn"}</button><Link className="text-link" href="/" target="_blank">Xem trang chủ</Link></div>
        {!canSave && <p className="admin-hint">{kind === "hero" ? "Chọn đủ 3" : "Chọn tối đa 10"} sản phẩm khác nhau, công khai và có ảnh hợp lệ để lưu.</p>}
        {editor.dirty && <p className="admin-hint">Có thay đổi chưa lưu.</p>}
      </fieldset>
      <p role="status">{editor.message}</p>
      {Object.values(editor.errors).map((error, i) => <p role="alert" key={i}>{error}</p>)}
      {editor.conflict && <section className="admin-warning"><p>Home đã được sửa ở nơi khác. Lựa chọn đang nhập được giữ nguyên. Tải bản mới để đối chiếu.</p>
        <button type="button" className="button secondary" disabled={editor.reviewing} onClick={editor.review}>{editor.reviewing ? "Đang tải…" : "Xem bản mới nhất"}</button>
        {editor.latest && <><h3>Lựa chọn đã lưu gần nhất</h3><ol>{editor.latest.productIds.map((id, i) => <li key={id}>{editor.latest!.products.find((p) => p.id === id)?.name || `Sản phẩm vị trí ${i + 1} không còn tồn tại`}</li>)}</ol>
          <button type="button" className="button secondary" onClick={() => resolveLatest(false)}>Dùng bản mới nhất</button>{" "}<button type="button" className="button secondary" onClick={() => resolveLatest(true)}>Đã đối chiếu, giữ lựa chọn đang nhập</button>
        </>}
      </section>}
    </form>
  </>;
}
