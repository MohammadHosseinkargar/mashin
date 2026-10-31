import type { Vehicle, VehicleInput } from "./types";
import { hasExternalRef } from "./vehicle-checker";

export type LifecycleAction = "keep" | "markRemoved";

export interface LifecycleContext {
  vehicle: Vehicle;
  manualUnavailable?: boolean;
  sourceCheck: SourceCheckResult;
}

export type SourceCheckResult =
  | { kind: "present" }
  | { kind: "removed" }
  | { kind: "unknown" };

export function decideLifecycle(ctx: LifecycleContext): LifecycleAction {
  if (ctx.manualUnavailable) {
    return "keep";
  }

  if (!hasExternalRef(ctx.vehicle)) {
    return "keep";
  }

  switch (ctx.sourceCheck.kind) {
    case "present":
      return "keep";
    case "removed":
      return "markRemoved";
    case "unknown":
      return "keep";
  }
}

export function applyLifecycle(
  vehicle: Vehicle,
  action: LifecycleAction,
): Partial<VehicleInput> | null {
  if (action === "markRemoved") {
    if (vehicle.status !== "unavailable") {
      return { status: "unavailable" };
    }
    return null;
  }
  return null;
}
