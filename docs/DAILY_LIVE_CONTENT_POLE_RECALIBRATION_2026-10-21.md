# Daily live content: positive-only pole recalibration, 2026-10-21

Audit and recalibration of the **actual, currently-live** Daily content in production
(`public.daily_questions`/`public.daily_options`), per the owner's 2026-10-21 scoring
correction: *"ALL personality evidence awards positive points to the actual trait demonstrated
by the answer. Do not represent Spontaneous as Planner -2."*

## Method

Pulled the real production content via `supabase db query --linked` (project-admin CLI access,
read-only, no account created) rather than reading any local file — `src/data/daily-questions.ts`
is unrelated local prototype content with different questions entirely and was never the live
source. The live set: **27 canonical Daily questions** (`recurrence_source_id is null`, i.e.
excluding same-content recycled occurrences), of which **15 carry a real signed personality
mapping** (60 options total) and **12 are deliberately ROOM_ONLY** (empty `personality_effects`,
pure engagement content with no personality signal — correctly untouched by this pass).

Every one of the 15 questions' 4 options was re-examined individually against what the answer
*actually demonstrates*, not mechanically repolarized. One genuine correction came out of that
re-examination (flagged below); every other mapping's underlying dimension and magnitude held up
on review and was re-expressed in the canonical positive-only pole system
(`${dimension}:positive` / `${dimension}:negative`, the same 64 ids already defined in
`src/data/personality-v2/pole-ids.ts` and used by the 21 already-calibrated quizzes). A script
cross-checked all 60 re-derivations against their original signed value to confirm every
dimension/magnitude pair survived the conversion exactly except the one documented correction —
see "Verification" below.

**Scoring version**: `v2.0`, matching the quiz-pole-award calibration already shipped for the 21
quizzes — one consistent version tag across all V2 content.

## The one correction (not just a repolarization)

