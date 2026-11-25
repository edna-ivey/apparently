// ISOLATED EXPERIMENT TOOL -- not part of production code, not referenced by any app screen.
// Extracts the embedded base64 PNG payload out of each of the 80 Creature/Relic .svg wrapper
// files (40 + 40) byte-exact -- no redraw, resize, recolor, or recompression of any kind, just
// a base64 decode of the exact bytes already inside the existing, unmodified .svg files. Writes
// output to assets/_png_experiment/, a brand-new directory that nothing in src/ imports from,
// so this cannot affect Today, You, Creature Read, Relic Read, or any other existing screen.
// The original .svg files under assets/creatures/ and assets/relics/ are never opened for
// writing, never touched.
//
// Run with: npx tsx scripts/experiment-extract-embedded-png.ts

declare const require: (id: string) => any;
declare const __dirname: string;
declare const Buffer: { from: (data: any, encoding?: string) => { length: number; subarray: (start: number, end: number) => any; equals: (other: any) => boolean; readUInt32BE: (offset: number) => number } };
const { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } = require('fs');
const { join, relative, dirname } = require('path') as { join: (...parts: string[]) => string; relative: (from: string, to: string) => string; dirname: (p: string) => string };
const { createHash } = require('crypto') as { createHash: (algo: string) => { update: (data: any) => { digest: (enc: string) => string } } };

const ROOT = join(__dirname, '..');
const SOURCE_DIRS = [join(ROOT, 'assets/creatures'), join(ROOT, 'assets/relics')];
const OUTPUT_ROOT = join(ROOT, 'assets/_png_experiment');

function listSvgFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...listSvgFiles(full));
    } else if (entry.toLowerCase().endsWith('.svg')) {
      out.push(full);
    }
  }
  return out;
}

type Result = { source: string; output: string; width: number; height: number; pngBytes: number; sha256: string };

const results: Result[] = [];
let skipped = 0;

for (const sourceDir of SOURCE_DIRS) {
  for (const svgPath of listSvgFiles(sourceDir)) {
    const svgText = readFileSync(svgPath, 'utf8');
    const match = svgText.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
    if (!match) {
      skipped += 1;
      console.warn(`SKIP (no embedded base64 PNG found): ${relative(ROOT, svgPath)}`);
      continue;
    }
    const pngBuffer = Buffer.from(match[1], 'base64');
    // Validate PNG signature before trusting it.
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (!pngBuffer.subarray(0, 8).equals(pngSignature)) {
      throw new Error(`Extracted bytes for ${svgPath} do not start with a valid PNG signature -- refusing to write.`);
    }
    const width = pngBuffer.readUInt32BE(16);
    const height = pngBuffer.readUInt32BE(20);

    const relPath = relative(sourceDir, svgPath);
    const outDirLabel = sourceDir.endsWith('relics') ? 'relics' : 'creatures';
    const outputPath = join(OUTPUT_ROOT, outDirLabel, relPath.replace(/\.svg$/i, '.png'));
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, pngBuffer);

    results.push({
      source: relative(ROOT, svgPath),
      output: relative(ROOT, outputPath),
      width,
      height,
      pngBytes: pngBuffer.length,
      sha256: createHash('sha256').update(pngBuffer).digest('hex').slice(0, 16),
    });
  }
}

console.log(`Extracted ${results.length} PNGs (skipped ${skipped} non-matching files) to ${relative(ROOT, OUTPUT_ROOT)}/\n`);
console.log('| File | Dimensions | PNG bytes | sha256 (first 16 hex) |');
console.log('|---|---|---:|---|');
for (const r of results) {
  console.log(`| ${r.output.split('/').pop()} | ${r.width}x${r.height} | ${r.pngBytes} | ${r.sha256} |`);
}

const badDims = results.filter((r) => r.width !== 1254 || r.height !== 1254);
if (badDims.length > 0) {
  console.warn(`\nWARNING: ${badDims.length} file(s) did not match the expected 1254x1254 canvas:`, badDims.map((r) => r.output));
} else {
  console.log(`\nAll ${results.length} extracted PNGs are exactly 1254x1254, matching every source .svg's documented canvas size.`);
}

writeFileSync(join(OUTPUT_ROOT, 'extraction-manifest.json'), JSON.stringify(results, null, 2) + '\n');
