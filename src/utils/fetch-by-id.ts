// Generic "fetch N independent things, each keyed by its own immutable id" helper.
//
// This exists specifically to make cross-item data leakage STRUCTURALLY impossible rather
// than merely convention: the id a result is stored under is the SAME id that was passed
// into fetchOne for that call, captured by closure — there is no shared/mutable "the current
// result" variable anywhere for two concurrent fetches to race over or accidentally share.
// (The admin dashboard's Daily-distribution bug this replaces was exactly that: one shared
// `liveDistribution` state fetched for whichever Live question `Array.find()` happened to
// return first, then rendered identically on every "Live" card regardless of which question
// it actually belonged to — see the admin dashboard's own comments and
// scripts/validate-admin-distribution-scoping.ts.)
export type ByIdState<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; message: string };

export type FetchOneResult<T> = { ok: true; data: T } | { ok: false; message: string };

// Marks every id 'loading', then fetches each independently and reports it via onUpdate as
// soon as ITS OWN fetch resolves — a slow id never blocks a fast one, and a failed id never
// masks or gets masked by another id's result.
export const fetchAllById = async <T>(
  ids: string[],
  fetchOne: (id: string) => Promise<FetchOneResult<T>>,
  onUpdate: (id: string, state: ByIdState<T>) => void,
): Promise<void> => {
  ids.forEach((id) => onUpdate(id, { status: 'loading' }));
  await Promise.all(
    ids.map(async (id) => {
      const result = await fetchOne(id);
      onUpdate(id, result.ok ? { status: 'ready', data: result.data } : { status: 'error', message: result.message });
    }),
  );
};
