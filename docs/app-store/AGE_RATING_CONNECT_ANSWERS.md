# Apparently You | App Store Connect Age Rating questionnaire — recommended answers

Prepared 2026-10-21. Evidence-based guidance for Apple's live Age Rating questionnaire in App
Store Connect -- NOT itself a completed/certified submission (no ASC access exists in this
environment). Apple's current category list, frequency options, and resulting rating tiers
were confirmed directly from Apple's own App Store Connect reference documentation before
writing this, not recalled from memory. Every content answer below is based on an actual
`grep`/read of the real quiz corpus (`src/data/quizzes/`, `src/data/daily-questions.ts`), not
assumed from category labels or marketing copy.

## Violence — None
No violence content anywhere in the app. Apparently You is a personality-quiz/collectible-
Creature app; no combat, weapons, or injury themes exist in any reviewed quiz or Daily
content.
- Cartoon or Fantasy Violence: None.
- Realistic Violence: None.
- Prolonged Graphic or Sadistic Realistic Violence: None.
- Guns or Other Weapons: None.

## Sexuality or Nudity
- **Mature or Suggestive Themes: Infrequent/Mild** (current live content), with an explicit
  flag to re-review before expanding (see below). The one LIVE "Private Private. 😈" quiz
  (`private-private-trouble.ts`, read in full) is flirtation/attraction/desire-themed humor --
  implies and references mature topics (chemistry, wanting someone, flirting, restraint vs.
  impulsiveness) without depicting or describing actual sexual acts, and contains no nudity.
  This content sits behind BOTH the Apparently Private paywall AND a separate 18+
  age-eligibility confirmation (`age-eligibility.ts`/the quiz-level age gate in
  `src/app/quiz/[quizId].tsx`) -- it is not visible to a free or under-18 user at all.
- **Sexual Content or Nudity: None currently live.** No quiz or Daily content anywhere
  describes sexual acts or depicts nudity (confirmed by reading the full text of every Private
  Private quiz that has real implemented content -- only one does, see below).
- **Graphic Sexual Content and Nudity: None.**
- **IMPORTANT, do not silently resolve this yourself:** `src/data/quizzes/private-catalog.ts`
  lists FOUR "Private Private. 😈" quiz titles, but only ONE
  (`private-private-trouble`, "How much trouble are you after dark?") has any real
  implemented question/result content anywhere in this repository (confirmed: `grep -rln` for
  the other three IDs across all of `src` returns zero matches outside the catalog file
  itself). The other three titles -- "So... are you actually good in bed?", "What do you
  actually want when the door closes?", and "Do you want sex... or proof?" -- are catalog
  placeholders only; the catalog file's own comment literally calls this "the future
  sex/intimacy category." **This age-rating recommendation reflects ONLY what is actually
  live today.** Once any of those three are implemented with real content, this questionnaire
  MUST be re-reviewed before that build ships -- their titles suggest content that could
  reasonably land in "Sexual Content or Nudity" (Infrequent or Frequent) rather than just
  "Mature or Suggestive Themes," which could raise the resulting age rating from today's
  likely 9+/13+ range toward 17+/18+. Do not assume today's answer stays valid after that
  content is written.