**Question** `55ba84c3-1f1c-45f5-8a4b-5cbd499a642b` ("Your friend gets back with the ex you spent
six months helping them recover from..."), option 3, `"If you're happy, I'm here."`

- Old signed mapping: `protective_hands_off +1` (the Protective pole).
- On re-examination: this answer is the respondent **stepping back** from their own prior
  judgment and **deferring to the friend's choice**, without inserting themselves, warning them,
  or trying to influence the outcome — the textbook definition of this dimension's *other* pole.
- New: `protective_hands_off:negative +1` (Hands-off).

This is exactly the kind of "superficial keyword-based mapping" the owner's instruction asked to
be found and replaced — the original mapping likely reached for "Protective" because the answer
is supportive/caring in tone, without checking it against the dimension's actual behavioral
definition (stepping in/warning/defending vs. letting others handle their own business).

## Full recalibration (15 questions, 60 options)

Every entry below shows the real option wording, the original live signed mapping, the new
positive-only award(s), and the evidence rationale for each.

### [public] Your friend texts: "Pack a bag. I'll explain in the car." What are you doing?
- **"Already packing."** — old: `planner_spontaneous -2; adventure_comfort +2` → new: `planner_spontaneous:negative +2` (Jumps in without needing the plan first — Spontaneous); `adventure_comfort:positive +2` (Goes along with an unknown destination — Adventurous).
- **"I'm in, but where are we going?"** — old: `adventure_comfort +1; curious_decisive +1` → new: `adventure_comfort:positive +1` (Says yes to the unknown — Adventurous); `curious_decisive:positive +1` (Still wants to know where — Curious).
- **"I need the itinerary, address, and expected return time."** — old: `planner_spontaneous +2; control_allowing +2` → new: `planner_spontaneous:positive +2` (Needs the full itinerary before agreeing — Planner); `control_allowing:positive +2` (Wants certainty/control over the outcome before committing — Control).
- **"Absolutely not. Explain first."** — old: `adventure_comfort -2; control_allowing +1` → new: `adventure_comfort:negative +2` (Refuses the unknown outright — Comfort-seeking); `control_allowing:positive +1` (Needs the explanation before acting — Control).

### [private] Your partner's family keeps making jokes at your expense, and your partner laughs along. What bothers you MOST?
- **"Honestly, I might joke back harder."** — old: `playful_serious +1; conflict_peacekeeping +1` → new: `playful_serious:positive +1` (Meets it with humor rather than hurt — Playful); `conflict_peacekeeping:positive +1` (Engages the moment head-on via banter rather than letting it slide — Conflict-forward).
- **"That my partner didn't shut it down."** — old: `protective_hands_off +1; direct_indirect +1` → new: `protective_hands_off:positive +1` (Expects a loved one to defend them, reflecting the respondent's own protective frame — Protective); `direct_indirect:positive +1` (Wants it addressed, not glossed over — Direct).
- **"The jokes themselves."** — old: `sentimental_thick_skinned +1; social_attunement +1` → new: `sentimental_thick_skinned:positive +1` (The words themselves land and matter — Sentimental); `social_attunement:positive +1` (Tuned into the emotional tone of the moment — Vibe checker).
- **"That y'all have now put ME in the position of having to address it."** — old: `direct_indirect +2; control_allowing +1` → new: `direct_indirect:positive +2` (Will be the one to actually address it — Direct); `control_allowing:positive +1` (Feels responsibility for resolving the situation fall to them — Control).

### [public] Someone parks across two spaces in a packed parking lot. Your immediate thought?
- **"I need to see what kind of car this is before I complete my investigation. 😂"** — old: `curious_decisive +1; playful_serious +1` → new: `curious_decisive:positive +1` (Wants to investigate before judging — Curious); `playful_serious:positive +1` (Treats it as a bit, not a real grievance — Playful).
- **"Maybe there's a reason I can't see."** — old: `trust_verify +1; forgiving_receipts +1` → new: `trust_verify:positive +1` (Assumes a reasonable explanation exists — Trust first); `forgiving_receipts:positive +1` (Doesn't hold it against the driver — Forgiving).
- **"Some people really do move through life like nobody else exists."** — old: `social_attunement +1; rules_bending +1` → new: `social_attunement:positive +1` (Notices the broader pattern of inconsiderate behavior — Vibe checker); `rules_bending:positive +1` (Believes shared-space norms should be respected — Rule-oriented).
- **"Extremely annoying. I'm judging, but I'm moving on."** — old: `forgiving_receipts +1; emotional_intensity -1` → new: `forgiving_receipts:positive +1` (Judges, then lets it go — Forgiving); `emotional_intensity:negative +1` (Stays measured despite the annoyance — Even-Keeled).

### [public] Someone is aggressively tailgating you, and you're already over the speed limit. What happens?
- **"I stay exactly where I am. They can wait."** — old: `control_allowing +1; conflict_peacekeeping +1` → new: `control_allowing:positive +1` (Holds their line rather than yielding to pressure — Control); `conflict_peacekeeping:positive +1` (Lets the tension stand rather than smoothing it over — Conflict-forward).
- **"I move over and let them go be somebody else's problem."** — old: `conflict_peacekeeping -2` → new: `conflict_peacekeeping:negative +2` (Defuses by removing themselves from the friction — Peacekeeping).
- **"I slow down a little. Since we're apparently spending time together."** — old: `playful_serious +1; forgiving_receipts -1` → new: `playful_serious:positive +1` (Turns the friction into a small joke — Playful); `forgiving_receipts:negative +1` (The slowdown is a pointed little payback — Holds the Receipt).
- **"I keep driving normally. A stranger is not controlling my mood OR my speed."** — old: `emotional_intensity -2; control_allowing -1` → new: `emotional_intensity:negative +2` (Doesn't let a stranger's behavior move them — Even-Keeled); `control_allowing:negative +1` (Isn't trying to assert control over the other driver, just staying steady — Let it play out).

### [private] Your friend gets back with the ex you spent six months helping them recover from. What do you say?
- **"Nothing at first. They already know how I feel."** — old: `conflict_peacekeeping -1; patient_urgent +1` → new: `conflict_peacekeeping:negative +1` (Chooses not to raise it unprompted — Peacekeeping); `patient_urgent:positive +1` (Lets it sit rather than acting immediately — Patient).
- **"Respectfully, please return the emotional labor I invested." 😂** — old: `playful_serious +1; forgiving_receipts -1` → new: `playful_serious:positive +1` (Delivers the point through a joke — Playful); `forgiving_receipts:negative +1` (References the past investment pointedly — Holds the Receipt).
- **"If you're happy, I'm here."** — old: `forgiving_receipts +1; protective_hands_off +1` → new: `forgiving_receipts:positive +1` (Lets go of their own prior judgment to support the friend — Forgiving); `protective_hands_off:negative +1` — **CORRECTED**, see above (Hands-off, not Protective).
- **"I love you. I am also not pretending I think this is a good idea."** — old: `direct_indirect +2; protective_hands_off +1` → new: `direct_indirect:positive +2` (States the honest reaction plainly — Direct); `protective_hands_off:positive +1` (Voices the concern because they care about the friend's wellbeing — Protective).

### [public] Someone apologizes only after they realize you're actually done with them. Now what?
- **"I accept it. People mess up."** — old: `forgiving_receipts +2; trust_verify +1` → new: `forgiving_receipts:positive +2` (Accepts the apology at face value — Forgiving); `trust_verify:positive +1` (Gives the benefit of the doubt going forward — Trust first).
- **"I forgive them, but things are different now."** — old: `forgiving_receipts +1; trust_verify -1` → new: `forgiving_receipts:positive +1` (Accepts the apology, at least partially — Forgiving); `trust_verify:negative +1` (Stays guarded about the relationship going forward — Verify first).
- **"I need changed behavior, not an apology."** — old: `trust_verify -2; practical_idealistic +1` → new: `trust_verify:negative +2` (Wants proof of real change, not just words — Verify first); `practical_idealistic:positive +1` (Judges by outcomes/behavior, not sentiment — Practical).
- **"Too late. You should've cared before I was done."** — old: `forgiving_receipts -2; curious_decisive -1` → new: `forgiving_receipts:negative +2` (Holds the line on an already-made decision — Holds the Receipt); `curious_decisive:negative +1` (The decision is already final — Decisive).

### [public] Someone you just met asks how much money you make. What are you telling them?
- **"The exact number. I don't care."** — old: `private_open -2; direct_indirect +1` → new: `private_open:negative +2` (Shares the exact number without hesitation — Open); `direct_indirect:positive +1` (States it plainly — Direct).
- **"A general range."** — old: `private_open -1; practical_idealistic +1` → new: `private_open:negative +1` (Shares something, just not the exact figure — Open); `practical_idealistic:positive +1` (Gives a workable, real answer — Practical).
- **"I'm joking my way out of that question."** — old: `playful_serious +2; direct_indirect -1` → new: `playful_serious:positive +2` (Deflects the question with humor — Playful); `direct_indirect:negative +1` (Avoids answering directly — Indirect).
- **"Absolutely nothing. Why do you need to know?"** — old: `private_open +2; trust_verify -1` → new: `private_open:positive +2` (Declines to share anything at all — Private); `trust_verify:negative +1` (Questions the asker's motive — Verify first).

### [private] A close friend asks you to lie for them because they don't want to deal with somebody's reaction. What are you doing?
- **"Depends what the lie protects and who it hurts."** — old: `curious_decisive +1; practical_idealistic +1` → new: `curious_decisive:positive +1` (Wants the specifics before deciding — Curious); `practical_idealistic:positive +1` (Judges case-by-case rather than on principle alone — Practical).
- **"Absolutely not. Handle your own situation."** — old: `rules_bending +2; direct_indirect +1` → new: `rules_bending:positive +2` (Holds the line against lying regardless of the ask — Rule-oriented); `direct_indirect:positive +1` (Refuses plainly — Direct).
- **"I'll cover something small. Friends help friends."** — old: `protective_hands_off +1; rules_bending -1` → new: `protective_hands_off:positive +1` (Steps in to help the friend — Protective); `rules_bending:negative +1` (Is willing to bend the rule a little for a friend — Rule-bending).
- **"I won't lie, but I also don't have to expose them."** — old: `conflict_peacekeeping -1; protective_hands_off +1; practical_idealistic +1` → new: `conflict_peacekeeping:negative +1` (Avoids the confrontation of exposing the friend — Peacekeeping); `protective_hands_off:positive +1` (Still protects the friend's position — Protective); `practical_idealistic:positive +1` (Finds the workable middle path — Practical).

### [public] You find $200 cash on the floor in a store. No wallet. No name. What are you doing?
- **"Wait around a little and see if someone comes back looking panicked."** — old: `patient_urgent +1` → new: `patient_urgent:positive +1` (Willing to wait and see rather than act immediately — Patient).
- **"Turn it in. If it's theirs, hopefully they come looking for it."** — old: `rules_bending +2` → new: `rules_bending:positive +2` (Turns it in on principle — Rule-oriented).
- **"Ask customer service if anyone reported missing money before I hand anything over."** — old: `trust_verify -2; practical_idealistic +1` → new: `trust_verify:negative +2` (Wants confirmation before acting — Verify first); `practical_idealistic:positive +1` (Takes the workable, careful route — Practical).
- **"I'm not proud of how quickly 'finders keepers' entered the conversation." 😂** — old: `rules_bending -2; planner_spontaneous -1` → new: `rules_bending:negative +2` (Leans toward keeping it — Rule-bending); `planner_spontaneous:negative +1` (The reaction is impulsive, not reasoned — Spontaneous).

### [public] You accidentally send the screenshot to the person you were screenshotting. What's your next move?
- **"Own it immediately. 'Well... since we're here.'"** — old: `direct_indirect +2; conflict_peacekeeping +2` → new: `direct_indirect:positive +2` (Owns it immediately and head-on — Direct); `conflict_peacekeeping:positive +2` (Faces the awkwardness instead of avoiding it — Conflict-forward).
- **"Unsend it and pray they didn't see it."** — old: `private_open +2; conflict_peacekeeping -1` → new: `private_open:positive +2` (Tries to erase/contain the exposure — Private); `conflict_peacekeeping:negative +1` (Avoids the confrontation entirely — Peacekeeping).
- **"Send 'OMG WRONG PERSON' and disappear for a while."** — old: `direct_indirect -2; playful_serious -1` → new: `direct_indirect:negative +2` (Deflects with a cover story — Indirect); `playful_serious:negative +1` (Treats the fallout as something serious enough to disappear over — Serious).
- **"Double down. 'And I meant every word.'"** — old: `direct_indirect +2; forgiving_receipts -1` → new: `direct_indirect:positive +2` (Stands by what was said — Direct); `forgiving_receipts:negative +1` (The words being doubled down on were already a grievance being voiced — Holds the Receipt).

### [private] Your partner says, "I don't want you going through my phone." What's your reaction?
- **"Why did you feel the need to say that?"** — old: `curious_decisive +1; trust_verify -1` → new: `curious_decisive:positive +1` (Wants to understand the motive behind the statement — Curious); `trust_verify:negative +1` (The question itself comes from suspicion — Verify first).
- **"Fair. Privacy still exists in relationships."** — old: `trust_verify +1; independent_collaborative +1` → new: `trust_verify:positive +1` (Accepts the boundary without needing proof — Trust first); `independent_collaborative:positive +1` (Respects the partner's separate, individual space — Independent).
- **"If I suddenly can't touch your phone, now I definitely have questions."** — old: `trust_verify -2; social_attunement +1` → new: `trust_verify:negative +2` (A changed boundary immediately reads as suspicious — Verify first); `social_attunement:positive +1` (Picks up on the shift in dynamic — Vibe checker).
- **"Fine, but secrecy and privacy are not the same thing."** — old: `direct_indirect +1; trust_verify -1` → new: `direct_indirect:positive +1` (States the distinction plainly — Direct); `trust_verify:negative +1` (An undercurrent of wariness remains — Verify first).

### [private] Your partner's ex asks them to hold some money for them. What are you saying?
- **"Why are they comfortable asking you for that?"** — old: `trust_verify -2; protective_hands_off +1` → new: `trust_verify:negative +2` (The question itself comes from suspicion — Verify first); `protective_hands_off:positive +1` (Questioning the arrangement to protect the relationship — Protective).
- **"Actually, my hands hold money better. Send it over." 😂** — old: `playful_serious +2; protective_hands_off +1; direct_indirect +1` → new: `playful_serious:positive +2` (Diffuses the tension with a joke — Playful); `protective_hands_off:positive +1` (Inserts themselves to manage the situation — Protective); `direct_indirect:positive +1` (Says it plainly, even as a joke — Direct).
- **"I don't care. If it's innocent, it's innocent."** — old: `trust_verify +2; protective_hands_off -1` → new: `trust_verify:positive +2` (Takes it at face value without suspicion — Trust first); `protective_hands_off:negative +1` (Stays out of the partner's business — Hands-off).
- **"Do they need the number to the nearest bank?"** — old: `direct_indirect +2; protective_hands_off +1` → new: `direct_indirect:positive +2` (Says the sharp thing plainly — Direct); `protective_hands_off:positive +1` (Still protecting the relationship by raising it — Protective).

### [public] An unknown number calls you twice in a row. What are you doing?
- **"Answering. Twice means it might matter."** — old: `patient_urgent -2; trust_verify +1` → new: `patient_urgent:negative +2` (Acts right away because it might matter — Urgent); `trust_verify:positive +1` (Gives the caller the benefit of the doubt — Trust first).
- **"Letting it ring, then Googling the number."** — old: `trust_verify -2; curious_decisive +1` → new: `trust_verify:negative +2` (Won't engage without confirming who it is first — Verify first); `curious_decisive:positive +1` (Wants to find out more before deciding — Curious).
- **"Texting, 'Who is this?'"** — old: `direct_indirect +2; control_allowing +1` → new: `direct_indirect:positive +2` (Asks plainly who it is — Direct); `control_allowing:positive +1` (Takes charge of resolving the uncertainty — Control).
- **"Blocking it. If it's important, they'll figure it out."** — old: `curious_decisive -2` → new: `curious_decisive:negative +2` (Moves on without needing to know — Decisive).

### [public] Your friend has been acting weird with you all day. What are you doing?
- **"Asking them directly what's wrong."** — old: `direct_indirect +2; conflict_peacekeeping +2` → new: `direct_indirect:positive +2` (Addresses it head-on — Direct); `conflict_peacekeeping:positive +2` (Raises the tension rather than letting it sit — Conflict-forward).
- **"Giving them space. They'll tell me when they're ready."** — old: `conflict_peacekeeping -1; patient_urgent +1` → new: `conflict_peacekeeping:negative +1` (Chooses not to force the issue — Peacekeeping); `patient_urgent:positive +1` (Waits for the friend to be ready — Patient).
- **"Acting normal, but I'm definitely watching."** — old: `social_attunement +2; trust_verify -1` → new: `social_attunement:positive +2` (Notices and tracks the shift closely — Vibe checker); `trust_verify:negative +1` (Stays guarded rather than assuming it's nothing — Verify first).
- **"Oh, we're being weird? I can be weird too."** — old: `forgiving_receipts -2; playful_serious +1` → new: `forgiving_receipts:negative +2` (Matches the energy instead of letting it go — Holds the Receipt); `playful_serious:positive +1` (Responds with a playful tone — Playful).

### [public] Everyone in the group keeps saying "I don't care" when it's time to pick where to eat. What are you doing?
- **"Picking a place and sending the address."** — old: `control_allowing +2; curious_decisive -2` → new: `control_allowing:positive +2` (Takes charge and decides for the group — Control); `curious_decisive:negative +2` (Makes the call rather than exploring more options — Decisive).
- **"Sending a poll. Majority rules."** — old: `independent_collaborative -2; control_allowing +1` → new: `independent_collaborative:negative +2` (Brings the group into the decision — Collaborative); `control_allowing:positive +1` (Still organizes/drives the process — Control).
- **"Waiting. Somebody will eventually choose."** — old: `control_allowing -2; patient_urgent +1` → new: `control_allowing:negative +2` (Lets the outcome happen without pushing it — Let it play out); `patient_urgent:positive +1` (Comfortable waiting it out — Patient).
- **"I'm eating at ___ at 7. Come if you want."** — old: `independent_collaborative +2; direct_indirect +1` → new: `independent_collaborative:positive +2` (Makes an independent plan and lets others opt in — Independent); `direct_indirect:positive +1` (States the plan plainly — Direct).

## Verification

A script cross-checked all 60 re-derived awards against the original 60 live signed rows: every
`{dimension, value}` pair maps to `{dimension}:{positive if value>0 else negative}` with
`points = abs(value)` **except** the single documented correction above. Zero accidental
transcription drift; the one deviation is deliberate and explained.

## What this does NOT do

Does not touch the live, signed `personality_effects` column on any of these rows — V1
(`personality_evidence`, `scorePersonalityProfile`) is completely unaffected and keeps working
exactly as today for every existing user. See the staged migration
`supabase/migrations/20261021160000_daily_live_content_pole_awards.sql` for the actual
`pole_personality_effects` UPDATE statements (additive, same rows, new column only) — **not
applied**, requires owner authorization, and itself depends on
`20261018010000_personality_scoring_v2_schema.sql` (the column-adding schema migration) being
applied first.

Does not recalibrate the 12 ROOM_ONLY questions — they carry no personality mapping by design
(admin-enforced: `admin_approve_daily` requires an empty `personality_effects` array in
ROOM_ONLY mode) and nothing here changes that.

Does not recalibrate `docs/DAILY_ONE_PASS_FULL_WORKBOOK_2026-10-20.md`'s 428 draft, not-yet-
approved answer options — that is separate, lower-stakes work since none of it is live or
owner-approved yet; see `docs/BUILD21_SCORING_STANDARD_AND_MIGRATION_PLAN_2026-10-21.md` for how
that workbook's notation was converted (mechanically, preserving the original hand-reasoning,
not re-litigated with this same per-answer rigor).
