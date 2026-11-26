import type { Labeled, Origin, TaintHop } from "./types.js";

export const DEFAULT_TRUSTED_ORIGINS: ReadonlySet<Origin> = new Set<Origin>([
  "user",
  "system",
]);

export function label<T>(
  value: T,
  origin: Origin | Iterable<Origin>
): Labeled<T> {
  const labels =
    typeof origin === "string" ? new Set<Origin>([origin]) : new Set<Origin>(origin);
  return { value, labels };
}

export function isLabeled(value: unknown): value is Labeled<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    "labels" in value &&
    (value as Labeled<unknown>).labels instanceof Set
  );
}

export function unwrap<T>(input: T | Labeled<T>): T {
  return isLabeled(input) ? input.value : input;
}

export function mergeLabels(
  ...items: Array<Labeled<unknown> | Set<Origin> | Origin[] | undefined>
): Set<Origin> {
  const merged = new Set<Origin>();
  for (const item of items) {
    if (!item) continue;
    if (item instanceof Set) {
      for (const o of item) merged.add(o);
    } else if (Array.isArray(item)) {
      for (const o of item) merged.add(o);
    } else if (isLabeled(item)) {
      for (const o of item.labels) merged.add(o);
    }
  }
  return merged;
}

export function isTrustedOrigin(
  origin: Origin,
  trustedOrigins: ReadonlySet<Origin> = DEFAULT_TRUSTED_ORIGINS
): boolean {
  return trustedOrigins.has(origin);
}

export function isUntrusted(
  labels: ReadonlySet<Origin>,
  trustedOrigins: ReadonlySet<Origin> = DEFAULT_TRUSTED_ORIGINS
): boolean {
  for (const origin of labels) {
    if (!trustedOrigins.has(origin)) {
      return true;
    }
  }
  return false;
}

export function describeOrigin(origin: Origin): string {
  switch (origin) {
    case "user":
      return "the user";
    case "system":
      return "the system prompt";
    case "web":
      return "a web page";
    case "email:external":
      return "an external email sender";
    case "email:internal":
      return "an internal email";
    case "file":
      return "a file";
    default:
      if (origin.startsWith("tool:")) {
        return `tool ${origin.slice(5)}`;
      }
      return origin;
  }
}

export class TaintTracker {
  private readonly origins = new Set<Origin>();
  private readonly hops: TaintHop[] = [];
  private readonly trustedOrigins: ReadonlySet<Origin>;

  constructor(trustedOrigins: ReadonlySet<Origin> = DEFAULT_TRUSTED_ORIGINS) {
    this.trustedOrigins = trustedOrigins;
  }

  record(source: string, input: Labeled<unknown> | Origin | Iterable<Origin>, detail?: string): void {
    const incoming: Set<Origin> = isLabeled(input)
      ? input.labels
      : typeof input === "string"
        ? new Set([input])
        : new Set(input);

    for (const origin of incoming) {
      this.origins.add(origin);
      this.hops.push({
        source,
        origin,
        trusted: isTrustedOrigin(origin, this.trustedOrigins),
        ...(detail ? { detail } : {}),
      });
    }
  }

  isTainted(): boolean {
    return isUntrusted(this.origins, this.trustedOrigins);
  }

  getOrigins(): Origin[] {
    return Array.from(this.origins);
  }

  getUntrustedOrigins(): Origin[] {
    return Array.from(this.origins).filter(
      (o) => !this.trustedOrigins.has(o)
    );
  }

  getLineage(): TaintHop[] {
    return [...this.hops];
  }

  deriveToolArgs<T extends Record<string, unknown>>(
    args: T
  ): Record<string, Labeled<unknown>> {
    const out: Record<string, Labeled<unknown>> = {};
    for (const [key, val] of Object.entries(args)) {
      if (isLabeled(val)) {
        out[key] = label(val.value, mergeLabels(val.labels, this.origins));
      } else {
        out[key] = label(val, this.origins);
      }
    }
    return out;
  }

  snapshot(): { tainted: boolean; origins: Origin[]; lineage: TaintHop[] } {
    return {
      tainted: this.isTainted(),
      origins: this.getOrigins(),
      lineage: this.getLineage(),
    };
  }
}
