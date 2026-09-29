// Builds/refreshes the persistent Creature factory manifest: 40 Core trait poles x 7 slots =
// 280 rows. Source of truth for factory progress -- re-run any time canonical assets change;
// the agent (or a person) should be able to resume from manifest.json after an interruption
// without re-deriving anything by hand.
import { PERSONALITY_DIMENSIONS } from '../../src/data/personality';

declare const __dirname: string;
const { existsSync, writeFileSync } = require('fs');
const { join, resolve } = require('path');

const SLOTS = ['eyes', 'ears', 'wings', 'body', 'tail', 'headFeature', 'chestCrest'] as const;
type Slot = (typeof SLOTS)[number];

const SLOT_ORIGINAL_FOLDER: Record<Slot, string> = {
  eyes: 'eyes', ears: 'ears', wings: 'wings', body: 'body', tail: 'tail', headFeature: 'headpiece', chestCrest: 'chest',
};
const SLOT_ORIGINAL_SUFFIX: Record<Slot, string> = {
  eyes: 'eyes', ears: 'ears', wings: 'wings', body: 'body', tail: 'tail', headFeature: 'head-feature', chestCrest: 'chest-crest',
};

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const coreDimensions = PERSONALITY_DIMENSIONS.filter((d) => d.type === 'core');
if (coreDimensions.length !== 20) throw new Error(`Expected 20 Core dimensions, found ${coreDimensions.length}`);

type Pole = { dimensionId: string; label: string; slug: string };
const poles: Pole[] = coreDimensions.flatMap((d) => {
  if (!d.positiveLabel || !d.negativeLabel) throw new Error(`${d.id} missing a pole label`);
  return [
    { dimensionId: d.id, label: d.positiveLabel, slug: slugify(d.positiveLabel) },
    { dimensionId: d.id, label: d.negativeLabel, slug: slugify(d.negativeLabel) },
  ];
});
if (poles.length !== 40) throw new Error(`Expected 40 Core trait poles, found ${poles.length}`);

// camelCase family key used by the canonical-v0 generator's output directory names, for the 8
// families that have a complete registered kit today.
const COMPLETE_FAMILY_KEY: Record<string, string> = {
  independent: 'independent', collaborative: 'collaborative', control: 'control',
  'let-it-play-out': 'letItPlayOut', practical: 'practical', idealistic: 'idealistic',
  sentimental: 'sentimental', 'thick-skinned': 'thickSkinned',
};

// The 12 traits that have an approved original BODY only (registered as a canonical body-only
// asset), with no other slot's art yet approved.
const BODY_ONLY_SLUGS = new Set([
  'adventurous', 'comfort-seeking', 'direct', 'emotionally-intense', 'even-keeled', 'face-value',
  'hands-off', 'indirect', 'planner', 'protective', 'spontaneous', 'vibe-checker',
]);

const REPO_ROOT = resolve(__dirname, '../..');
const CANONICAL_ROOT = join(REPO_ROOT, 'assets/creatures-canonical/v0');
const SOURCE_ROOT = join(REPO_ROOT, 'assets/creatures');

type ManifestRow = {
  traitId: string;
  dimensionId: string;
  displayName: string;
  slot: Slot;
  sourceFile: string | null;
  canonicalFile: string | null;
  version: string | null;
  status: 'complete' | 'body-only-registered' | 'missing-art';
  registrationStatus: 'registered' | 'not-applicable';
  validationStatus: 'pending' | 'pass' | 'fail';
  notes: string;
};

// Known, non-blocking visual-polish findings from validate_canonical_pixels.py + visual QA
// composite review. None of these were judged severe enough to warrant another geometry
// change (unlike the ear-root Y refinement in canonical-geometry.ts, which WAS): all 8
// families' head-feature art touches the canvas top edge by a small amount (the tall-crown
// tip is trimmed a few px; confirmed visually negligible across every composite reviewed this
// pass), and Control's wings (the one family using the 1448x1086 landscape wings canvas at a
// >1x registration scale) touch both the left and right canvas edges with a very slight tip
// clip. Flagged for whoever does the next headroom pass; not re-litigated here.
function knownIssueNote(slug: string, slot: Slot): string {
  if (slot === 'headFeature') {
    return 'Head-feature art touches the canvas top edge by a small amount under the frozen v0 canvas (crown tip trimmed a few px). Confirmed visually negligible in composite QA; non-blocking.';
  }
  if (slot === 'wings' && slug === 'control') {
    return "Control's wings use the 1448x1086 landscape canvas at >1x registration scale and touch both the left and right canvas edges (slight wingtip clip). Confirmed visually minor in composite QA; non-blocking.";
  }
  if (slot === 'tail' && slug === 'let-it-play-out') {
    return "Let It Play Out's tail curl extends slightly past the canvas bottom edge -- confirmed via pixel row scan (171-190 opaque px in the last 10 rows, a real if minor clip of the curl's outer tip, not a coincidental touch). Same severity class as Control's wingtip clip; non-blocking but should be revisited alongside it.";
  }
  return '';
}

