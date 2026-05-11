import { headers } from "next/headers";
import { getApiBaseUrl } from "./base-url";

/** Thrown by {@link apiFetch} on non-2xx responses so callers can branch (e.g. 404 vs 5xx). */
export class ApiHttpError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string, message?: string) {
    super(message ?? `API request failed for ${path} with status ${status}`);
    this.name = "ApiHttpError";
    this.status = status;
    this.path = path;
  }
}

interface FetchOptions extends RequestInit {
  revalidateSeconds?: number;
  /**
   * When {@code revalidateSeconds > 0}, registers Next.js cache tags so
   * {@code revalidateTag} from {@code /api/revalidate} can drop this fetch even if path-based
   * invalidation misses nested RSC {@code fetch()} entries (common pain point in App Router + ISR).
   */
  nextTags?: string[];
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { revalidateSeconds = 60, nextTags, ...requestInit } = options;

  // Next.js caches fetch() by default; revalidateSeconds <= 0 must use no-store — passing
  // next: { revalidate: 0 } alone is not always equivalent to skipping the Data Cache.
  // For cached requests we deliberately do NOT forward the client IP: the Data Cache key
  // includes headers, so a per-IP header would create a separate cache entry for every
  // visitor and effectively disable server-side caching.
  if (revalidateSeconds <= 0) {
    try {
      const incoming = await headers();
      const xff = incoming.get("x-forwarded-for") ?? incoming.get("x-real-ip");
      if (xff) {
        requestInit.headers = {
          ...(requestInit.headers as Record<string, string>),
          "X-Forwarded-For": xff,
        };
      }
    } catch {
      // Outside a request context (e.g. static generation) — skip forwarding.
    }
  }

  const cacheConfig =
    revalidateSeconds <= 0
      ? { cache: "no-store" as const }
      : nextTags != null && nextTags.length > 0
        ? { next: { revalidate: revalidateSeconds, tags: nextTags } }
        : { next: { revalidate: revalidateSeconds } };
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...requestInit,
    ...cacheConfig,
  });

  if (!response.ok) {
    throw new ApiHttpError(response.status, path);
  }

  return (await response.json()) as T;
}
