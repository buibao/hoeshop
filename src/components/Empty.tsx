import Link from "next/link";
export function Empty({ title, body, href, action }: { title: string; body: string; href?: string; action?: string }) {
  return <div className="empty"><h3>{title}</h3><p>{body}</p>{href && action ? <Link href={href} className="button secondary">{action}</Link> : null}</div>;
}
