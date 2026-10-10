"use client";

import { useId, useRef, type ReactNode } from "react";
import { HoaThoiRecommendations } from "@/components/HoaThoiRecommendations";
import type { Recommendation } from "@/domain/recurrence";
import { InquiryForm } from "./InquiryForm";
import type { Guidance } from "./configuration";
import { HoaThoiPackageContext, scrollToPackageControls, useHoaThoiPackageState } from "./HoaThoiPackageState";

export function HoaThoiServiceFlow({ guidance, children }: { guidance: Guidance; children: ReactNode }) {
  const state = useHoaThoiPackageState();
  const id = useId();
  const formSection = useRef<HTMLElement>(null);
  const active = state.period === "week" ? state.weekly : state.monthly;

  function choose(recommendation: Recommendation) {
    state.choose(recommendation);
    requestAnimationFrame(() => scrollToPackageControls(formSection.current?.querySelector<HTMLElement>(".ht-package-controls") ?? null));
  }

  return <HoaThoiPackageContext.Provider value={state}>
    <div className="ht-service-flow">
      <HoaThoiRecommendations recommendations={guidance.recurringRecommendations ?? []} referenceId={state.referenceId} period={state.period} bouquets={Number(active.bouquets)} choose={choose} id={id} disabled={state.locked} />
      {children}
      <section className="ht-package-section" id="tu-van" ref={formSection}>
        <InquiryForm serviceType="hoa-thoi" guidance={guidance} showRecommendations={false} />
      </section>
    </div>
  </HoaThoiPackageContext.Provider>;
}
