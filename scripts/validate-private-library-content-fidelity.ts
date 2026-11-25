// Content-fidelity regression for the ENTIRE 17-quiz approved Private quiz library. Every
// expected string here is parsed directly from docs/private-quizzes/*.md at run time — nothing
// is copied from, derived from, or compared against the production *.ts files' own content.
// The *.ts files are only ever the thing being CHECKED, never the source of what "correct"
// means. A future edit (human or LLM) that drops, shortens, or rewrites an approved line will
// fail this on content alone, independent of whether it renders fine.
//
// Build 22 final cleanup round (2026-11-02), item 4: REWRITTEN. The prior version pointed at
// docs/private-quizzes/APPROVED_PRIVATE_QUIZZES.md and APPROVED_HIDDEN_YOU.md/APPROVED_LIFE_MATCH.md/
// APPROVED_STYLE_VIBE.md/APPROVED_PRIVATE_PRIVATE.md for inline question text -- all five were
// restructured this engagement into a short index (APPROVED_PRIVATE_QUIZZES.md) plus either a
// dedicated "_APPROVED_LOCKED_" doc per quiz or a section inside
// APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md, so the old doc pointers/anchors/heading regex no
// longer matched anything (the script crashed outright). This version points at the CURRENT
// locked documents and handles the two real heading/choice conventions found across them:
//
//   Convention A ("### Q1. <prompt text inline>" + "- **A [a].** <label>" choices) --
//   CAREER_HOW_BAD_APPROVED_LOCKED_2026-10-31.md, CAREER_PROVING_APPROVED_LOCKED_2026-10-31.md,
//   HIDDEN_YOU_WRONG_APPROVED_LOCKED_2026-10-31.md, LOVE_READY_APPROVED_LOCKED_2026-10-31.md.
//
//   Convention B ("### QUESTION N OF 10" heading, prompt on its OWN bolded line below) +
//   "**A.** <label>" choices) -- LIFE_MATCH_APPROVED_LOCKED_2026-11-01.md,
//   STYLE_VIBE_APPROVED_LOCKED_2026-11-01.md, and every section inside
//   APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md (all 3 free previews, After Dark, and the 7
//   new premium quizzes).
//
// Both conventions share the SAME reveal-section structure: "### <TITLE>" then
// "**THE VERDICT**" / "**THE PRIVATE READ**" / "**THE CALL-OUT**" / "**THE COST**" /
// "**TRY THIS**" / "**THE KICKER**" / "*Apparently, ...*" / a traits line (either
// "**YOUR TRAITS**" + a following paragraph, or inline "**YOUR TRAITS (display only):** ...").
//
// Run with: npx tsx scripts/validate-private-library-content-fidelity.ts
import { QUIZ_REGISTRY } from '../src/data/quizzes/index';
import type { ArchetypeQuizDefinition, QuizDefinition } from '../src/data/quizzes/types';

declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

const DOCS_DIR = join(__dirname, '..', 'docs', 'private-quizzes');

let failures = 0;
let passes = 0;
const fail = (message: string) => { failures += 1; console.error(`FAIL: ${message}`); };
const pass = (message: string) => { passes += 1; console.log(`OK: ${message}`); };
const note = (message: string) => console.log(`NOTE: ${message}`);

// Straight vs. typographic apostrophes/quotes are a known, intentional authoring convention
// difference (docs are written with plain ' ", the .ts content files use proper ’ “ ” for
// display) -- not a content drift. Normalized away before comparison so this validator flags
// genuine wording differences, not punctuation-style noise.
const normalizeQuotes = (s: string): string => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...');
const normalize = (s: string): string => normalizeQuotes(s).replace(/\s+/g, ' ').trim();
const stripMd = (s: string): string => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim();

