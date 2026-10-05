"use client";
import type { ComponentProps } from "react";
import { Button } from "@/components/untitled/base/buttons/button";
import { buttonContent } from "./button-content";
/** HTML event compatibility only; all control geometry is upstream. */
export function Action({
  className,
  disabled,
  style: _style,
  type,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) {
  void _style;
  const color = /secondary/.test(className || "")
    ? "secondary"
    : /text-link|link-button|icon-button/.test(className || "")
      ? "tertiary"
      : "primary";
  return (
    <Button
      {...(props as ComponentProps<typeof Button>)}
      {...buttonContent(props.children)}
      size="md"
      color={color}
      isDisabled={disabled}
      type={type || (props.onClick ? "button" : "submit")}
    />
  );
}
