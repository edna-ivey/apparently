// Shared Relic transform/opacity math -- used by the production renderer's calibration
// resolution AND by the R&D Relic Lab's per-asset correction editing. Deliberately generic and
// dependency-free (no React, no storage) so both can import the exact same arithmetic.

export type RelicTransform = { x: number; y: number; scale: number; rotation: number };

export const IDENTITY_TRANSFORM: RelicTransform = { x: 0, y: 0, scale: 1, rotation: 0 };

export function resolveTransform(base: RelicTransform, correction?: Partial<RelicTransform>): RelicTransform {
  const c = { ...IDENTITY_TRANSFORM, ...(correction ?? {}) };
  return { x: base.x + c.x, y: base.y + c.y, scale: base.scale * c.scale, rotation: base.rotation + c.rotation };
}

export function resolveOpacity(baseOpacity: number, correctionOpacity?: number): number {
  const resolved = correctionOpacity === undefined ? baseOpacity : baseOpacity * correctionOpacity;
  return Math.min(1, Math.max(0, resolved));
}
