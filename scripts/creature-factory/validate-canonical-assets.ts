// Validates every canonical v0 asset currently on disk against the frozen registration system.
// Run after any canonical-asset generation/regeneration. Does NOT validate the 212 not-yet-
// created assets (there's nothing to validate) -- manifest.json's status field is what tracks
// those as outstanding.
import { CANVAS } from './canonical-geometry';

declare const __dirname: string;
const { readdirSync, readFileSync } = require('fs');
const { Buffer } = require('buffer');
const { join, relative, resolve, basename } = require('path');

const REPO_ROOT = resolve(__dirname, '../..');
const CANONICAL_ROOT = join(REPO_ROOT, 'assets/creatures-canonical/v0');

type Result = { file: string; checks: Record<string, boolean>; ok: boolean };

function findAllSvgs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findAllSvgs(full));
    else if (entry.name.endsWith('.svg')) out.push(full);
  }
  return out;
}

function decodePngFromSvg(svgText: string) {
  const m = svgText.match(/href="data:image\/png;base64,([^"]+)"/);
  if (!m) return null;
  return Buffer.from(m[1], 'base64');
}

// Minimal PNG parsing: dimensions from IHDR, and a coarse "is it fully transparent / is it
// blank" check by scanning for any non-zero alpha byte pattern is not practical without a PNG
// decode library, so we check structural/registration properties precisely (viewBox, canvas
// size, filename, non-empty payload, bounds-safe base64 length) and flag anything needing a
// visual look rather than claiming pixel-level certainty we can't cheaply compute without a
// dependency this repo doesn't have.
function pngDimensions(buf: any): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  const isPng = buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG';
  if (!isPng) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function validateFile(file: string): Result {
  const rel = relative(REPO_ROOT, file);
  const checks: Record<string, boolean> = {};
  const text = readFileSync(file, 'utf8');

  checks['valid_xml_declares_svg_root'] = /<svg[\s>]/.test(text) && text.trim().endsWith('</svg>');

  const viewBoxMatch = text.match(/viewBox="0 0 (\d+) (\d+)"/);
  checks['expected_viewbox'] = !!viewBoxMatch && Number(viewBoxMatch[1]) === CANVAS.width && Number(viewBoxMatch[2]) === CANVAS.height;

  const widthHeightMatch = text.match(/width="(\d+)" height="(\d+)"/);
  checks['expected_canvas_dimensions'] = !!widthHeightMatch && Number(widthHeightMatch[1]) === CANVAS.width && Number(widthHeightMatch[2]) === CANVAS.height;

  const png = decodePngFromSvg(text);
  checks['has_embedded_png_payload'] = !!png && png.length > 1000;

  if (png) {
    const dims = pngDimensions(png);
    checks['png_dimensions_match_canvas'] = !!dims && dims.width === CANVAS.width && dims.height === CANVAS.height;
    // PNG color type byte (offset 25) 6 = RGBA (has alpha channel) -- a precondition for
    // "transparent background possible at all". Does not confirm any given pixel IS
    // transparent (that needs a full decode) -- flagged as a visual-inspection item below.
    checks['png_has_alpha_channel'] = buf25IsRgba(png);
  } else {
    checks['png_dimensions_match_canvas'] = false;
    checks['png_has_alpha_channel'] = false;
  }

  checks['filename_matches_convention'] = /-(canonical)-v0\.svg$/.test(basename(file));

  const ok = Object.values(checks).every(Boolean);
  return { file: rel, checks, ok };
}

function buf25IsRgba(buf: any): boolean {
  return buf.length > 25 && buf[25] === 6;
}

function main() {
  const files = findAllSvgs(CANONICAL_ROOT);
  const results = files.map(validateFile);
  const failing = results.filter((r) => !r.ok);

  console.log(`Validated ${results.length} canonical v0 files.`);
  console.log(`Pass: ${results.length - failing.length}  Fail: ${failing.length}`);

  if (failing.length > 0) {
    console.log('\nFAILURES:');
    for (const r of failing) {
      const failedChecks = Object.entries(r.checks).filter(([, v]) => !v).map(([k]) => k);
      console.log(`  ${r.file}: ${failedChecks.join(', ')}`);
    }
  }

  console.log(
    '\nNOTE: this script verifies structural/registration properties (valid SVG, canonical viewBox' +
      '/canvas size, embedded PNG present with an alpha channel, filename convention). It does NOT' +
      ' verify per-pixel transparency, absence of a white matte, non-blank artwork, or freedom from' +
      ' clipping at the sub-pixel level -- none of the dependencies already in this repo decode PNG' +
      ' pixel data, and adding one was out of scope for this pass. Those properties were checked' +
      ' the way the rest of this session did: composite + visual inspection (see the QA composites' +
      ' this script does not replace).',
  );

  if (failing.length > 0) process.exit(1);
}

main();
