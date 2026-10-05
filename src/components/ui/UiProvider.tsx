"use client";

import { I18nProvider, RouterProvider } from "react-aria-components";
import { useRouter } from "next/navigation";
import { MotionConfig } from "motion/react";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
export function UiProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <I18nProvider locale="vi-VN">
      <RouterProvider
        navigate={(href) => {
          const target = new URL(href, window.location.href);
          if (
            target.origin === location.origin &&
            target.pathname === location.pathname &&
            target.search === location.search &&
            target.hash
          ) {
            router.push(href, { scroll: false });
            document
              .getElementById(decodeURIComponent(target.hash.slice(1)))
              ?.scrollIntoView();
          } else router.push(href);
        }}
      >
        <MotionConfig reducedMotion="user">
          <div className="contents" data-hoe-ui-ready={ready}>
            {children}
          </div>
        </MotionConfig>
      </RouterProvider>
    </I18nProvider>
  );
}
