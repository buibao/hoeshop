"use client";
import { createContext, useContext, type HTMLAttributes } from "react";
import { cx } from "@/components/untitled/utils/cx";
type Logo={src:string;alt:string;width:number;height:number}|null;
export const LogoContext=createContext<Logo>(null);
/** Branding replacement; retains the upstream logo slot size. */
export const UntitledLogo=(props:HTMLAttributes<HTMLOrSVGElement>)=>{
 const logo=useContext(LogoContext);
 return <div {...props} className={cx("flex h-8 w-max items-center justify-start overflow-visible",props.className)}>
  {logo?<svg role="img" aria-label={logo.alt} viewBox={`0 0 ${logo.width} ${logo.height}`} className="h-full w-auto"><image href={logo.src} width={logo.width} height={logo.height}/></svg>
  :<svg viewBox="0 0 97 32" role="img" aria-label="Hòe" className="aspect-[3] h-full shrink-0 fill-fg-brand-primary"><text x="0" y="26" fontSize="32" fontFamily="var(--font-display)">hòe</text></svg>}
 </div>;
};
