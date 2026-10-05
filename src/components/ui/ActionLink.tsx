"use client";

import {
  Button,
  type LinkProps,
} from "@/components/untitled/base/buttons/button";
import { buttonContent } from "./button-content";
export function ActionLink({
  className,
  href,
  style: _style,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  void _style;
  const color = /secondary/.test(className || "")
    ? "secondary"
    : /text-link/.test(className || "")
      ? "link-color"
      : "primary";
  return (
    <Button {...(props as LinkProps)} {...buttonContent(props.children)} href={href} size="md" color={color} />
  );
}
