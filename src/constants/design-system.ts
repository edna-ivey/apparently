// Apparently You's Build 8 consumer visual language -- warm, editorial, collectible-feeling,
// deliberately NOT childish/fantasy-heavy/corporate/wellness-app/generic-quiz-app. Built
// entirely on the EXISTING brand palette and font infrastructure (Brand/Spacing/Fonts in
// ./theme.ts) -- this file adds shared shape/elevation/typography PRIMITIVES on top of those,
// it never redefines or replaces them. No new fonts/assets are introduced here; Fonts.serif
// (Georgia/Times New Roman/ui-serif -- see global.css and Platform.select in theme.ts) is the
// "elegant serif/display treatment for major identity moments" the direction calls for, and
// Fonts.sans covers everything else. Applied first to You + Settings + the Private subscriber
// state this pass; later Build 8 passes extend it to Today, Explore, Compare, quiz results,
// and the paywall without re-deriving these values.

import { Brand, Fonts, Spacing } from './theme';

// ---------------------------------------------------------------------------------------
// Surfaces -- warm cream page grounds and soft blush accents, reusing the exact tones
// already established elsewhere in the app (Colors.light.background/backgroundSelected in
// theme.ts, and the pastel card backgrounds already used on You) rather than inventing new
// ones, so this reads as a refinement of the existing brand rather than a different app.
// ---------------------------------------------------------------------------------------

export const Surface = {
  // The warm cream page ground.
  page: '#FFF9F5',
  // A touch deeper than `page` -- used the same way You's outer container already does, so a
  // wide/web viewport reads the content column as a deliberate object sitting on a page.
  pageDeep: '#F0E8DD',
  // Elevated card surface -- plain white, the neutral base every pastel/tinted card variant
  // below sits alongside.
  card: '#FFFFFF',
  // Soft blush -- the palette's pink pastel, already used for You's progress card and the
  // web tab bar's active state.
  blush: '#FFE5EF',
  // Soft violet-tinted card wash, already used for the Recent Read card.
  lavender: '#F7F3FF',
  // Soft gold-tinted wash, for warmth/highlight moments that shouldn't read as urgent (coral)
  // or as a link/action (violet).
  sand: '#FFF3DD',
  // Soft mint-tinted wash, for a calmer/settled moment (e.g. a confirmed/settled state) among
  // the pastel card family.
  seafoam: '#E3F5EF',
  // A quiet hairline border for a white/pastel card sitting on the cream page -- exactly the
  // tone already used ad hoc across You/paywall/private ("#F0E6E8"), named here so it's one
  // shared value instead of a repeated magic string.
  hairline: '#F0E6E8',
} as const;

// ---------------------------------------------------------------------------------------
// Radii -- one shared scale. "Rounded elevated cards" is a direction requirement; a single
// named scale keeps every screen's cards/pills consistent instead of each screen picking its
// own number.
// ---------------------------------------------------------------------------------------

export const Radius = {
  sm: 14,
  md: 18,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

// ---------------------------------------------------------------------------------------
// Elevation -- soft shadows only (never a hard/corporate drop shadow). React Native Web
// understands the CSS `boxShadow` shorthand directly (already used this way on You/the web
// tab bar); native RN maps the same values onto shadowColor/shadowOffset/shadowOpacity/
// shadowRadius/elevation so one definition works on both without a Platform.select per card.
// ---------------------------------------------------------------------------------------

export const Elevation = {
  soft: {
    boxShadow: '0 8px 20px rgba(23, 21, 29, 0.10)',
    shadowColor: '#17151D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
  },
  lifted: {
    boxShadow: '0 16px 40px rgba(23, 21, 29, 0.14)',
    shadowColor: '#17151D',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 6,
  },
} as const;

// ---------------------------------------------------------------------------------------
// Card primitive -- the base "rounded elevated card, subtle border, soft shadow, generous
// spacing" look the direction describes, as one spreadable style object. Screens still own
// their own StyleSheet (matching this codebase's existing per-screen-styles convention) but
// spread `CardStyle.base`/`CardStyle.tinted(color)` into their card style instead of
// re-declaring radius/border/shadow by hand each time.
// ---------------------------------------------------------------------------------------

export const CardStyle = {
  base: {
    backgroundColor: Surface.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Surface.hairline,
    padding: Spacing.four,
    ...Elevation.soft,
  },
  tinted: (backgroundColor: string, borderColor?: string) => ({
    backgroundColor,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: borderColor ?? 'transparent',
    padding: Spacing.four,
  }),
} as const;

// ---------------------------------------------------------------------------------------
// Typography -- clean sans for everyday UI, elegant serif reserved for "major identity
// moments" (a hero name, a character name, a result title) per the direction. Deliberately
// sparing: most text stays sans -- serif is a deliberate accent, not the default voice.
// ---------------------------------------------------------------------------------------

export const Type = {
  // Small tracked-out uppercase label above a card/section -- the app's existing "eyebrow"
  // convention, named here so new screens reuse the same values instead of re-guessing them.
  eyebrow: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.3,
    color: Brand.pink,
  },
  // A major identity moment -- a hero display name, a character name, a result headline.
  // Serif is the deliberate accent color of this design language, used sparingly by design.
  display: {
    fontFamily: Fonts?.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
    color: Brand.ink,
  },
  displaySmall: {
    fontFamily: Fonts?.serif,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700' as const,
    color: Brand.ink,
  },
  heading: {
    fontFamily: Fonts?.sans,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800' as const,
    color: Brand.ink,
  },
  body: {
    fontFamily: Fonts?.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    color: Brand.inkSecondary,
  },
  caption: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    color: Brand.inkSecondary,
  },
} as const;

// Pastel accent rotation, drawn only from the preserved core brand palette -- used anywhere a
// small set of cards/tags need a distinguishable-but-still-cohesive tint (already the pattern
// You's pattern cards use; named here so it's shared, not re-typed as a literal array on every
// screen that wants it).
export const PastelAccentRotation = [Surface.blush, Surface.seafoam, Surface.sand, '#E8F1FF', '#FDE9D2'] as const;
