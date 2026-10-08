"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const StoreContext = createContext({ portalClassName: "", backgroundBlocked: false, registerOverlay: () => () => {} });

export function StoreScope({ className, children }: { className: string; children: ReactNode }) {
  const [overlays, setOverlays] = useState(0);
  const registerOverlay = useCallback(() => {
    setOverlays((count) => count + 1);
    return () => setOverlays((count) => count - 1);
  }, []);
  const value = useMemo(() => ({ portalClassName: className, backgroundBlocked: overlays > 0, registerOverlay }), [className, overlays, registerOverlay]);
  return <StoreContext.Provider value={value}><div className={className}>{children}</div></StoreContext.Provider>;
}

export function useStoreScope() { return useContext(StoreContext); }

/** No provider in Admin: shared widgets retain their original typography. */
export function useStoreOverlay(open: boolean) {
  const { portalClassName, registerOverlay } = useStoreScope();
  useEffect(() => { if (open && portalClassName) return registerOverlay(); }, [open, portalClassName, registerOverlay]);
  return portalClassName;
}
