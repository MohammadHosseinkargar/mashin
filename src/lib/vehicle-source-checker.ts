import { hasExternalRef, sourceMeta } from "./vehicle-checker";
import type { ExternalExistsResult, SourceMeta } from "./vehicle-checker";
import type { Vehicle } from "./types";

const MAX_CONCURRENT_SOURCE_CHECKS = 6;
const DEFAULT_SOURCE_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY_DELAY_MS = 8_000;
const DEFAULT_RETRY_DELAYS_MS = [12_000, 30_000, 90_000];

export class HttpSourceChecker {
  constructor(options: Options = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_SOURCE_TIMEOUT_MS;
    this.retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    this.requestFn = options.requestFn ?? defaultRequestFn;
    this.blockedStatuses = new Set(options.blockedStatuses ?? [403, 429, 500, 502, 503, 504]);
  }

  readonly timeoutMs: number;
  readonly retryDelaysMs: number[];
  readonly retryDelayMs: number;
  readonly requestFn: RequestFn;
  readonly blockedStatuses: Set<number>;

  async check(vehicle: Vehicle): Promise<ExternalExistsResult> {
    const meta = sourceMeta(vehicle);
    if (!meta.source || !meta.externalId) return null;
    if (!meta.sourceUrl) return null;
    return this.checkByUrl(meta);
  }

  async checkByUrl(meta: SourceMeta): Promise<ExternalExistsResult> {
    if (!meta.source || !meta.externalId || !meta.sourceUrl) return null;
    try {
      return await this.requestFn(meta, {
        timeoutMs: this.timeoutMs,
        retryDelaysMs: this.retryDelaysMs,
        retryDelayMs: this.retryDelayMs,
        blockedStatuses: this.blockedStatuses,
      });
    } catch {
      return null;
    }
  }
}

export type RequestFn = (
  meta: SourceMeta,
  options: RequestOptions,
) => Promise<ExternalExistsResult>;

export interface RequestOptions {
  timeoutMs: number;
  retryDelaysMs: number[];
  retryDelayMs: number;
  blockedStatuses: Set<number>;
}

export async function defaultRequestFn(
  meta: SourceMeta,
  options: RequestOptions,
): Promise<ExternalExistsResult> {
  const url = meta.sourceUrl;
  if (!url) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    for (let attempt = 0; ; attempt++) {
      if (attempt > 0) {
        await sleep(options.retryDelayMs);
      }

      let res: Response;
      try {
        res = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          },
          signal: controller.signal,
          redirect: "follow",
        });
      } catch {
        if (attempt >= options.retryDelaysMs.length) {
          return null;
        }
        continue;
      }

      clearTimeout(timer);

      if (res.ok) {
        return true;
      }

      if (options.blockedStatuses.has(res.status)) {
        if (attempt >= options.retryDelaysMs.length) {
          return null;
        }
        continue;
      }

      if (res.status === 404) {
        return false;
      }

      if (res.status === 410) {
        return false;
      }

      return null;
    }
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface Options {
  timeoutMs?: number;
  retryDelaysMs?: number[];
  retryDelayMs?: number;
  blockedStatuses?: number[];
  requestFn?: RequestFn;
}

export class ConfirmedSourceChecker {
  constructor(
    options: {
      inner?: HttpSourceChecker;
      confirmationCount?: number;
      concurrency?: number;
    } = {},
  ) {
    this.inner = options.inner ?? new HttpSourceChecker();
    this.confirmationsRequired = options.confirmationCount ?? 2;
    this.concurrency = options.concurrency ?? MAX_CONCURRENT_SOURCE_CHECKS;
  }

  readonly inner: HttpSourceChecker;
  readonly confirmationsRequired: number;
  readonly concurrency: number;

  async evaluate(
    vehicle: Vehicle & { specifications: Record<string, unknown> },
    manualStatus?: string,
  ): Promise<"mark" | "keep" | "manualOnly"> {
    if (manualStatus === "unavailable") {
      return "manualOnly";
    }
    if (!hasExternalRef(vehicle)) {
      return "keep";
    }

    const attempts: ExternalExistsResult[] = [];
    let aborted = false;

    const run = async () => {
      if (aborted) return;
      const result = await this.inner.check(vehicle);
      if (aborted) return;
      attempts.push(result);
    };

    const workers = Math.min(this.confirmationsRequired, this.concurrency);
    await Promise.all(Array.from({ length: workers }, () => run()));

    aborted = true;

    const notFoundCount = attempts.filter(
      (r): r is false => r === false,
    ).length;
    const unknownCount = attempts.filter(
      (r): r is null => r === null,
    ).length;
    const foundCount = attempts.filter(
      (r): r is true => r === true,
    ).length;

    if (foundCount > 0) {
      return "keep";
    }

    if (unknownCount > 0 && notFoundCount < this.confirmationsRequired) {
      return "keep";
    }

    if (notFoundCount >= this.confirmationsRequired) {
      return "mark";
    }

    return "keep";
  }
}

export { hasExternalRef, sourceMeta };
