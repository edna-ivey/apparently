// Pure mapping from a resolved SignatureTrait to the stable string key the server-side
// sync_creature_traits RPC uses for its (user_id, trait_key) uniqueness check (see
// supabase/migrations/20261022030000_creature_evolution_notification.sql). Zero imports beyond
// the type itself -- importable from both the real app (creature-evolution-notification-
// service.ts) and a plain Node/tsx behavioral test
// (scripts/validate-creature-evolution-trait-key.ts) with no React Native/Supabase runtime
// required.
import type { SignatureTrait } from '@/data/personality';

// JSON-encoding the pair (rather than a plain `${id}:${name}` template) guarantees the key
// can never collide across two genuinely different (id, name) pairs, even if either field ever
// contained a ":" itself (e.g. id="a:b", name="c" vs id="a", name="b:c" would otherwise both
// produce "a:b:c") -- found by scripts/validate-creature-evolution-trait-key.ts, not assumed.
export const traitKey = (trait: SignatureTrait): string => JSON.stringify([trait.id, trait.name]);
