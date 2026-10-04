import { DomainError } from "@/domain/schemas";
import { isTestContent } from "@/server/content";
import { SheetsRepository } from "@/server/integrations/sheets";
import { MockRepository } from "@/server/integrations/mock";
import type { Repositories } from "./contracts";
export function getRepositories(): Repositories {
  if (process.env.DATA_ADAPTER === "mock") {
    if (process.env.VERCEL || process.env.VERCEL_ENV || !isTestContent())
      throw new DomainError(503, "MOCK_FORBIDDEN", "Chế độ test chỉ được dùng trên máy local.");
    return new MockRepository();
  }
  return new SheetsRepository();
}
