"use client";

import { useEffect, useRef, type ComponentProps, type Ref } from "react";
import { Form as UntitledForm } from "@/components/untitled/base/form/form";
type Props = ComponentProps<typeof UntitledForm> & {
  noValidate?: boolean;
  onChange?: (event: { currentTarget: HTMLFormElement }) => void;
  ref?: Ref<HTMLFormElement>;
};
/** Business adapter. Native change events include controls serialized by a single hidden input. */
export function Form({ ref, onChange, noValidate, ...props }: Props) {
  const element = useRef<HTMLFormElement | null>(null);
  useEffect(() => {
    const node = element.current;
    const change = () => {
      if (node) onChange?.({ currentTarget: node });
    };
    const reset = () => queueMicrotask(change);
    const submit = (event: Event) => {
      for (const field of node?.querySelectorAll<HTMLElement>(
        "[data-segment-field]",
      ) ?? []) {
        const segments = Array.from(
          field.querySelectorAll<HTMLElement>('[role="spinbutton"]'),
        );
        const placeholders = segments.filter((segment) =>
          segment.hasAttribute("data-placeholder"),
        );
        if (placeholders.length && placeholders.length < segments.length) {
          event.preventDefault();
          event.stopImmediatePropagation();
          field.dispatchEvent(new Event("hoe:partial"));
          placeholders[0].focus();
          return;
        }
      }
    };
    node?.addEventListener("change", change);
    node?.addEventListener("input", change);
    node?.addEventListener("submit", submit, true);
    node?.addEventListener("reset", reset);
    return () => {
      node?.removeEventListener("change", change);
      node?.removeEventListener("input", change);
      node?.removeEventListener("submit", submit, true);
      node?.removeEventListener("reset", reset);
    };
  }, [onChange]);
  return (
    <UntitledForm
      {...props}
      validationBehavior={noValidate ? "aria" : props.validationBehavior}
      ref={(node) => {
        element.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
    />
  );
}
