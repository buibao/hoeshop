"use client";
import Link from "next/link";
import { contactEditorData, socialPlatforms, type SiteContent } from "@/domain/contact";
import { AdminField } from "./AdminField";
import { useSettingsEditor } from "./useSettingsEditor";

type ContactSettings = Pick<SiteContent, "contact" | "social"> & { editVersion: number };
export function SiteContactEditor({ initial }: { initial: ContactSettings }) {
  const toData = (value: ContactSettings) => contactEditorData(value);
  const editor = useSettingsEditor<ReturnType<typeof contactEditorData>, ContactSettings>("/api/admin/settings/site/contact", toData(initial), initial.editVersion);
  function change(path: string, value: unknown) {
    const next = structuredClone(editor.data);
    const parts = path.split(".");
    if (parts[0] === "contact") next.contact[parts[1] as keyof typeof next.contact] = String(value);
    else next.social[parts[1] as (typeof socialPlatforms)[number]][parts[2] as "label" | "url"] = String(value);
    editor.change(next);
  }
  function resolve(keepMine: boolean) {
    if (!editor.latest) return;
    if (!keepMine && !window.confirm("Thay nội dung đang nhập bằng bản mới nhất?")) return;
    editor.resolve(toData(editor.latest), keepMine);
  }
  return <>
    <Link className="text-link" href="/admin/settings">← Website</Link>
    <h1 className="admin-title">Liên hệ & mạng xã hội</h1>
    <p className="admin-hint">Thông tin này dùng chung cho Footer và trang liên hệ. Nhập thông tin thực tế của shop; để trống mục chưa muốn hiển thị.</p>
    <form className="admin-editor" onSubmit={(event) => { event.preventDefault(); void editor.save(editor.data); }} noValidate>
      <fieldset disabled={editor.saving}>
        <section className="admin-panel"><h2>Liên hệ với Hòe</h2><div className="admin-field-grid">
          {([ ["address", "Địa chỉ"], ["addressUrl", "Link bản đồ (HTTPS)"], ["phone", "Số điện thoại"], ["email", "Email"], ["hours", "Giờ hoạt động"] ] as const).map(([key, label]) => <AdminField key={key} path={`contact.${key}`} label={label} value={editor.data.contact[key]} change={change} errors={editor.errors} type={key === "address" ? "textarea" : "text"} hint={key === "phone" ? "Giữ dấu + nếu dùng đầu số quốc tế. Link gọi được tạo tự động." : key === "addressUrl" ? "Để trống nếu chỉ muốn hiển thị địa chỉ dạng chữ." : undefined} />)}
        </div></section>
        <section className="admin-panel"><h2>Mạng xã hội</h2>
          {socialPlatforms.map((platform) => <fieldset className="admin-fieldset" key={platform}><legend>{platform}</legend><div className="admin-field-grid">
            <AdminField path={`social.${platform}.label`} label={`Tên hiển thị ${platform}`} value={editor.data.social[platform].label} change={change} errors={editor.errors} />
            <AdminField path={`social.${platform}.url`} label={`Link ${platform} (HTTPS)`} value={editor.data.social[platform].url} change={change} errors={editor.errors} hint="Để trống link để ẩn mục này." />
          </div></fieldset>)}
        </section>
        <div className="admin-save"><button className="button" type="submit" disabled={editor.conflict}>{editor.saving ? "Đang lưu…" : "Lưu thay đổi"}</button><Link className="text-link" href="/" target="_blank">Xem Footer</Link></div>
        {editor.dirty && <p className="admin-hint">Có thay đổi chưa lưu.</p>}
      </fieldset>
      <p role="status">{editor.message}</p>
      {editor.conflict && <section className="admin-warning"><p>Cấu hình website đã thay đổi. Nội dung đang nhập vẫn được giữ; tải bản mới để đối chiếu trước khi lưu lại.</p>
        <button type="button" className="button secondary" disabled={editor.reviewing} onClick={editor.review}>{editor.reviewing ? "Đang tải…" : "Xem bản mới nhất"}</button>
        {editor.latest && <><h3>Thông tin đã lưu gần nhất</h3><dl>{Object.entries(editor.latest.contact).map(([key, value]) => <div key={key}><dt>{{ phone: "Điện thoại", email: "Email", address: "Địa chỉ", addressUrl: "Link bản đồ", hours: "Giờ hoạt động" }[key]}</dt><dd>{value || "Để trống"}</dd></div>)}</dl><ul>{editor.latest.social.map((s) => <li key={s.url}>{s.label}: {s.url}</li>)}</ul><button type="button" className="button secondary" onClick={() => resolve(false)}>Dùng bản mới nhất</button>{" "}<button type="button" className="button secondary" onClick={() => resolve(true)}>Đã đối chiếu, giữ nội dung đang nhập</button></>}
      </section>}
    </form>
  </>;
}
