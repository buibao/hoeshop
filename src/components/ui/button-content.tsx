import {
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
  type SVGProps,
} from "react";
import { styles } from "@/components/untitled/base/buttons/button";
/** Preserve server-rendered Lucide SVGs while placing them in the upstream icon slot. */
export function buttonContent(children: ReactNode) {
  const nodes = Children.toArray(children);
  const icons = nodes
    .map((node, index) => ({ node, index }))
    .filter(
      ({ node }) =>
        isValidElement<Record<string, unknown>>(node) &&
        (node.type === "svg" || "size" in node.props),
    );
  if (icons.length !== 1) return { children };
  const { node, index } = icons[0];
  const element = node as ReactElement<
    SVGProps<SVGSVGElement> & { "data-icon"?: string }
  >;
  const icon = cloneElement(element, {
    "data-icon": index === 0 ? "leading" : "trailing",
    "aria-hidden": true,
    className: [styles.common.icon, element.props.className]
      .filter(Boolean)
      .join(" "),
  });
  const remaining = nodes.filter((_, i) => i !== index);
  return {
    children: remaining.length ? remaining : undefined,
    ...(index === 0 ? { iconLeading: icon } : { iconTrailing: icon }),
  };
}
