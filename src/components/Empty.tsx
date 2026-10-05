import { ActionLink } from "@/components/ui/ActionLink";
export function Empty({ title, body, href, action }: { title: string; body: string; href?: string; action?: string }) {
  return <div className="empty flex flex-col items-center gap-4 rounded-xl bg-secondary p-8 text-center"><h3>{title}</h3><p>{body}</p>{href && action ? <ActionLink href={href} className="button secondary">{action}</ActionLink> : null}</div>;
}