const rows: ManifestRow[] = [];

for (const pole of poles) {
  const familyKey = COMPLETE_FAMILY_KEY[pole.slug];
  for (const slot of SLOTS) {
    if (familyKey) {
      const canonicalFile = `assets/creatures-canonical/v0/${familyKey}/${familyKey}-${slot}-canonical-v0.svg`;
      const exists = existsSync(join(REPO_ROOT, canonicalFile));
      const version = slot === 'body' && pole.slug === 'sentimental' ? 'v2' : pole.slug === 'independent' ? 'v2' : 'v1';
      const sourceFile = `assets/creatures/${SLOT_ORIGINAL_FOLDER[slot]}/${pole.slug}-${SLOT_ORIGINAL_SUFFIX[slot]}-master-${version}.svg`;
      rows.push({
        traitId: pole.slug,
        dimensionId: pole.dimensionId,
        displayName: pole.label,
        slot,
        sourceFile: existsSync(join(REPO_ROOT, sourceFile)) ? sourceFile : null,
        canonicalFile: exists ? canonicalFile : null,
        version,
        status: exists ? 'complete' : 'missing-art',
        registrationStatus: exists ? 'registered' : 'not-applicable',
        validationStatus: exists ? 'pass' : 'pending',
        notes: exists ? knownIssueNote(pole.slug, slot) : '',
      });
    } else if (slot === 'body' && BODY_ONLY_SLUGS.has(pole.slug)) {
      const canonicalFile = `assets/creatures-canonical/v0/_body-only/${pole.slug}/${pole.slug}-body-canonical-v0.svg`;
      const exists = existsSync(join(REPO_ROOT, canonicalFile));
      const sourceFile = `assets/creatures/body/${pole.slug}-body-master-v1.svg`;
      rows.push({
        traitId: pole.slug,
        dimensionId: pole.dimensionId,
        displayName: pole.label,
        slot,
        sourceFile: existsSync(join(REPO_ROOT, sourceFile)) ? sourceFile : null,
        canonicalFile: exists ? canonicalFile : null,
        version: 'v1',
        status: exists ? 'body-only-registered' : 'missing-art',
        registrationStatus: exists ? 'registered' : 'not-applicable',
        validationStatus: exists ? 'pass' : 'pending',
        notes: 'Approved original body only -- no eyes/ears/wings/tail/head-feature/chest-crest exist for this trait yet. Needs new illustrated art, which this factory pass could not generate (no image-generation tool available).',
      });
    } else {
      rows.push({
        traitId: pole.slug,
        dimensionId: pole.dimensionId,
        displayName: pole.label,
        slot,
        sourceFile: null,
        canonicalFile: null,
        version: null,
        status: 'missing-art',
        registrationStatus: 'not-applicable',
        validationStatus: 'pending',
        notes: 'No approved source art exists for this trait/slot. Needs new illustrated art, which this factory pass could not generate (no image-generation tool available).',
      });
    }
  }
}

if (rows.length !== 280) throw new Error(`Expected 280 manifest rows, built ${rows.length}`);

const summary = {
  total: rows.length,
  complete: rows.filter((r) => r.status === 'complete').length,
  bodyOnlyRegistered: rows.filter((r) => r.status === 'body-only-registered').length,
  missingArt: rows.filter((r) => r.status === 'missing-art').length,
};

const manifest = { generatedAt: new Date().toISOString(), canvas: '1600x1800 (frozen v0)', summary, rows };

const outPath = join(__dirname, 'manifest.json');
writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${outPath}`);
console.log(summary);