## Mature Themes
- **Profanity or Crude Humor: Infrequent/Mild.** A `grep` across the full quiz corpus and
  Daily questions for common profanity found only mild language ("damn," "hell" -- e.g. "mad
  as hell," "pretty damn good," "losing your damn mind") in a handful of quizzes
  (`friend-adaptations.ts`, `life-match-dream-life.ts`, `private-private-trouble.ts`). No
  stronger profanity (the common words Apple's own examples reference) appears anywhere in
  the corpus searched.
- **Horror/Fear Themes: None.** No horror, fear, or scare content found in any reviewed quiz.
- **Alcohol, Tobacco, or Drug Use or References: None.** A targeted search for alcohol/
  drinking/tobacco/drug references across the full quiz corpus and Daily questions returned
  zero matches.

## Medical or Wellness — None
No medical, treatment, or health/wellness content. The app's own Terms of Use already states
results are "not medical, psychological, employment, legal or financial assessments" -- this
is a real, enforced product boundary, not just a disclaimer; no quiz frames itself as health
guidance.

## Chance-Based Activities — None
No gambling, simulated gambling, loot boxes, or paid contests anywhere in the app (confirmed
by search; also structurally true -- the only purchase flow is the fixed-price Apparently
Private subscription via RevenueCat/StoreKit, never a randomized/chance-based mechanic).

## In-App Controls & Capabilities
- **Unrestricted Web Access: No.** No `WebView`/`react-native-webview` dependency or usage
  exists anywhere in this app (confirmed via `grep` of `package.json` and `src`) -- all legal/
  support content renders as real in-app screens (`privacy-policy.tsx`, `terms-of-use.tsx`,
  `support.tsx`), never an embedded browser to arbitrary external sites.
- **Messaging and Chat: No.** No messaging/chat feature exists.
- **Social Media: No.** No social feed, follow/friend graph, or public posting -- the only
  sharing mechanism is a one-off, opt-in share LINK for a single comparison result
  (`src/app/s/[token].tsx`), not an ongoing social surface.
- **Advertising: No.** No advertising SDK exists anywhere (confirmed in
  `APP_PRIVACY_CONNECT_ANSWERS.md`'s own `package.json` audit).
- **User-Generated Content: Owner judgment call, leaning No.** Users answer quizzes (closed-
  choice, not freeform) and may enter a free-text first name or custom-gender string, neither
  of which is shown to other users. The only content ever exposed to someone besides the
  author is a STRUCTURED comparison/quiz result via an explicit share link -- not open-ended
  user-authored text or media visible to other app users. This reads as closer to "No" than
  "Yes" under Apple's typical UGC framing (which centers on content other users can see/
  interact with, like posts/comments/media), but flagged explicitly rather than silently
  assumed, since Apple's own guidance in this area evolves.

## Recommended overall rating
Based on the above, current live content most likely maps to **9+ or 12+/13+** (driven by the
Infrequent/Mild Mature or Suggestive Themes and Infrequent/Mild Profanity or Crude Humor
answers) rather than anything higher -- but **this is Apple's own live questionnaire's
determination to make, not this document's**; enter the per-category answers above into the
actual ASC questionnaire and let Apple's own logic compute the resulting tier rather than
entering a tier directly.

**This recommendation is contingent on the app's own 18+ age-eligibility gate actually working
as implemented** (restricting "Private Private. 😈" content to users who confirm 18+,
independent of the unrelated 13-17 demographic field -- see `age-eligibility.ts`). That gating
logic was verified by code read in earlier sessions; a full end-to-end on-device retest of the
gate was not repeated in this pass specifically, so re-confirm it on the build actually
submitted before relying on this rating recommendation.

**Specific finding this pass, worth flagging:** the gate in
`src/app/quiz/[quizId].tsx` checks `definition.id === 'private-private-trouble'` by exact ID,
not `definition.category === 'Private Private. 😈'` generically. That's correct and complete
TODAY (only one quiz with that category exists), but it means if/when the three unimplemented
Private Private quizzes described above are built, whoever implements them must also remember
to add their IDs to this same gate (or the gate should be generalized to check `category`
instead) -- otherwise new 18+ content could ship ungated. Not a defect in the current build;
a real risk for the next person to touch this code, so recorded here rather than left to be
rediscovered.

## What this document does NOT do
Enter or certify anything in live App Store Connect (no ASC access exists in this
environment). It is evidence to enter those answers FROM, scoped strictly to content that is
actually live in this repository today. Final sign-off, and any future re-review once the
three unimplemented Private Private quizzes are written, remains the owner's responsibility.
