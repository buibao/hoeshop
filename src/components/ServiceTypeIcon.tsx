import { CalendarDays, Heart, Sparkles, type LucideProps } from "lucide-react";

const serviceIcons = {
  "hoa-tam": Heart,
  "hoa-thoi": CalendarDays,
  "hoa-y": Sparkles,
};

/** Service identity is stable even when Admin changes names or ordering. */
export function ServiceTypeIcon({ serviceId, ...props }: LucideProps & { serviceId: string }) {
  if (!Object.hasOwn(serviceIcons, serviceId)) return null;
  const Icon = serviceIcons[serviceId as keyof typeof serviceIcons];
  return Icon ? <Icon {...props} strokeWidth={1.6} aria-hidden="true" focusable="false" /> : null;
}
