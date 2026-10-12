import { StoreTextReveal } from "@/components/ui/StoreTextReveal";
import Link from "next/link";
export function Empty({ title, body, href, action }: { title: string; body: string; href?: string; action?: string }) {
  return <div className="empty"><StoreTextReveal as="h3" role="heading">{title}</StoreTextReveal><StoreTextReveal as="p" role="body">{body}</StoreTextReveal>{href && action ? <Link href={href} className="button secondary">{action}</Link> : null}</div>;
}
