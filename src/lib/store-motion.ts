/** CSS owns Store timing; read a role once when an effect starts, never per frame. */
export const storeSubmenuMotion = { duration: .18, distance: 4, ease: [.22, 1, .36, 1] as [number, number, number, number] };

export function storeMotionRole(node: HTMLElement, role: "feedback" | "reveal") {
  const style = getComputedStyle(node);
  const number = (token: string) => Number.parseFloat(style.getPropertyValue(`--store-motion-${token}`)) || 0;
  return {
    duration: number(role),
    distance: number("distance"),
    stagger: number("stagger"),
    easing: style.getPropertyValue(`--store-motion-ease-${role === "feedback" ? "state" : "out"}`).trim() || "linear",
  };
}
