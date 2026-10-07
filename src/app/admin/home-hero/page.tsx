import { adminPageActor } from "@/server/admin/auth";
import { adminHomeSelection } from "@/server/admin/repository";
import { HomeProductPicker } from "@/features/admin/HomeProductPicker";
export default async function HeroPage() {
  if (!(await adminPageActor())) return null;
  return <HomeProductPicker kind="hero" initial={await adminHomeSelection("hero")} />;
}
