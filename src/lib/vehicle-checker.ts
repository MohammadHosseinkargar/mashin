import type { Vehicle } from "./types";

export type ExternalExistsResult = true | false | null;

export type { Vehicle };

export interface Sources {
  check(
    vehicle: Vehicle & { specifications: Record<string, unknown> },
  ): Promise<ExternalExistsResult>;
}

export interface SourceMeta {
  readonly source: string;
  readonly sourceUrl?: string;
  readonly externalId?: string;
}

export function sourceMeta(vehicle: Vehicle): SourceMeta {
  const spec = vehicle.specifications ?? {};
  return {
    source: String(spec.source ?? ""),
    sourceUrl: String(spec.sourceUrl ?? ""),
    externalId: String(spec.externalId ?? ""),
  };
}

export function hasExternalRef(vehicle: Vehicle): boolean {
  const m = sourceMeta(vehicle);
  return Boolean(m.source && m.externalId);
}
