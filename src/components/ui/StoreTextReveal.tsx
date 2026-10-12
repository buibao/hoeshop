"use client";

import { Children, cloneElement, createContext, isValidElement, useContext, useId, useLayoutEffect, useRef, useSyncExternalStore, type HTMLAttributes, type ReactElement, type ReactNode, type RefObject } from "react";
import { useStoreScope } from "@/components/StoreScope";
import { initialTextEntrance, registerTextReveal, textRevealPresets, type EntranceNode, type TextRevealRole } from "@/lib/store-text-reveal";

const TextContext = createContext<{ exempt: boolean; root?: RefObject<HTMLElement | null> }>({ exempt: false });
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
type TextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div" | "time";
type TextProps = Omit<HTMLAttributes<HTMLElement>, "role"> & { as?: TextTag; role?: TextRevealRole; delayMs?: number; initial?: boolean; disabled?: boolean; dateTime?: string };

function copyMarkup(children: ReactNode): ReactNode {
  return Children.map(children, child => {
    if (!isValidElement<{ children?: ReactNode; href?: unknown }>(child) || !child.props.children) return child;
    return cloneElement(child, {}, child.props.href !== undefined
      ? <span data-text-link-copy>{child.props.children}</span>
      : copyMarkup(child.props.children));
  });
}

export function StoreTextExemption({ children }: { children: ReactNode }) {
  const context = useContext(TextContext);
  return <TextContext.Provider value={{ ...context, exempt: true }}>{children}</TextContext.Provider>;
}

/** Portal callers pass the real scroll owner; the provider adds no layout node. */
export function StoreTextRoot({ root, children }: { root: RefObject<HTMLElement | null>; children: ReactNode }) {
  const context = useContext(TextContext);
  return <TextContext.Provider value={{ ...context, root }}>{children}</TextContext.Provider>;
}

export function StoreTextReveal({ as: Tag = "span", role = "body", delayMs = 0, initial = false, disabled = false, children, ...attributes }: TextProps) {
  const generatedId = useId();
  const context = useContext(TextContext);
  const { portalClassName } = useStoreScope();
  const clientCreated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const node = useRef<EntranceNode | null>(null);
  const controller = useRef<ReturnType<typeof registerTextReveal> | null>(null);
  const previousChildren = useRef(children);
  const originalMount = useRef(clientCreated);
  const excluded = disabled || context.exempt || !portalClassName;
  const id = attributes.id ?? generatedId;

  useLayoutEffect(() => {
    const target = node.current;
    if (!target || excluded || target.closest("[data-text-exempt]")) return;
    let disposed = false;
    const attach = () => {
      if (disposed) return;
      const root = context.root?.current ?? target.closest<HTMLElement>("[data-text-scroll-root]");
      controller.current = registerTextReveal(target, role, delayMs, root, originalMount.current);
    };
    // Child layout effects precede the parent's ref attachment. Defer to the
    // end of this commit when a scroll-owner ref has not been attached yet.
    if (context.root && !context.root.current) queueMicrotask(attach);
    else attach();
    return () => { disposed = true; controller.current?.dispose(); controller.current = null; };
  }, [excluded, context.root, role, delayMs]);

  useLayoutEffect(() => {
    if (previousChildren.current !== children) controller.current?.settle();
    previousChildren.current = children;
  }, [children]);

  if (excluded) return <Tag {...attributes}>{children}</Tag>;
  const scriptId = JSON.stringify(id).replace(/</g, "\\u003c");
  const script = initial ? `try{(${initialTextEntrance.toString()})(${scriptId},${JSON.stringify(textRevealPresets)},${JSON.stringify(role)},${Math.max(0, Math.min(180, delayMs))})}catch{}` : "";
  return <>
    <Tag {...attributes} id={id} ref={(element: HTMLElement | null) => { node.current = element; }} data-store-text={role} data-text-inline={Tag === "span" ? "true" : undefined}>
      <span data-text-layer>{copyMarkup(children)}</span>
    </Tag>
    {initial && <script type={typeof window === "undefined" ? "text/javascript" : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: script }} />}
  </>;
}

/** Wrap explicit direct semantic children, never discover or mutate document text. */
export function StoreTextRevealGroup({ children, as: Tag = "div", initial = false, legacyLayout = false, ...attributes }: HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "article"; initial?: boolean; legacyLayout?: boolean }) {
  const items = Children.toArray(children);
  const hasEyebrow = items.some(child => isValidElement<{ className?: string }>(child) && /(?:eyebrow|category|number)/.test(child.props.className ?? ""));
  const card = /(?:^|\s)(?:service-card|blog-card)(?:\s|$)/.test(attributes.className ?? "");
  const content = items.map(child => {
    if (!isValidElement<HTMLAttributes<HTMLElement>>(child) || typeof child.type !== "string") return child;
    if (child.props.role || child.props["aria-live"] || /(?:error|success|status)/.test(child.props.className ?? "")) return child;
    const tag = child.type;
    if (!["h1", "h2", "h3", "h4", "p", "span"].includes(tag)) return child;
    const eyebrow = /(?:eyebrow|category|number)/.test(child.props.className ?? "");
    const heading = /^h[1-4]$/.test(tag);
    const role: TextRevealRole = tag === "h1" ? "page" : heading && !card ? "heading" : eyebrow ? "eyebrow" : "body";
    return <StoreTextReveal key={child.key} {...child.props} as={tag as TextTag} role={role} delayMs={eyebrow ? 0 : heading ? hasEyebrow ? 90 : 0 : hasEyebrow ? 180 : 90} initial={initial}>{child.props.children}</StoreTextReveal>;
  });
  return <Tag {...attributes} data-text-group data-scroll-fade={legacyLayout ? true : undefined}>{legacyLayout ? <div data-scroll-fade-content>{content}</div> : content}</Tag>;
}

/** Entire link stays in final layout. Only its copy receives motion. */
export function StoreTextLink({ children }: { children: ReactElement<{ children?: ReactNode }> }) {
  return cloneElement(children, {}, <StoreTextReveal>{children.props.children}</StoreTextReveal>);
}
