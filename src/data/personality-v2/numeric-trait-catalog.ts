// Client-side mirror of the numeric trait catalog the server now uses
// (supabase/migrations/20261028010000_personality_trait_catalog.sql,
// scripts/generate-trait-catalog-sql.ts).
//
// CORRECTED (owner audit, 2026-10-31, item 1): dimension_id previously came from
// PERSONALITY_DIMENSIONS' own array position (`index + 1`) -- the exact bug already fixed in
// the SQL generator via a persisted ledger (scripts/lib/dimension-id-ledger.json), but left
// unfixed here. A reorder of PERSONALITY_DIMENSIONS would have silently reassigned every
// trait_id this client-side module hands back, out of sync with the server's own
// ledger-frozen ids. Fixed: this module now imports the SAME ledger JSON file directly (a
// static data import, resolveJsonModule is already enabled in tsconfig -- see
// src/components/web-badge.tsx for prior precedent importing a .json file) rather than
// recomputing dimension_id from array position -- it can never drift from the server's
// numbering because it reads the identical source of truth, not a parallel formula.
//
// This module still has zero Supabase/React dependency -- pure data, importable by both the
// app and plain Node/tsx validation scripts.

import { PERSONALITY_DIMENSIONS, type PersonalityDimensionId } from '@/data/personality';
import dimensionIdLedger from '../../../scripts/lib/dimension-id-ledger.json';

export type NumericTraitId = number;

export type NumericTraitInfo = {
  traitId: NumericTraitId;
  dimensionId: number;
  dimensionKey: PersonalityDimensionId;
  polarity: 'positive' | 'negative';
  isCore: boolean;
};

const LEDGER_DIMENSION_IDS: Record<string, number> = dimensionIdLedger.dimensionIds;

const resolveLedgerDimensionId = (dimensionKey: string): number => {
  const id = LEDGER_DIMENSION_IDS[dimensionKey];
  if (id === undefined) {
    throw new Error(`No ledger entry for dimension '${dimensionKey}' -- scripts/lib/dimension-id-ledger.json is stale relative to PERSONALITY_DIMENSIONS. Run scripts/generate-trait-catalog-sql.ts first.`);
  }
  return id;
};

const dimensionIndexByKey = new Map(PERSONALITY_DIMENSIONS.map((d) => [d.id, resolveLedgerDimensionId(d.id)] as const));

export const traitIdForDimension = (dimensionKey: PersonalityDimensionId, polarity: 'positive' | 'negative'): NumericTraitId => {
  const dimensionId = dimensionIndexByKey.get(dimensionKey);
  if (!dimensionId) {
    throw new Error(`Unknown dimension: ${dimensionKey}`);
  }
  return polarity === 'positive' ? dimensionId * 2 - 1 : dimensionId * 2;
};

const TRAIT_INFO_BY_ID = new Map<NumericTraitId, NumericTraitInfo>();
for (const dimension of PERSONALITY_DIMENSIONS) {
  const dimensionId = resolveLedgerDimensionId(dimension.id);
  TRAIT_INFO_BY_ID.set(dimensionId * 2 - 1, { traitId: dimensionId * 2 - 1, dimensionId, dimensionKey: dimension.id, polarity: 'positive', isCore: dimension.type === 'core' });
  TRAIT_INFO_BY_ID.set(dimensionId * 2, { traitId: dimensionId * 2, dimensionId, dimensionKey: dimension.id, polarity: 'negative', isCore: dimension.type === 'core' });
}

if (TRAIT_INFO_BY_ID.size !== 64) {
  throw new Error(`Expected exactly 64 numeric traits, got ${TRAIT_INFO_BY_ID.size}`);
}

export const traitInfo = (traitId: NumericTraitId): NumericTraitInfo => {
  const info = TRAIT_INFO_BY_ID.get(traitId);
  if (!info) {
    throw new Error(`Unknown numeric trait_id: ${traitId}`);
  }
  return info;
};

export const isCoreTrait = (traitId: NumericTraitId): boolean => traitInfo(traitId).isCore;
export const isPrivateTrait = (traitId: NumericTraitId): boolean => !traitInfo(traitId).isCore;
export const traitDimensionId = (traitId: NumericTraitId): number => traitInfo(traitId).dimensionId;
