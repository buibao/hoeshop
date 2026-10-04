"use client";
import { useRef, useState } from "react";
import * as z from "zod";
import {
  fingerprint,
  pendingFor,
  completePending,
  PENDING_TTL,
} from "./pending";
import { focusError } from "@/components/Fields";
export type Phase = "idle" | "validating" | "submitting" | "success" | "error";
export function useSubmission<T>(endpoint: string) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<T | null>(null);
  const request = useRef<{ key: string; id: string; createdAt: number } | null>(
    null,
  );
  const inFlight = useRef(false);
  async function submit(
    input: Record<string, unknown>,
    schema: z.ZodType,
    form: HTMLFormElement,
  ): Promise<T | null> {
    if (inFlight.current) return null;
    setPhase("validating");
    setError("");
    setErrors({});
    const parsed = schema.safeParse({
      ...input,
      requestId: crypto.randomUUID(),
    });
    if (!parsed.success) {
      const fields = Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join("."), i.message]),
      );
      // Also map service configuration errors to the corresponding input names.
      for (const [path, message] of Object.entries(fields))
        if (path.startsWith("configuration.")) fields[path.slice(14)] = message;
      setErrors(fields);
      setError("Vui lòng kiểm tra thông tin trước khi gửi.");
      setPhase("error");
      focusError(form, parsed.error.issues[0].path.join("."));
      return null;
    }
    inFlight.current = true;
    setPhase("submitting");
    try {
      const normalized = parsed.data as Record<string, unknown>;
      const payload = Object.fromEntries(
        Object.entries(normalized).filter(([key]) => key !== "requestId"),
      );
      const key = await fingerprint(payload);
      if (
        !request.current ||
        request.current.key !== key ||
        Date.now() - request.current.createdAt >= PENDING_TTL
      ) {
        let id = crypto.randomUUID();
        try {
          id = pendingFor(window.localStorage, endpoint, key).requestId;
        } catch {
          /* Keep retry in memory when storage is blocked. */
        }
        request.current = { key, id, createdAt: Date.now() };
      }
      const id = request.current.id;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, requestId: id }),
        signal: AbortSignal.timeout(22000),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(
          body.error?.message || "Chưa lưu được yêu cầu. Vui lòng thử lại.",
        );
        if (body.error?.fields) {
          const fields = Object.fromEntries(
            body.error.fields.map((f: { path: string; message: string }) => [
              f.path,
              f.message,
            ]),
          );
          setErrors(fields);
          if (body.error.fields[0]) focusError(form, body.error.fields[0].path);
        }
        setPhase("error");
        return null;
      }
      const validReceipt =
        endpoint === "/api/comments"
          ? body.commentId === id &&
            typeof body.postId === "string" &&
            typeof body.displayName === "string" &&
            typeof body.body === "string" &&
            typeof body.createdAt === "string"
          : body.requestId === id && body.status === "received";
      if (!validReceipt) throw new Error("Invalid receipt");
      try {
        completePending(window.localStorage, endpoint, id);
      } catch {
        /* Receipt remains authoritative. */
      }
      request.current = null;
      setResult(body as T);
      setPhase("success");
      return body as T;
    } catch {
      setError(
        "Chưa xác nhận được việc lưu. Hãy thử lại; mã yêu cầu được giữ nguyên để tránh trùng.",
      );
      setPhase("error");
      return null;
    } finally {
      inFlight.current = false;
    }
  }
  function reset() {
    setPhase("idle");
    setResult(null);
    setError("");
    setErrors({});
    request.current = null;
  }
  return { phase, error, errors, result, submit, reset };
}
