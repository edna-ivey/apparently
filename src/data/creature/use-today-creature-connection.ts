import { useEffect, useState } from 'react';

import { loadCreatureEvolutionState, type CreatureEvolutionState } from '@/data/creature/creature-reveal-state';
import type { CreatureRecipe } from '@/data/creature/creature-identity';

// Today's real, non-fabricated Creature connection — for the Free Daily reveal modal and the
// "Your Creature" panel. Deliberately reads ONLY the already-persisted
// CreatureEvolutionState (loadCreatureEvolutionState, the exact same read you.tsx itself uses
// to keep a revealed Creature stable between visits), rather than duplicating you.tsx's own
// live profile-fetch + weekly-evolution-check state machine. That machine is substantial and
// correctness-critical (reveal thresholds, evolution checkpoints); this hook intentionally
// does not re-derive or guess at it. The tradeoff: Today only shows the real, full Mixed Form
// Creature once `mixedSnapshot` has been persisted (i.e. the user has already seen their real
// reveal on You) — it never shows the intermediate First Form here, since that requires a
// live profile score this hook deliberately does not fetch. Before a mixedSnapshot exists,
// Today truthfully shows the unrevealed/"still listening" state, which is never wrong (it
// just doesn't claim First Form-level progress either way).
export type TodayCreatureConnection =
  | { status: 'loading' }
  | { status: 'unrevealed' }
  | { status: 'revealed'; name: string; recipe: CreatureRecipe };

export function useTodayCreatureConnection(): TodayCreatureConnection {
  const [state, setState] = useState<CreatureEvolutionState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadCreatureEvolutionState().then((loaded) => {
      if (!cancelled) {
        setState(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === null) {
    return { status: 'loading' };
  }
  if (state.mixedSnapshot) {
    return { status: 'revealed', name: state.mixedSnapshot.name, recipe: state.mixedSnapshot.recipe };
  }
  return { status: 'unrevealed' };
}