// -------------------------------------------------------------------------------------------
// SOURCE REGISTRY -- one entry per quiz, pointing at its real, current authoritative document.
// -------------------------------------------------------------------------------------------
// A: "### Q1. <prompt inline>" + "- **A [a].** <label>" (dedicated 2026-10-31 docs).
// B: "### QUESTION N OF 10" + separate bold prompt line + "**A.** <label>" (dedicated
//    2026-11-01 docs + source files 03/04 of the Nov-2 pack).
// C: "**Q1. <prompt>**" inline-bold (no markdown heading at all) + "- **A [code].** <label>"
//    (source file 01 of the Nov-2 pack: keep-you-around, be-so-serious, secretly-love).
// D: "## QUESTION N OF 10" (two hashes, not three) + "**A.** <label>" (source file 02 of the
//    Nov-2 pack: private-private-trouble / After Dark).
type Convention = 'A' | 'B' | 'C' | 'D';
type Source = {
  quizId: string;
  docFile: string;
  sectionAnchor: string | null;
  convention: Convention;
  expectedAccess: 'private-preview' | 'private';
  expectedMature: boolean;
  // private-private-trouble's reveal content sits under its OWN separate top-level "# " heading
  // ("# THE FOUR PRIVATE REVEALS"), immediately after its questions section's own top-level
  // heading ends -- extractSection's "bounded by the next # heading" rule would otherwise cut
  // the section off before the reveals are ever reached. Concatenated onto the main section
  // when present.
  extraRevealAnchor?: string;
};

const SOURCES: Source[] = [
  { quizId: 'career-ambition-how-bad', docFile: 'CAREER_HOW_BAD_APPROVED_LOCKED_2026-10-31.md', sectionAnchor: null, convention: 'A', expectedAccess: 'private', expectedMature: false },
  { quizId: 'career-ambition-proving', docFile: 'CAREER_PROVING_APPROVED_LOCKED_2026-10-31.md', sectionAnchor: null, convention: 'A', expectedAccess: 'private', expectedMature: false },
  { quizId: 'hidden-you-wrong', docFile: 'HIDDEN_YOU_WRONG_APPROVED_LOCKED_2026-10-31.md', sectionAnchor: null, convention: 'A', expectedAccess: 'private', expectedMature: false },
  { quizId: 'love-soulmates-ready', docFile: 'LOVE_READY_APPROVED_LOCKED_2026-10-31.md', sectionAnchor: null, convention: 'A', expectedAccess: 'private', expectedMature: false },
  { quizId: 'life-match-dream-life', docFile: 'LIFE_MATCH_APPROVED_LOCKED_2026-11-01.md', sectionAnchor: null, convention: 'B', expectedAccess: 'private', expectedMature: false },
  { quizId: 'style-vibe-intimidating', docFile: 'STYLE_VIBE_APPROVED_LOCKED_2026-11-01.md', sectionAnchor: null, convention: 'B', expectedAccess: 'private', expectedMature: false },
  { quizId: 'keep-you-around', docFile: 'APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md', sectionAnchor: '# QUIZ 1: SO WHY DO PEOPLE KEEP YOU AROUND?', convention: 'C', expectedAccess: 'private-preview', expectedMature: false },
  { quizId: 'be-so-serious', docFile: 'APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md', sectionAnchor: '# QUIZ 2: BE SO SERIOUS RIGHT NOW.', convention: 'C', expectedAccess: 'private-preview', expectedMature: false },
  { quizId: 'secretly-love', docFile: 'APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md', sectionAnchor: '# QUIZ 3: WHAT DO PEOPLE SECRETLY LOVE ABOUT YOU?', convention: 'C', expectedAccess: 'private-preview', expectedMature: false },
  { quizId: 'private-private-trouble', docFile: 'APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md', sectionAnchor: '# HOW MUCH TROUBLE ARE YOU AFTER DARK? 😈', convention: 'D', expectedAccess: 'private', expectedMature: true, extraRevealAnchor: '# THE FOUR PRIVATE REVEALS' },
  { quizId: 'love-soulmates-become', docFile: 'APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md', sectionAnchor: '# QUIZ 1: What Do You Become When You Really Like Somebody?', convention: 'B', expectedAccess: 'private', expectedMature: false },
  { quizId: 'shadow-side-hypocrisy', docFile: 'APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md', sectionAnchor: '# QUIZ 2: What Are You Doing That You Swear You Hate?', convention: 'B', expectedAccess: 'private', expectedMature: false },
  { quizId: 'private-private-proof', docFile: 'APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md', sectionAnchor: '# QUIZ 3: Do You Want Sex... or Proof?', convention: 'B', expectedAccess: 'private', expectedMature: true },
  { quizId: 'hidden-you-hide', docFile: 'APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md', sectionAnchor: '# QUIZ 1 | What Do You Hide Even From People Who Know You?', convention: 'B', expectedAccess: 'private', expectedMature: false },
  { quizId: 'life-match-freedom', docFile: 'APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md', sectionAnchor: '# QUIZ 2 | How Much Freedom Do You Really Need?', convention: 'B', expectedAccess: 'private', expectedMature: false },
  { quizId: 'style-vibe-attention', docFile: 'APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md', sectionAnchor: '# QUIZ 3 | What Kind of Attention Do You Attract?', convention: 'B', expectedAccess: 'private', expectedMature: false },
  { quizId: 'good-stuff-trust', docFile: 'APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md', sectionAnchor: '# QUIZ 4 | What Do People Trust You With?', convention: 'B', expectedAccess: 'private', expectedMature: false },
];

