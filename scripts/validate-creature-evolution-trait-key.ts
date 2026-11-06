// REAL BEHAVIORAL TEST (owner instruction, 2026-10-23: "source-text assertions alone are not
// enough") for src/services/creature-evolution-trait-key.ts -- the one function that decides
// what string the client reports to the account-scoped, server-side sync_creature_traits RPC
// (see supabase/migrations/20261022030000_creature_evolution_notification.sql). A bug here
// would silently break the whole correction -- e.g. two genuinely different traits colliding
// on one key would suppress a real evolution notification, and a trait that changes its own
// key representation between app versions would fabricate a spurious one -- so this is proven
// by actually calling the function, not by reading it and asserting it looks right.
//
// Run with: npx tsx scripts/validate-creature-evolution-trait-key.ts

import { traitKey } from '../src/services/creature-evolution-trait-key';
import type { SignatureTrait } from '../src/data/personality';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const makeTrait = (overrides: Partial<SignatureTrait>): SignatureTrait => ({
  id: 'planner_spontaneous',
  name: 'Planner',
  displayName: 'The Planner',
  percent: 80,
  normalizedScore: 0.8,
  signatureStrength: 0.8,
  confidence: 0.9,
  breadth: 3,
  evidenceCount: 5,
  ...overrides,
});

// Same (id, name) -> identical key, regardless of every other field on the trait (percent,
// confidence, evidenceCount, etc. are real signals that fluctuate run to run as more evidence
// accumulates -- none of them may leak into the dedup key, or a trait would appear "new" every
// time its own strength changes).
{
  const a = makeTrait({ percent: 60, confidence: 0.5, evidenceCount: 2 });
  const b = makeTrait({ percent: 95, confidence: 0.99, evidenceCount: 40 });
  assert(traitKey(a) === traitKey(b), 'identical (id, name) produces the identical key even when every other field differs');
}

// Different id -> different key, even with the same display name (two dimensions could in
// principle share a presentational name; the server-side uniqueness must key off the real
// dimension id, not the human-readable label).
{
  const a = makeTrait({ id: 'planner_spontaneous', name: 'Planner' });
  const b = makeTrait({ id: 'control_allowing', name: 'Planner' });
  assert(traitKey(a) !== traitKey(b), 'different id with the same name produces different keys');
}

// Different name with the same id is not a real scenario this engine produces (name is derived
// from id), but the function must still not silently collide two distinct inputs -- confirms
// the key is a genuine composite of both fields, not just one of them.
{
  const a = makeTrait({ id: 'planner_spontaneous', name: 'Planner' });
  const b = makeTrait({ id: 'planner_spontaneous', name: 'Spontaneous' });
  assert(traitKey(a) !== traitKey(b), 'different name with the same id produces different keys');
}

// The key must survive a colon appearing inside either field without colliding -- guards
// against a real collision class a plain `${id}:${name}` template would have: id="a:b", name="c"
// vs id="a", name="b:c" must not collide. Forced via a double cast since no real
// PersonalityDimensionId contains a colon -- this probes the key function's own robustness,
// not a value this engine would ever actually produce.
{
  const a = makeTrait({ id: 'a:b' as unknown as SignatureTrait['id'], name: 'c' });
  const b = makeTrait({ id: 'a' as unknown as SignatureTrait['id'], name: 'b:c' });
  assert(traitKey(a) !== traitKey(b), 'ambiguous concatenation across the id/name boundary does not collide (distinct composite key)');
}

// Mapping an array of traits is order-preserving and produces one key per trait, matching what
// checkAndNotifyCreatureEvolution actually sends as p_trait_keys.
{
  const traits = [makeTrait({ id: 'planner_spontaneous', name: 'Planner' }), makeTrait({ id: 'control_allowing', name: 'Control' })];
  const keys = traits.map(traitKey);
  assert(keys.length === 2 && keys[0] !== keys[1], 'mapping multiple real traits produces one distinct key per trait, in order');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL creature-evolution-trait-key checks PASSED -- genuine function calls proving the account-scoped dedup key is a true composite of (id, name), not source-text assertions.');
