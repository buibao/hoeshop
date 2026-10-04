import { DomainError } from "@/domain/schemas";
import { isTestContent } from "@/server/content";
import { PostgresRepository } from "./postgres";
import { MockRepository } from "@/server/integrations/mock";
import type { Repositories } from "./contracts";
export function getRepositories(): Repositories | PostgresRepository {
  if (process.env.DATA_ADAPTER === "mock") {
    if (process.env.VERCEL || process.env.VERCEL_ENV || !isTestContent())
      throw new DomainError(
        503,
        "MOCK_FORBIDDEN",
        "Chế độ test chỉ được dùng trên máy local.",
      );
    return new MockRepository();
  }
  if (process.env.DATA_ADAPTER && process.env.DATA_ADAPTER !== "postgres")
    throw new DomainError(
      503,
      "ADAPTER_RETIRED",
      "Kết nối dữ liệu cần được nâng cấp sang Postgres.",
    );
  return new PostgresRepository();
}