if (SOURCES.length !== 17) {
  throw new Error(`SOURCES must cover exactly 17 Private quizzes (got ${SOURCES.length}) -- fix this file's own registry before relying on it.`);
}

// Bounded by the NEXT top-level "# " heading (not "## ") -- the source pack bundles many
// quizzes in one file, each starting with its own "# " heading.
function extractSection(fullDocText: string, startAnchor: string): string {
  const start = fullDocText.indexOf(startAnchor);
  if (start === -1) {
    throw new Error(`Could not find "${startAnchor}" in the doc.`);
  }
  const afterStart = start + startAnchor.length;
  const nextHeadingIndex = fullDocText.slice(afterStart).search(/\n# [^#]/);
  const end = nextHeadingIndex === -1 ? fullDocText.length : afterStart + nextHeadingIndex;
  return fullDocText.slice(start, end);
}

type ParsedChoice = { letter: string; label: string };
type ParsedQuestion = { num: number; prompt: string; choices: ParsedChoice[] };

// Convention C has no markdown heading for questions at all -- each is a standalone
// "**Q1. <prompt>**" bold paragraph, with choices as "- **A [code].** <label> *(trait codes)*"
// bullets directly beneath it, terminated by the next "**Q<N>." paragraph or a "### " section
// heading. Parsed as its own pass, entirely separately from the heading-based conventions.
function parseQuestionsConventionC(sectionText: string): ParsedQuestion[] {
  const headingPattern = /^\*\*Q(\d+)\.\s?(.*?)\*\*$/gm;
  const headingMatches = [...sectionText.matchAll(headingPattern)];
  const results: ParsedQuestion[] = [];
  const choicePattern = /^- \*\*([A-E]) \[[^\]]+\]\.\*\*\s?(.*)$/gm;

  for (let i = 0; i < headingMatches.length; i++) {
    const match = headingMatches[i];
    const num = Number(match[1]);
    const blockStart = match.index! + match[0].length;
    const blockEnd = i + 1 < headingMatches.length ? headingMatches[i + 1].index! : sectionText.length;
    const body = sectionText.slice(blockStart, blockEnd);
    const choiceMatches = [...body.matchAll(choicePattern)];
    const prompt = normalize(stripMd(match[2]));
    // Each choice label runs up to the first " *(" trait-code annotation, e.g.
    // "I say what worries me, once, clearly. After that, they're grown. *(C3+2, ...)*".
    const choices: ParsedChoice[] = choiceMatches.map((cm) => {
      const rawLabel = cm[2].split(/\s\*\(/)[0];
      return { letter: cm[1].toLowerCase(), label: normalize(stripMd(rawLabel)) };
    });
    results.push({ num, prompt, choices });
  }
  return results;
}

function parseQuestions(sectionText: string, convention: Convention): ParsedQuestion[] {
  if (convention === 'C') {
    return parseQuestionsConventionC(sectionText);
  }
  const headingPattern =
    convention === 'A' ? /^### Q(\d+)\.\s?(.*)$/gm
    : convention === 'D' ? /^## QUESTION (\d+) OF \d+\s*$/gm
    : /^### QUESTION (\d+) OF \d+\s*$/gm;
  const headingMatches = [...sectionText.matchAll(headingPattern)];
  const results: ParsedQuestion[] = [];

  for (let i = 0; i < headingMatches.length; i++) {
    const match = headingMatches[i];
    const num = Number(match[1]);
    const blockStart = match.index! + match[0].length;
    const blockEnd = i + 1 < headingMatches.length ? headingMatches[i + 1].index! : sectionText.length;
    const body = sectionText.slice(blockStart, blockEnd);

    const choicePattern = convention === 'A' ? /^- \*\*([A-E]) \[[a-e]\]\.\*\*\s?(.*)$/gm : /^\*\*([A-E])\.\*\*\s?(.*)$/gm;
    const choiceMatches = [...body.matchAll(choicePattern)];

    let prompt: string;
    if (convention === 'A') {
      // Prompt is inline on the heading line itself, plus any continuation lines before the
      // first choice (stripped of markdown, joined with a single space for comparison).
      const openingLine = match[2].trim();
      const preChoice = choiceMatches.length > 0 ? body.slice(0, choiceMatches[0].index!) : body;
      const continuationLines = preChoice.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !/^- \*\*/.test(l));
      prompt = normalize(stripMd([openingLine, ...continuationLines].join(' ')));
    } else {
      // Prompt has NO heading text -- it is the first non-blank bolded line in the body,
      // before the first choice.
      const preChoice = choiceMatches.length > 0 ? body.slice(0, choiceMatches[0].index!) : body;
      const promptLine = preChoice.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
      prompt = normalize(stripMd(promptLine ?? ''));
    }

    const choices: ParsedChoice[] = choiceMatches.map((cm) => ({ letter: cm[1].toLowerCase(), label: normalize(stripMd(cm[2])) }));
    results.push({ num, prompt, choices });
  }
  return results;
}

