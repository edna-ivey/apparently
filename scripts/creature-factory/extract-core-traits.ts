// Programmatic audit: derive the authoritative 40 Core trait poles from src/data/personality.ts.
// Never hand-type this list -- if personality.ts ever changes, this script is the single place
// that would need re-running, and it asserts the invariants rather than assuming them.
import { PERSONALITY_DIMENSIONS } from '../../src/data/personality';

const coreDimensions = PERSONALITY_DIMENSIONS.filter((d) => d.type === 'core');

if (coreDimensions.length !== 20) {
  throw new Error(`Expected exactly 20 Core dimensions, found ${coreDimensions.length}`);
}

const poles = coreDimensions.flatMap((d) => {
  if (!d.positiveLabel || !d.negativeLabel) {
    throw new Error(`Dimension ${d.id} is missing a pole label`);
  }
  return [
    { dimensionId: d.id, pole: 'positive', label: d.positiveLabel },
    { dimensionId: d.id, pole: 'negative', label: d.negativeLabel },
  ];
});

if (poles.length !== 40) {
  throw new Error(`Expected exactly 40 Core trait poles, found ${poles.length}`);
}

console.log(`OK: ${coreDimensions.length} Core dimensions, ${poles.length} Core trait poles\n`);
for (const d of coreDimensions) {
  console.log(`${d.id.padEnd(32)} ${d.positiveLabel} / ${d.negativeLabel}`);
}

console.log('\n--- JSON ---');
console.log(JSON.stringify(poles, null, 2));
