import { useEffect, useState } from 'react';

import { getMyTraitTotals } from '@/services/personality-v2-service';
import { ensureAnonymousSession } from '@/services/auth-service';
import { rankPrivateSignalTraitsFromTotals } from '@/data/personality-v2/totals-ranking';
import { selectRelicSlots } from '@/data/private-signals';
import { resolveRelicIdentity, type ResolvedRelicIdentity } from '@/data/relic/relic-production-config';

// Today's real, non-fabricated Relic connection — for the Private Daily reveal modal.
// Replicates the EXACT same pure derivation chain you.tsx uses for its own Relic
// (rankPrivateSignalTraits -> selectRelicSlots -> resolveRelicIdentity — all imported
// directly, nothing re-implemented), but runs its own independent pole-evidence fetch rather
// than reusing/refactoring you.tsx's own fetch orchestration (which also drives Creature
// evolution checkpoints, Commonality, and Your Signature — out of scope here, and riskier to
// touch than to duplicate one read). The one real cost of this choice is a second
// personality-pole-evidence fetch when the Private modal opens rather than one shared read;
// the alternative (extracting a shared hook out of you.tsx's screen-level state) was judged a
// larger, correctness-risky refactor for this pass. Progressive reveal is preserved exactly:
// `identity.base !== null` is the one and only "has anything real to show" gate, matching
// relic-avatar.tsx/RelicGlyph — this hook never waits for all three slots.
export type TodayRelicConnection =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'veiled' }
  | { status: 'revealed'; identity: { base: NonNullable<ResolvedRelicIdentity['base']>; color: ResolvedRelicIdentity['color']; effect: ResolvedRelicIdentity['effect'] } };

// Build 22 owner audit (2026-10-30), item 4: this hook fetches exactly once per mount (empty
// effect deps) and the Today tab screen is never unmounted on blur (no unmountOnBlur/
// useFocusEffect reload anywhere above it) -- so a single transient failure, left unretried,
// would strand the Relic in its 'error'/'veiled' rendering (see RelicStage) for the rest of
// the session, with no UI affordance here (unlike you.tsx's own retry button) to recover it.
// One bounded automatic retry closes that gap without inventing new retry UI.
const RETRY_DELAY_MS = 2000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useTodayRelicConnection(): TodayRelicConnection {
  const [connection, setConnection] = useState<TodayRelicConnection>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureAnonymousSession();
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (attempt > 0) {
          await sleep(RETRY_DELAY_MS);
        }
        if (cancelled) {
          return;
        }
        // Build 22: V2 is the sole, authoritative ranking engine for Private/Relic, read from
        // the small, precomputed user_trait_totals aggregate -- see totals-ranking.ts's own
        // header comment for why this is the right input, not rankPoles.
        const traitTotalsResult = await getMyTraitTotals();
        if (cancelled) {
          return;
        }
        if (traitTotalsResult.ok) {
          const signals = rankPrivateSignalTraitsFromTotals(traitTotalsResult.data);
          const slots = selectRelicSlots(signals);
          const identity = resolveRelicIdentity(slots);
          setConnection(
            identity.base
              ? { status: 'revealed', identity: { base: identity.base, color: identity.color, effect: identity.effect } }
              : { status: 'veiled' },
          );
          return;
        }
        // Build 22 owner audit (2026-10-30), item 4: a fetch failure must NEVER be treated as
        // "zero evidence yet" (-> veiled) -- veiled is a real product state meaning "no
        // qualifying Private signal has formed," which is a false claim about a user whose
        // Relic may have already fully formed. Surface the already-defined 'error' status
        // instead (RelicStage renders it distinctly from 'veiled' -- see that component),
        // after the one retry above has also failed.
        if (attempt === 1) {
          setConnection({ status: 'error' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return connection;
}
