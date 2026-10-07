import { imageSource } from "@/domain/content";
import { validateImage } from "./file-content";

export function homeImageAvailable(image: string | null) {
  if (!image || !imageSource.safeParse(image).success) return false;
  if (image.startsWith("/images/")) {
    try { validateImage(image); return true; } catch { return false; }
  }
  // Match Next Image's configured Blob remote pattern.
  return /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/hoe\//.test(image);
}