type ParsedReveal = {
  title: string;
  theVerdict: string[];
  theRead: string[];
  theCallOut: string[];
  theCost: string[];
  tryThis: string[];
  kicker: string;
  signature: string | null;
  traits: string[];
};

// Convention C reveals are a completely different, inline-colon shape: "#### CODE · TITLE"
// (four hashes) followed by "**THE VERDICT:** <text on the same line>" style fields, no
// separate "*Apparently,*" signature (the kicker line already IS the full "Apparently, ..."
// sentence in this source), and no literal "YOUR TRAITS" line at all for this source file --
// confirmed by direct inspection: the three-word trait chips in these quizzes' *.ts files are
// not a verbatim transcription of any single literal string in this document (the closest doc
// text, "### Result spectrum", is prose, not a chip list), so traits are intentionally NOT
// checked for this convention -- a reasoned, narrow exception, not a silent gap.
function parseRevealsConventionC(sectionText: string): ParsedReveal[] {
  const headingPattern = /^#### [^·\n]+· (.+)$/gm;
  const headingMatches = [...sectionText.matchAll(headingPattern)];
  const reveals: ParsedReveal[] = [];

  for (let i = 0; i < headingMatches.length; i++) {
    const match = headingMatches[i];
    const title = normalize(match[1]);
    const blockStart = match.index! + match[0].length;
    const blockEnd = i + 1 < headingMatches.length ? headingMatches[i + 1].index! : sectionText.length;
    const body = sectionText.slice(blockStart, blockEnd);

    const grabInline = (label: string): string[] => {
      const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`);
      const m = re.exec(body);
      return m ? [normalize(stripMd(m[1]))] : [];
    };

    reveals.push({
      title,
      theVerdict: grabInline('THE VERDICT'),
      theRead: grabInline('THE PRIVATE READ'),
      theCallOut: grabInline('THE CALL-OUT'),
      theCost: grabInline('THE COST'),
      tryThis: grabInline('TRY THIS'),
      kicker: grabInline('THE KICKER')[0] ?? '',
      signature: null,
      traits: [],
    });
  }
  return reveals;
}

// Extracts every reveal block (bounded by the given heading pattern) AFTER the questions
// section, parsing its uniform "**LABEL**\n\n<paragraph(s)>" sub-structure -- shared by
// conventions A, B, and D (only the TOP heading shape and the questions/choices above differ).
function parseReveals(fullQuizText: string, questionHeadingPattern: RegExp, revealHeadingPattern: RegExp, extractTitle: (raw: string) => string): ParsedReveal[] {
  const allHeadings = [...fullQuizText.matchAll(revealHeadingPattern)].filter((m) => !questionHeadingPattern.test(m[0]));
  const reveals: ParsedReveal[] = [];

  for (let i = 0; i < allHeadings.length; i++) {
    const match = allHeadings[i];
    const title = extractTitle(match[1]);
    const blockStart = match.index! + match[0].length;
    const blockEnd = i + 1 < allHeadings.length ? allHeadings[i + 1].index! : fullQuizText.length;
    const body = fullQuizText.slice(blockStart, blockEnd);
    // Real reveals always carry "**THE VERDICT**" -- filters out trailing appendix/notes
    // sections (reachability proofs, simulation tables) that also happen to use the same
    // heading level but have none of the reveal sub-structure.
    if (!/\*\*THE VERDICT\*\*/.test(body)) continue;

    const grabParagraphs = (label: string): string[] => {
      const re = new RegExp(`\\*\\*${label}\\*\\*\\s*\\n+([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|\\n\\*Apparently|\\n#{2,3} |$)`);
      const m = re.exec(body);
      if (!m) return [];
      return m[1].split(/\n\s*\n/).map((p) => normalize(stripMd(p))).filter((p) => p.length > 0);
    };

    const signatureMatch = /\n\*(Apparently,[^*]*)\*/.exec(body);
    const traitsInlineMatch = /\*\*YOUR TRAITS[^*:]*:\*\*\s*(.+)/.exec(body);
    const traitsBlockMatch = !traitsInlineMatch ? /\*\*YOUR TRAITS\*\*\s*\n+([^\n]+)/.exec(body) : null;
    const traitsLine = traitsInlineMatch?.[1] ?? traitsBlockMatch?.[1] ?? '';
    const traits = traitsLine.split('·').map((t) => normalize(stripMd(t))).filter((t) => t.length > 0);

    const kickerParas = grabParagraphs('THE KICKER');

    reveals.push({
      title,
      theVerdict: grabParagraphs('THE VERDICT'),
      theRead: grabParagraphs('THE PRIVATE READ'),
      theCallOut: grabParagraphs('THE CALL-OUT'),
      theCost: grabParagraphs('THE COST'),
      tryThis: grabParagraphs('TRY THIS'),
      kicker: kickerParas[0] ?? '',
      signature: signatureMatch ? normalize(stripMd(`*${signatureMatch[1]}*`)) : null,
      traits,
    });
  }
  return reveals;
}

let totalQuestionsChecked = 0;
let totalChoicesChecked = 0;
let totalRevealsChecked = 0;

for (const source of SOURCES) {
  const definition = QUIZ_REGISTRY[source.quizId] as ArchetypeQuizDefinition | undefined;
  if (!definition) {
    fail(`${source.quizId}: not found in QUIZ_REGISTRY`);
    continue;
  }

  // --- Access classification ---
  if (definition.access !== source.expectedAccess) {
    fail(`${source.quizId}: access is "${definition.access}", expected "${source.expectedAccess}"`);
  } else {
    pass(`${source.quizId}: access classification is "${definition.access}" as expected`);
  }
  const isMature = definition.category === 'Private Private. 😈';
  if (isMature !== source.expectedMature) {
    fail(`${source.quizId}: mature (18+) classification is ${isMature}, expected ${source.expectedMature}`);
  } else {
    pass(`${source.quizId}: mature (18+) classification is ${isMature} as expected`);
  }

  const fullDocText: string = readFileSync(join(DOCS_DIR, source.docFile), 'utf8');
  let sectionText = source.sectionAnchor ? extractSection(fullDocText, source.sectionAnchor) : fullDocText;
  if (source.extraRevealAnchor) {
    sectionText += '\n' + extractSection(fullDocText, source.extraRevealAnchor);
  }

  // --- Questions + choices ---
  const approvedQuestions = parseQuestions(sectionText, source.convention);
  if (approvedQuestions.length !== definition.questions.length) {
    fail(`${source.quizId}: parsed ${approvedQuestions.length} approved questions, but production has ${definition.questions.length}`);
  } else {
    pass(`${source.quizId}: ${approvedQuestions.length} questions, matching production count`);
  }

  for (const approved of approvedQuestions) {
    totalQuestionsChecked += 1;
    const liveQuestion = definition.questions[approved.num - 1];
    if (!liveQuestion) {
      fail(`${source.quizId} Q${approved.num}: no corresponding live question at that position`);
      continue;
    }
    const livePrompt = normalize(liveQuestion.prompt);
    if (livePrompt !== approved.prompt) {
      fail(`${source.quizId} Q${approved.num}: prompt mismatch\n    approved: "${approved.prompt}"\n    live:     "${livePrompt}"`);
    } else {
      pass(`${source.quizId} Q${approved.num}: prompt matches the approved document exactly`);
    }

    for (const approvedChoice of approved.choices) {
      totalChoicesChecked += 1;
      const liveChoice = liveQuestion.choices.find((c) => c.id === approvedChoice.letter);
      if (!liveChoice) {
        fail(`${source.quizId} Q${approved.num}${approvedChoice.letter.toUpperCase()}: no corresponding live choice`);
        continue;
      }
      const liveLabel = normalize(liveChoice.label);
      if (liveLabel !== approvedChoice.label) {
        fail(`${source.quizId} Q${approved.num}${approvedChoice.letter.toUpperCase()}: choice label mismatch\n    approved: "${approvedChoice.label}"\n    live:     "${liveLabel}"`);
      } else {
        pass(`${source.quizId} Q${approved.num}${approvedChoice.letter.toUpperCase()}: choice label matches exactly`);
      }
    }
  }

  // --- Reveals ---
  let approvedReveals: ParsedReveal[];
  if (source.convention === 'C') {
    approvedReveals = parseRevealsConventionC(sectionText);
  } else {
    const questionHeadingPattern =
      source.convention === 'A' ? /^### Q\d+\./
      : source.convention === 'D' ? /^## QUESTION \d+ OF \d+/
      : /^### QUESTION \d+ OF \d+/;
    const revealHeadingPattern = source.convention === 'D' ? /^## RESULT \d+: (.+)$/gm : /^### (.+)$/gm;
    const extractTitle = (raw: string) => normalize(raw);
    approvedReveals = parseReveals(sectionText, questionHeadingPattern, revealHeadingPattern, extractTitle);
  }
  if (approvedReveals.length !== definition.archetypes.length) {
    fail(`${source.quizId}: parsed ${approvedReveals.length} approved reveals, but production has ${definition.archetypes.length}`);
  } else {
    pass(`${source.quizId}: ${approvedReveals.length} reveals, matching production count`);
  }

  for (let i = 0; i < approvedReveals.length; i++) {
    totalRevealsChecked += 1;
    const approvedReveal = approvedReveals[i];
    // Match by title substring rather than position -- reveal order in the doc is not
    // guaranteed to match archetypes[] array order, and titles are unique per quiz. Emoji are
    // stripped for matching purposes only -- the approved doc sometimes places a title's emoji
    // at the START ("😇 THE HALO...") while the live title places the SAME emoji at the END
    // ("THE HALO... 😇"), a harmless, approved stylistic placement difference, not a content
    // mismatch -- the emoji's own presence/absence is not re-verified by this title match.
    const stripEmoji = (s: string) => s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
    const approvedTitleNoEmoji = normalize(stripEmoji(approvedReveal.title));
    const liveArchetype = definition.archetypes.find((a) => {
      const liveTitleTail = normalize(stripEmoji(a.title.includes('|') ? a.title.split('|').slice(1).join('|') : a.title));
      const liveTitleFull = normalize(stripEmoji(a.title));
      return liveTitleTail === approvedTitleNoEmoji || liveTitleFull === approvedTitleNoEmoji || approvedTitleNoEmoji.includes(liveTitleTail);
    });
    if (!liveArchetype) {
      fail(`${source.quizId}: no live archetype matches approved reveal title "${approvedReveal.title}"`);
      continue;
    }
    const sr = liveArchetype.structuredRead;
    if (!sr) {
      fail(`${source.quizId} / ${approvedReveal.title}: live archetype has no structuredRead at all`);
      continue;
    }
    const compareArrays = (label: string, approvedArr: string[], liveArr: string[] | undefined) => {
      const live = (liveArr ?? []).map(normalize);
      if (approvedArr.length === 0) return; // nothing parsed for this section (e.g. no THE VERDICT authored) -- not a failure
      if (JSON.stringify(live) !== JSON.stringify(approvedArr)) {
        fail(`${source.quizId} / ${approvedReveal.title} / ${label}: mismatch\n    approved: ${JSON.stringify(approvedArr)}\n    live:     ${JSON.stringify(live)}`);
      } else {
        pass(`${source.quizId} / ${approvedReveal.title} / ${label}: matches exactly`);
      }
    };
    compareArrays('THE VERDICT', approvedReveal.theVerdict, sr.theVerdict);
    compareArrays('THE PRIVATE READ', approvedReveal.theRead, sr.theRead);
    compareArrays('THE CALL-OUT', approvedReveal.theCallOut, sr.theCallOut);
    compareArrays('THE COST', approvedReveal.theCost, sr.theCost);
    compareArrays('TRY THIS', approvedReveal.tryThis, sr.tryThis);

    if (approvedReveal.kicker && normalize(liveArchetype.kicker ?? '') !== approvedReveal.kicker) {
      fail(`${source.quizId} / ${approvedReveal.title} / KICKER: mismatch\n    approved: "${approvedReveal.kicker}"\n    live:     "${normalize(liveArchetype.kicker ?? '')}"`);
    } else if (approvedReveal.kicker) {
      pass(`${source.quizId} / ${approvedReveal.title} / KICKER: matches exactly`);
    }

    if (approvedReveal.signature) {
      const liveSig = normalize(liveArchetype.apparentlySignature ?? '');
      if (liveSig !== approvedReveal.signature.replace(/^\*|\*$/g, '')) {
        fail(`${source.quizId} / ${approvedReveal.title} / SIGNATURE: mismatch\n    approved: "${approvedReveal.signature}"\n    live:     "${liveSig}"`);
      } else {
        pass(`${source.quizId} / ${approvedReveal.title} / SIGNATURE: matches exactly`);
      }
    }

    if (approvedReveal.traits.length > 0) {
      const liveTraits = (liveArchetype.traits ?? []).map(normalize);
      if (JSON.stringify(liveTraits) !== JSON.stringify(approvedReveal.traits)) {
        fail(`${source.quizId} / ${approvedReveal.title} / YOUR TRAITS: mismatch\n    approved: ${JSON.stringify(approvedReveal.traits)}\n    live:     ${JSON.stringify(liveTraits)}`);
      } else {
        pass(`${source.quizId} / ${approvedReveal.title} / YOUR TRAITS: matches exactly`);
      }
    }
  }
}

note(`Checked ${totalQuestionsChecked} questions, ${totalChoicesChecked} choices, ${totalRevealsChecked} reveals across ${SOURCES.length} quizzes.`);
note('Verdict/result weights, Core/Private numeric trait awards, confidence gates, tie-breaking, and result reachability are independently validated by validate-private-quiz-trait-awards.ts, validate-private-quiz-fixtures.ts, and run-configurable-scoring-engine-fuzz-test.ts -- deliberately not duplicated here.');

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED, ${passes} passed.`);
  process.exit(1);
}
console.log(`\nALL ${passes} content-fidelity checks passed.`);
