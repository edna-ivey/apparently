import { useEffect, useState } from 'react';

import { getMyPersonalityEvidence, groupEvidenceIntoAnswers } from '@/services/personality-service';
import { ensureAnonymousSession } from '@/services/auth-service';
import { scorePersonalityProfile } from '@/data/personality';
import { selectRelicSlots, selectStrongestPrivateSignals } from '@/data/private-signals';
import { resolveRelicIdentity, type ResolvedRelicIdentity } from '@/data/relic/relic-production-config';

// Today's real, non-fabricated Relic connection — for the Private Daily reveal modal.
// Replicates the EXACT same pure derivation chain you.tsx uses for its own Relic
// (selectStrongestPrivateSignals -> selectRelicSlots -> resolveRelicIdentity — all imported
// directly, nothing re-implemented), but runs its own independent profile fetch rather than
// reusing/refactoring you.tsx's own fetch orchestration (which also drives Creature evolution
// checkpoints, Commonality, and Your Signature — out of scope here, and riskier to touch than
// to duplicate one read). The one real cost of this choice is a second personality-evidence
// fetch when the Private modal opens rather than one shared read; the alternative (extracting
// a shared hook out of you.tsx's screen-level state) was judged a larger, correctness-risky
// refactor for this pass. Progressive reveal is preserved exactly: `identity.base !== null` is
// the one and only "has anything real to show" gate, matching relic-avatar.tsx/RelicGlyph —
// this hook never waits for all three slots.
export type TodayRelicConnection =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'veiled' }
  | { status: 'revealed'; identity: { base: NonNullable<ResolvedRelicIdentity['base']>; color: ResolvedRelicIdentity['color']; effect: ResolvedRelicIdentity['effect'] } };

export function useTodayRelicConnection(): TodayRelicConnection {
  const [connection, setConnection] = useState<TodayRelicConnection>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureAnonymousSession();
      const evidenceResult = await getMyPersonalityEvidence();
      if (cancelled) {
        return;
      }
      if (!evidenceResult.ok) {
        setConnection({ status: 'error' });
        return;
      }
      const answers = groupEvidenceIntoAnswers(evidenceResult.data);
      const profile = scorePersonalityProfile(answers);
      const signals = selectStrongestPrivateSignals(profile);
      const slots = selectRelicSlots(signals);
      const identity = resolveRelicIdentity(slots);
      setConnection(
        identity.base
          ? { status: 'revealed', identity: { base: identity.base, color: identity.color, effect: identity.effect } }
          : { status: 'veiled' },
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return connection;
}
