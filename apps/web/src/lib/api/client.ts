import { getApiBaseUrl } from "./base-url";

interface FetchOptions extends RequestInit {
  revalidateSeconds?: number;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { revalidateSeconds = 60, ...requestInit } = options;
  // Next.js caches fetch() by default; revalidateSeconds <= 0 must use no-store — passing
  // next: { revalidate: 0 } alone is not always equivalent to skipping the Data Cache.
  const cacheConfig =
    revalidateSeconds <= 0
      ? { cache: "no-store" as const }
      : { next: { revalidate: revalidateSeconds } };
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...requestInit,
    ...cacheConfig,
  });

  if (!response.ok) {
    throw new Error(`API request failed for ${path} with status ${response.status}`);
  }

  return (await response.json()) as T;
}
