# APPARENTLY PRIVATE: OWNER-APPROVED SOURCE PACK

# Apparently Private: Owner-approved implementation source manifest

**Editorial approval record (user-confirmed, November 1, 2026): All eleven changes listed in this packet are approved, including `good-stuff-trust`, the final After Dark replacement, all three free previews, and all seven new premium quizzes. Their copy, answers, mappings, result reads, gates, and ties are locked as editorial source.**

**Scope of authorization:** Local implementation, local tests, canonical editorial documentation, and preparation of staging migration scripts only. No commit, push, production database changes, backfill, TestFlight upload, or App Store release is authorized by this packet. All editorial approvals were granted in conversation after the original draft documents were written. This consolidated copy has harmonized the approval-status metadata; it has not revised quiz questions, options, results, or trait mappings.

## What to implement (11 approved quiz changes)

1. Free previews: `keep-you-around` (revise), `be-so-serious` (revise), `secretly-love` (revive as active free preview, preserving historical records). Source: 01.
2. Premium mature: `private-private-trouble` (replace using the final owner-approved After Dark text). Source: 02. Retain 18+ and subscription gates.
3. New premium: `love-soulmates-become`, `shadow-side-hypocrisy`, `private-private-proof` (18+). Source: 03.
4. New premium: `hidden-you-hide`, `life-match-freedom`, `style-vibe-attention`, `good-stuff-trust`. Source: 04.

Six other premium Private quizzes were already editorially locked and reportedly implemented locally: `love-soulmates-ready`, `career-ambition-how-bad`, `career-ambition-proving`, `hidden-you-wrong`, `life-match-dream-life`, `style-vibe-intimidating`. **Do not rewrite or replace them**; test for regressions only.

Expected owner-approved target after all local implementations: **17 playable Apparently Private quizzes, 3 free previews and 14 premium**. This includes 7 existing premium (the six above plus After Dark) and 7 new premium (the two batches).

## Nonnegotiable implementation conditions

- Read the repo Product/Creative Bible v1.4, canonical trait catalog, dimension-ID ledger, approved source docs, and current implementation before modifying code.
- Approved questions, choices, results, verdict weights, mappings, hard gates, tie rules, and signatures are immutable. If a code/SQL limitation or a true source contradiction makes an approved rule impossible, isolate and report that exact problem instead of silently changing content.
- No arbitrary count cap on distinct trait awards per choice. A genuinely strong signal may award +3 to a pole, and +1/+2 are also valid. Do not assign a trait merely to fill a blank; some answers rightly award no Core or no Private evidence. Do not award opposing poles of one dimension on a single answer.
- No predictable answer letters, cookie-cutter content, result-derived permanent evidence, generic flattering rewrites, or changing already-approved quizzes.
- New quizzes' two harsh outcomes must obey the exact confidence gates and remain reachable. Verify the entire result spectrum and mixed response patterns against both server and client scorers.
- Mature `private-private-trouble` AND `private-private-proof` must have server-enforced adult eligibility and premium entitlement; prevent bypass through deep links, direct RPCs, and anonymous result sharing. Mature quiz results should not become publicly shareable without a separately approved access model.
- Semantic content changes to existing quizzes must preserve historical results and answer meanings, with correct content-version identity; never simply reset fingerprints without a migration/lineage strategy. Retakes must not inflate trait evidence.
- Owner authorizes **local implementation, tests, documents, and staged migration files only**. No production migration application, data backfill against live users, push/commit, TestFlight upload, or App Store submission without separate explicit permission.

## Source and precedence

Current owner's explicit approval + current Product Bible architecture + these exact source documents govern. Earlier unapproved Batch 2 draft and earlier/archived After Dark revisions must never be used. The owner's explicit clarification allows raw numeric evidence +3 for strong signals; the earlier assistant's statement that +3 was forbidden was a mistake. Preserve all existing approved quiz content.

---

# SOURCE FILE: 01_THREE_FREE_PREVIEWS_OWNER_APPROVED.md

**Source description:** Free previews: keep-you-around, be-so-serious, secretly-love

**Current editorial status: OWNER-APPROVED AND LOCKED (November 1, 2026). Implementation and production rollout are separate actions.**

# apparently you.
## THREE PRIVATE QUIZZES | CREATIVE REVIEW PACK
**OWNER-APPROVED CONTENT · November 1, 2026 · Implementation/deployment not yet verified**

**Scope:** Revise the two existing free Private previews and revive the historical third preview as a distinct, playable quiz. Existing source files consulted on the authorized local repository: `keep-you-around.ts`, `be-so-serious.ts`, and `secretly-love.ts`. This is the owner-approved replacement content; this source pack is not evidence that the repository has already been updated.

**Editorial principle:** The first quiz examines the *social role people keep inviting back despite its downsides*. The second examines *patterns under criticism, conflict, and emotional strain*. The third examines *small, often invisible reasons people feel valued by you*. The third is intentionally re-centered so it does not duplicate the first.

**Personality evidence policy:** No upper limit on distinct trait poles per answer. Use every genuinely supported Core or Private pole, and none where there is insufficient evidence. Quiz-result weights are **separate** from trait evidence. Values such as `C5+2` refer to **raw answer evidence** (+2 to the positive pole of Core dimension 5). `P26−1` means +1 raw evidence to the negative pole of Private dimension 26. The sign identifies a pole; it is **not negative evidence**. An answer never scores both poles of one dimension.

### Trait code legend

**Core / Creature:** C1 Planner (+) / Spontaneous (−); C2 Emotionally Intense (+) / Even-Keeled (−); C3 Direct (+) / Indirect (−); C4 Vibe Checker (+) / Face Value (−); C5 Protective (+) / Hands-Off (−); C6 Adventurous (+) / Comfort-Seeking (−); C7 Independent (+) / Collaborative (−); C8 Control (+) / Let It Play Out (−); C9 Practical (+) / Idealistic (−); C10 Sentimental (+) / Thick-Skinned (−); C11 Rule-Oriented (+) / Rule-Bending (−); C12 Conflict-Forward (+) / Peacekeeping (−); C13 Trust First (+) / Verify First (−); C14 Forgiving (+) / Holds the Receipt (−); C15 Playful (+) / Serious (−); C16 Competitive (+) / Cooperative (−); C17 Curious (+) / Decisive (−); C18 Private (+) / Open (−); C19 Patient (+) / Urgent (−); C20 Ambitious (+) / Content (−).

**Private / Relic:** P21 Accountability (+) / Defensiveness (−); P22 Reflective (+) / Reactive (−); P23 Self-Secure (+) / Reassurance-Seeking (−); P24 Boundary-Holding (+) / Approval-Seeking (−); P25 Vulnerable (+) / Armored (−); P26 Repair-Oriented (+) / Punishing (−); P27 Tactful (+) / Blunt (−); P28 Duty-First (+) / Self-Preserving (−); P29 Supportive (+) / Challenging (−); P30 Gives Freely (+) / Keeps Score (−); P31 Perspective-Taking (+) / Self-Referencing (−); P32 Initiating (+) / Responsive (−).

### Permanent evidence rules (unchanged)

**Current owner-approved rule:** Each selected quiz answer directly earns its own approved +1/+2/+3 numeric trait evidence once on the first valid completion of that semantic quiz version. There is no three-point pre-award qualifier and NO top-three/per-quiz permanent award step. Only the answer earns personality points. The result verdict is saved separately and awards no personality points. Profile eligibility is a downstream display calculation, not a new scoring event. Preserve replay protection, active-evidence expiry, and approved mapping semantics.

---

# QUIZ 1: SO WHY DO PEOPLE KEEP YOU AROUND?
**Category:** The Good Stuff · **Access:** Free Private preview · **Quiz key:** `keep-you-around` · **10 questions · 5 choices each**

**Intro:** *People don't only love you for your best behavior. Sometimes the reason they keep you close is attached to the thing that drives them absolutely insane. Let's find out what they're signing up for. 😂*

**CTA:** *Expose me →*

### Result spectrum
- **EC — THE EMERGENCY CONTACT.** Loyal, practical care; can turn indispensable into exhausted.
- **ST — THE REASON THERE'S A STORY.** Brings energy and stories; may confuse excitement with avoiding discomfort.
- **BS — THE HUMAN BULLSHIT DETECTOR.** Cuts through excuses; can make unfiltered honesty a sport.
- **HD — THE HYPE DEPARTMENT.** Reminds people of their potential; can make every rough day into homework.
- **KN — THE ONE WHO KNOWS TOO MUCH.** Notices the undercurrent; may turn observation into unpaid investigation.

**Scoring notation:** `[EC2]` means +2 result points toward EC. These weights are not personality awards.

### The full questions and answer-level trait mappings

**Q1. Your friend is dating somebody you cannot stand. What are you actually doing?**
- **A [BS2].** I say what worries me, once, clearly. After that, they're grown. *(C3+2, C5+1, C8−1; P24+1, P27+1)*
- **B [EC2].** If it blows up, they can call me without getting an “I told you so.” *(C5+2, C14+1; P29+1, P31+1, P26+1)*
- **C [ST2].** I keep making ridiculous plans with them. This relationship isn't stealing our entire friendship. *(C6+1, C15+2; P32+2)*
- **D [KN2, BS1].** I have noticed three red flags and two inconsistencies. I'll say more only if asked. *(C4+2, C13−1, C17+1; P22+1, P24+1)*
- **E [HD2, EC1].** I remind my friend they still have an identity outside this relationship. Loudly, if necessary. *(C5+1; P29+2, P32+1)*

**Q2. Your friend gets something you wanted too. You are happy for them, but let's not pretend it doesn't sting.**
- **A [EC2].** I congratulate them. My disappointment isn't their bill to pay. *(C2−1, C16−1; P22+2, P31+2)*
- **B [ST2, HD1].** We are celebrating. My jealousy can stay home with its attitude. 😂 *(C15+2, C6+1; P29+1, P22+1)*
- **C [KN2].** I want the entire story. What worked for them, and what did I miss? *(C17+2, C4+1, C20+1)*
- **D [HD2, ST1].** I make their win feel enormous. I know how hard they worked. *(C10+1, C15+1; P29+2, P32+1)*
- **E [BS2, EC1].** “I'm thrilled for you and a little sick for me.” Both things can be true. *(C3+2, C18−1; P25+2, P21+1)*

**Q3. Your friend sends two thirst traps: “Which one should I post? My ex just hard-launched somebody.”**
- **A [ST2].** The hotter one. If we're being petty, at least give them production value. *(C15+2, C11−1; P22−1)*
- **B [BS2].** Neither, if the goal is making your ex react. They still have the remote control. *(C3+2, C9+1; P29−1, P27−1)*
- **C [KN2].** Wait. Their ex hard-launched WHO? Send the post. 👀 *(C17+2, C4+1; P22−1)*
- **D [HD2].** Post whichever makes YOU feel good. Your ex doesn't get a vote. *(C7+1; P23+1, P24+2, P29+1)*
- **E [EC2, BS1].** Post it if you want; then hand me the phone. We are not refreshing the views all night. *(C5+1, C9+2; P29+1, P22+1)*

**Q4. Your friend sends a screenshot ABOUT someone TO the exact person in the screenshot.**
- **A [KN2].** Show me exactly what was sent. Details change the whole situation. *(C17+2, C13−1, C4+1)*
- **B [ST2].** I'm laughing for 30 seconds before I'm useful. I'm only human. *(C15+2, C2+1)*
- **C [BS2].** If the message was cruel, that's the actual problem, not just getting caught. *(C3+2, C12+1; P21+1, P29−1)*
- **D [EC2].** Okay. Who needs an apology? What can we repair right now? *(C9+2, C5+1; P26+2, P32+1)*
- **E [HD2, BS1].** Yes, you messed up. No, your life isn't over. Own it and come back to Earth. *(C9+1; P29+2, P21+1, P26+1)*

**Q5. At a party, one of your closest friends is being iced out by people you both know.**
- **A [EC2].** If that's my person, I am not leaving them standing alone. *(C5+2, C12+1; P28+1, P29+1)*
- **B [BS2].** “Are we going to discuss the problem or do this middle-school nonsense all night?” *(C3+2, C12+2; P27−1, P29−1)*
- **C [KN2].** I know exactly where this started. Tonight is episode four, not episode one. *(C4+2, C10+1; P22+1)*
- **D [ST2, HD1].** We are having a better night than the people trying to exclude us. Pictures included. *(C15+2, C6+1; P29+1, P32+1)*
- **E [HD2, EC1].** “Head up. Don't shrink for an audience.” Then I walk back in with them. *(C5+1, C12+1; P29+2, P32+1)*

**Q6. Your friend wants to move across the country for someone they've been dating four months.**
- **A [EC2, BS1].** If they're going, we need a job plan, housing plan, money, and a way home. *(C1+2, C9+2, C5+1; P29+1)*
- **B [ST2].** Do it. Worst case you come home with character development and a wild story. *(C6+2, C1−1, C11−1)*
- **C [KN2].** What's the person's full name, and what do we actually know about them? *(C13−2, C17+2, C4+1)*
- **D [BS2].** Four months? You're changing ZIP codes before you've seen them through a bad Tuesday. *(C3+2, C9+1, C12+1; P27−1)*
- **E [HD2, BS1].** “Would you want that city if the relationship ended?” If yes, I believe in the leap. *(C9+1, C6+1; P29+2, P31+1)*

**Q7. You're furious with someone you love, and the reason is legitimate. What happens first?**
- **A [BS2].** I say what's wrong. I cannot do fake-normal when everybody knows we're upset. *(C3+2, C12+2; P25+1)*
- **B [EC1].** I cool off before I speak. My angry vocabulary is too advanced for this moment. *(C19+1; P22+2, P26+1)*
- **C [EC2].** I'm angry, but if there's a genuine emergency tonight, I still answer. *(C5+2; P28+2, P30+1)*
- **D [KN2].** I call the person who already knows the full backstory and ask what I'm missing. *(C17+1, C4+1; P31+1, P22+1)*
- **E [ST2].** We take a breather. The first truly ridiculous thing one of us says usually breaks the ice. *(C15+2, C12−1; P26+1)*

**Q8. Your friend shares something that completely changes how you see their earlier behavior.**
- **A [KN2].** I need context. What else haven't I seen? *(C17+2, C4+2; P22+1)*
- **B [BS2].** If the new context changes my opinion, I say so. If it doesn't, I say that too. *(C3+2, C13−1; P21+1, P27+1)*
- **C [EC2].** Whatever I think, this stays between us. They told me, not the group chat. *(C5+1, C18+2, C11+1; P24+1)*
- **D [ST2].** I'm going to make one terrible joke to give this heavy conversation some oxygen. *(C15+2; P27−1)*
- **E [HD2].** One mistake doesn't have to become their entire personality. Own it and grow. *(C14+1; P29+2, P26+1, P31+1)*

**Q9. It's 9:07 p.m. You're home. The group chat says, “We need you. Come out.”**
- **A [EC2].** If somebody needs actual help, I'm coming. If it's FOMO bait, goodnight. *(C5+2, C9+1; P24+2, P28+1)*
- **B [ST2].** Where? I can be dressed in twelve minutes. *(C1−2, C6+2, C15+1)*
- **C [KN2].** WHO needs me, and why was that message so suspiciously vague? *(C17+2, C4+1, C13−1)*
- **D [BS2].** I'm not choosing a side without hearing what actually happened. *(C9+1, C13−2, C3+1; P31+1)*
- **E [HD2].** Fine, but if I show up, nobody's spending the night marinating in misery. *(C15+1; P29+2, P32+2)*

**Q10. Which sentence has somebody who loves you said with a completely straight face?**
- **A [EC1].** “You are not everybody's emergency contact.” *(C5+1; P28+1)*
- **B [ST1].** “This was supposed to be ONE drink.” *(C15+1, C1−1)*
- **C [BS1].** “I asked you not to SAY it, not whether it was true.” *(C3+1; P27−1)*
- **D [KN1].** “Why do you have screenshots from February?” *(C4+1, C10+1; P22+1)*
- **E [HD1].** “I just wanted to complain, not attend your motivational seminar.” *(P29+1, P32+1)*

### Full revised result reads

#### EC · THE EMERGENCY CONTACT
**THE VERDICT:** You are everybody's “call them” person. That's love with logistics.

**THE PRIVATE READ:** When something falls apart, you don't send a motivational quote and disappear. You remember, show up, find the charger, make the call, and stay until somebody can breathe again. People trust you because your care gets out of the group chat and does something.

**THE CALL-OUT:** Here's the part you won't love: sometimes you take over before anyone asks. Then you resent everyone for expecting you to take over. A very efficient little trap. 👀

**THE COST:** If you're always available, people can stop practicing how to show up for you. You become indispensable and quietly furious.

**TRY THIS:** Before rescuing, ask, “Do you want help, advice, or company?” If they say company, leave the cape in the car.

**THE KICKER:** Apparently, you're the emergency contact. The emergency is that nobody knows whether you're okay.

#### ST · THE REASON THERE'S A STORY
**THE VERDICT:** You don't just attend the function. You become the reason it gets recapped.

**THE PRIVATE READ:** You're the friend who turns errands into an adventure and a dull dinner into an incident somebody mentions for years. People keep you close because ordinary life gets more alive around you.

**THE CALL-OUT:** Sometimes your intolerance for boredom means you don't let people have a quiet, awkward, or sad minute. Every feeling doesn't need a sequel, a plan, or better lighting. 😂

**THE COST:** If you always produce the fun, people might feel obligated to keep up, even when they need to go home.

**TRY THIS:** Once in a while ask, “Are we all having fun, or am I refusing to let tonight end?” Then honor the answer.

**THE KICKER:** Apparently, you're a core memory. Occasionally a cautionary tale.

#### BS · THE HUMAN BULLSHIT DETECTOR
**THE VERDICT:** The truth has your number. It does not always appreciate your delivery.

**THE PRIVATE READ:** You notice when the explanation and the behavior aren't on speaking terms. You're willing to say the inconvenient thing, and that makes your praise believable. Friends come to you when they want an answer, not a decorative yes.

**THE CALL-OUT:** “I'm just honest” can become an all-access pass to saying a true thing in the meanest possible font. Sometimes you want clarity. Sometimes you want the winning line. Be able to tell the difference.

**THE COST:** If every half-formed thought gets cross-examined, people start bringing you only the polished version. The truth-teller gets less truth.

**TRY THIS:** Before the hard sentence, ask: Is it true? Is it useful? Is this the moment? If one is missing, edit before sending.

**THE KICKER:** Apparently, when you say “Can I be honest?” people start bracing.

#### HD · THE HYPE DEPARTMENT
**THE VERDICT:** You see people's potential so clearly you sometimes forget they are allowed to rest.

**THE PRIVATE READ:** You notice the effort behind the win and the courage behind the attempt. People leave your conversations standing taller. You make your friends feel like there is still a bigger version of themselves worth meeting.

**THE CALL-OUT:** Not everybody who says “I'm tired” is asking for a five-year plan. Sometimes your encouragement is a beautiful gift. Sometimes it's pressure wearing a pom-pom hat.

**THE COST:** People may avoid sharing their doubts because they don't want to disappoint the future version of themselves you already introduced to everybody.

**TRY THIS:** Ask, “Hype, help, or just let me complain?” Then actually respect the selected service.

**THE KICKER:** Apparently, you're emotional pre-workout. Powerful. Please read the dosage instructions.

#### KN · THE ONE WHO KNOWS TOO MUCH
**THE VERDICT:** You noticed the shift before anybody announced there was a shift.

**THE PRIVATE READ:** You pick up the pauses, changed tones, tiny details, and backstories that make other people's behavior make sense. Friends feel seen because you remember what they said three months ago and can tell when “I'm fine” isn't the whole sentence.

**THE CALL-OUT:** Reading the room is a skill. Reconstructing someone's entire life from screenshots, mutuals, and one suspicious like is not automatically your assignment.

**THE COST:** You become the unofficial archive of everybody's drama. Eventually people may stop confiding in you because you seem to have a permanent file on everything.

**TRY THIS:** Ask: Is it mine to know? Mine to repeat? Mine to fix? If the answer is no, retire from that case.

**THE KICKER:** Apparently, the group chat needs a privacy policy. Mostly because of you.

### Owner-approved editorial scoring; implementation verification pending

Use the existing configurable scoring engine and high-signal tie mechanism. High-signal questions: Q1, Q3, Q5, Q6, Q8. Tie-break first by higher result total, then by number of primary +2 matches on high-signal questions, then by the last diagnostic question among Q8/Q6/Q5/Q3/Q1, then a fixed, documented fallback order. A runner should verify the exact engine's semantics, not infer implementation approval from this prose.

**Reachability examples:** all A/B/C/D/E answers do *not* represent one consistent result, so use these deliberate paths: EC = Q1B Q2A Q3E Q4D Q5A Q6A Q7C Q8C Q9A Q10A; ST = Q1C Q2B Q3A Q4B Q5D Q6B Q7E Q8D Q9B Q10B; BS = Q1A Q2E Q3B Q4C Q5B Q6D Q7A Q8B Q9D Q10C; HD = Q1E Q2D Q3D Q4E Q5E Q6E Q7B Q8E Q9E Q10E; KN = Q1D Q2C Q3C Q4A Q5C Q6C Q7D Q8A Q9C Q10D. These are proposed respondent profiles to be verified in code.

---

# QUIZ 2: BE SO SERIOUS RIGHT NOW.
**Category:** Shadow Side · **Access:** Free Private preview · **Quiz key:** `be-so-serious` · **10 questions · 5 choices each**

**Intro:** *We came in ready to ask if you're the problem. Sometimes you're not. Sometimes the answer is “Girl. 👀” Let's see which version of you shows up when your feelings have a microphone.*

**CTA:** *Fine. Clock me →*

### Result spectrum
- **HW — NO, ACTUALLY. YOU HANDLE THIS PRETTY WELL.** Self-reflective, direct enough to repair, able to tolerate disagreement.
- **CT — YOU CALL IT STANDARDS. SOMETIMES IT'S CONTROL.** Competence can turn into pressure on others' choices.
- **PU — YOU DON'T COMMUNICATE. YOU PUNISH.** Withdraws warmth or retaliates to send a message without owning the message.
- **HM — YOU'RE NOT “JUST HONEST.” SOMETIMES YOU'RE MAD.** Truth used as a delivery vehicle for anger.
- **AC — YOU WANT ACCOUNTABILITY UNTIL IT'S YOUR TURN.** Explains away their own role while holding others to standards.
- **MX — YOU'RE NOT THE VILLAIN. YOU'RE ALSO NOT ABOVE IT.** **New mixed-evidence safeguard:** scattered contradictions without an earned dominant harsh pattern or strong positive pattern. This prevents the positive result being used as a default for answers that do not support it.

**Interpretive rule:** Critical outcomes must be *earned by repeated behavior*, not triggered by one answer. Negative poles are not “bad points”; they are evidence of specific behaviors.

### The full questions and answer-level trait mappings

**Q1. Someone close cancels on you at the last minute. Again. What are you actually doing?**
- **A [HW2].** I ask what happened. Twice is a pattern, but I want the story before I decide what it means. *(C3+1, C13−1; P22+2, P31+2)*
- **B [PU2].** I say “It's fine,” then quietly stop offering them the things they always ask me for. *(C3−2, C14−1; P26−2, P30−1, P25−1)*
- **C [HW1].** I tell them this doesn't work for me and stop holding time for plans they don't confirm. *(C3+2, C9+1; P24+2, P22+1)*
- **D [HM2].** I tell them exactly how disrespectful they were, including a few details they probably didn't need. *(C3+2, C12+1; P27−2, P22−1)*
- **E [CT2].** I invent a whole confirmation system and expect them to follow it next time. *(C1+2, C8+2, C9+1)*

**Q2. They tell you, “What you did really hurt me.” What actually comes out of your mouth first?**
- **A [HW2].** “Tell me what part hurt. I want to understand.” *(C17+1; P21+2, P31+2, P22+1)*
- **B [AC2].** “That is not what I meant,” followed by an explanation before I hear what hurt. *(C3+1; P21−2, P25−1)*
- **C [AC2].** “Interesting. You had no issue hurting me last week.” *(C14−1; P21−2, P30−2, P31−1)*
- **D [HM2, AC1].** “What did I even say that was so bad?” I start cross-examining before hearing the answer. *(C12+1; P27−1, P21−1, P22−1)*
- **E [HW2].** “I can feel myself getting defensive. Give me a minute, then I want to hear you out.” *(C2+1; P22+2, P21+2, P31+1)*

**Q3. Someone you love says NO to something you want. You think their reason is weak. What happens next?**
- **A [HW2].** I check once whether there's room to reconsider. If it's still no, it's no. *(C3+1, C8−2; P24+2, P31+1)*
- **B [CT2].** I keep explaining. I think they'll agree once they understand how much sense my plan makes. *(C8+2, C12+1; P24−1, P31−1)*
- **C [PU2].** I say okay. My affection disappears for a while, and yes, I want them to notice. *(C3−2; P26−2, P25−1)*
- **D [HW1].** I accept it, then rethink what I can do independently without making their no a punishment. *(C7+2, C8−1; P24+1, P22+1)*
- **E [PU2, CT1].** I remind them of every time I said yes for them. Suddenly reciprocity is Exhibit A. *(C8+1, C14−1; P30−2, P26−1, P31−1)*

**Q4. They ignored your advice, and now exactly what you warned about has happened. What do you do?**
- **A [HW2].** If they need real help, I help. They already know they were wrong. *(C5+1; P29+2, P22+1, P26+1)*
- **B [HM1].** I help, but I cannot resist one tiny “Now what did I say?” 😂 *(C15+1; P27−1, P30−1)*
- **C [HW1].** I ask what help they want. I am not automatically responsible for fixing choices I warned against. *(C9+1; P24+2, P28−1)*
- **D [CT2].** I make sure they know next time they need to run the plan by me. I was right, after all. *(C8+2, C16+1; P31−1)*
- **E [HW2].** Crisis first, discussion later. A lecture isn't an emergency service. *(C9+2, C19−1; P22+2, P29+1)*

**Q5. Your partner keeps liking an attractive person's very obvious thirst traps. It bothers you. Now what?**
- **A [HW2].** “This bothers me. I want to talk about what we both consider respectful.” *(C3+2, C12+1; P25+2, P26+1, P24+1)*
- **B [CT1].** Before I say a word, I'm tracking who this person is and every interaction I can find. *(C13−2, C8+1, C4+1; P22−1)*
- **C [PU2].** I get colder and less available so they can feel how I feel. *(C3−1, C14−1; P26−2, P25−2)*
- **D [PU2].** Fine. I can like people's pictures too. Let's all be extremely supportive. 😂 *(C11−1; P26−2, P22−1, P30−1)*
- **E [CT2].** I tell them my rule is final and treat any disagreement as proof they're disrespecting me. *(C8+2, C12+1; P31−2, P24−1)*

**Q6. Mid-argument, you realize they might actually be right. Painful development. What now?**
- **A [HW2].** “You're right about that part.” I hate how much personal growth that required. *(C3+1; P21+2, P22+2, P26+1)*
- **B [HW1].** I concede the specific point and stay on the rest without pretending the whole argument is settled. *(C3+1; P21+2, P27+1)*
- **C [AC2].** I immediately explain why I did it. Context first, acknowledgment maybe later. *(P21−2, P25−1, P31−1)*
- **D [AC1].** If they're smug, admitting anything feels suddenly impossible. *(C16+1; P21−1, P22−1)*
- **E [AC2].** I keep arguing even though I know, then admit it after my pride has recovered. *(C12+1; P21−2, P22−1, P26−1)*

**Q7. You're mad. They ask, “Are you okay?” What do they get?**
- **A [HW2].** “No. I'm upset about earlier. Can we talk?” *(C3+2; P25+1, P26+2, P32+1)*
- **B [PU2].** “I'm fine.” Everything about my expression says they should know better. *(C3−2; P26−2, P25−1)*
- **C [HW2].** “Not yet. I need an hour, and I will come back to this.” *(C19+1; P22+2, P24+1, P26+2)*
- **D [HM2].** A very accurate description of what they did, delivered at a completely unnecessary volume. *(C3+2, C2+1, C12+1; P27−2, P22−1)*
- **E [PU2].** I want them to work it out themselves. They were there; why should I explain? *(C3−2, C14−1; P26−2, P31−1)*

**Q8. Somebody says, “You always have to have things your way.” What's your reaction?**
- **A [HW2].** “Do I?” I hate the accusation, but I will actually think about it. *(C17+1; P21+2, P22+2, P31+1)*
- **B [CT2].** “No, I just get tired of being right after everybody ignored me.” *(C8+2; P21−1, P31−1)*
- **C [HW1].** “Give me examples. I want to separate the pattern from one bad day.” *(C17+1, C13−1; P22+2, P21+1)*
- **D [CT2].** “Funny how nobody complains about my way when my way works.” *(C8+2, C16+1; P21−1)*
- **E [AC2].** I list every time I compromised. The historical record must be corrected. *(C14−1; P21−2, P30−2, P31−1)*

**Q9. You get caught doing something you've criticized someone else for doing. What happens?**
- **A [HW2].** “Yep. That's hypocritical. You got me.” An absolutely terrible day for my ego. *(C3+1; P21+2, P22+2)*
- **B [AC2].** “The situations are different,” followed by my very detailed opening argument. *(C3+1; P21−2, P31−1)*
- **C [HW1].** I own my part; I also don't let them use it to erase theirs. *(C3+2; P21+2, P24+1, P26+1)*
- **D [AC2].** I resist it first, then privately recognize they were right, without telling them. *(C18+1; P21−2, P25−1, P26−1)*
- **E [AC1].** I joke until we have conveniently stopped talking about my part. *(C15+1; P21−1, P25−1)*

**Q10. Which sentence has someone close to you probably wanted to say?**
- **A [CT1].** “You do not have to manage everything.” *(C8+1)*
- **B [PU1].** “If you're mad, just SAY you're mad.” *(C3−1; P25−1)*
- **C [HM1].** “Being right did not require all that.” *(C3+1; P27−1)*
- **D [AC1].** “Stop telling me what I did when we're discussing what YOU did.” *(P21−1, P30−1)*
- **E [HW1].** “I appreciate that you can disagree without making me the enemy.” *(C12−1; P31+1, P26+1)*

### Full revised result reads

#### HW · NO, ACTUALLY. YOU HANDLE THIS PRETTY WELL.
**THE VERDICT:** We arrived with a clipboard full of accusations. Disappointingly, you brought emotional range.

**THE PRIVATE READ:** You can feel angry without making anger the entire conversation. You can hear “that hurt” without launching a countersuit and say “you have a point” without requiring someone to frame the moment. That is not perfection. It is the ability to catch yourself while something still can be repaired.

**THE CALL-OUT:** Don't make “I'm the mature one” your new favorite personality trait. Self-awareness becomes obnoxious when you use it as proof that everyone else is less evolved. 😂

**THE COST:** If you stop listening the moment someone questions your self-image as reasonable, you eventually become difficult to correct in much more sophisticated language.

**TRY THIS:** When someone says you missed something, ask, “What did that feel like on your side?” before presenting your own transcript.

**THE KICKER:** Apparently, you're not always the problem. Please don't become a problem about that.

#### CT · YOU CALL IT STANDARDS. SOMETIMES IT'S CONTROL.
**THE VERDICT:** You are good at organizing things. You have unfortunately started organizing people.

**THE PRIVATE READ:** You think ahead and notice trouble before it happens. Your plans work often enough that “I told you so” has become a quiet internal soundtrack. You genuinely want things to go well.

**THE CALL-OUT:** Your way being effective does not automatically make it everybody else's assignment. “I was only trying to help” can become an endless presentation nobody requested. Other adults are allowed to understand you perfectly and still disagree.

**THE COST:** People start making decisions without telling you until afterward because they don't want to negotiate for ownership of their own choices.

**TRY THIS:** Give your opinion once. Then ask yourself whether this decision belongs to you. If it doesn't, let the silence after your suggestion be actual silence.

**THE KICKER:** Apparently, you're not wrong every time. That's exactly why this one is so annoying.

#### PU · YOU DON'T COMMUNICATE. YOU PUNISH.
**THE VERDICT:** Your silence is saying a LOT. It just refuses to sign its name.

**THE PRIVATE READ:** When you're hurt, you may get quieter, colder, less available, or suddenly very generous with “fine.” Your distance does not simply protect your peace; sometimes you want somebody else to feel the change and come looking for the reason.

**THE CALL-OUT:** Needing time is healthy. Making affection disappear to teach someone a lesson is a different activity. If the goal is for them to worry until they chase you, that's punishment with excellent deniability.

**THE COST:** People start reading your tone like a weather alert. Eventually some stop asking what happened, and you may interpret their exhaustion as more proof they don't care.

**TRY THIS:** Try the embarrassingly direct version: “I'm hurt. I need an hour. I want to talk tonight.” State the feeling without assigning someone a scavenger hunt.

**THE KICKER:** Apparently, you're not mysterious. You're mad. They would understand faster if you sent the memo.

#### HM · YOU'RE NOT “JUST HONEST.” SOMETIMES YOU'RE MAD.
**THE VERDICT:** The fact-checking department is excellent. The delivery department needs supervision.

**THE PRIVATE READ:** You do not enjoy pretending a problem isn't there. You can name the inconsistency everybody else keeps dancing around, and people value that courage. A straight answer is genuinely useful.

**THE CALL-OUT:** The thing you said might be true. But why that volume? Why that moment? Why the extended director's cut? Sometimes anger borrows the credibility of honesty so it can land a punch without having to own the swing.

**THE COST:** People start editing their stories before bringing them to you. The person who wants truth the most gets the most carefully managed version.

**TRY THIS:** Ask whether your next sentence is meant to make the situation clearer or to make the person hurt. If it's both, edit it until the first purpose can stand on its own.

**THE KICKER:** Apparently, your honesty brought receipts. Your anger brought a folding chair.

#### AC · YOU WANT ACCOUNTABILITY UNTIL IT'S YOUR TURN.
**THE VERDICT:** Accountability is a beautiful principle. Apparently, you prefer the outgoing department.

**THE PRIVATE READ:** You remember who said what, and you understand that intent doesn't erase impact. You can recognize excuses immediately when somebody else is making them. That's not the issue.

**THE CALL-OUT:** When it's your turn, “I only did that because...” and “well, you did...” start sprinting toward the microphone. Context can be real and still become a hiding place. You can be provoked and still be responsible for your response.

**THE COST:** Someone who has to prove they were completely innocent before you acknowledge your part will eventually stop telling you what hurts. That isn't peace. It's paperwork fatigue.

**TRY THIS:** Say, “You're right about my part.” Stop there for one complete breath. You can discuss everything else afterward without using it as the entrance fee.

**THE KICKER:** Apparently, you believe in accountability. We just need to confirm your plan includes incoming calls.

#### MX · YOU'RE NOT THE VILLAIN. YOU'RE ALSO NOT ABOVE IT.
**THE VERDICT:** The evidence says you're human and inconsistent. Congratulations. Annoying diagnosis.

**THE PRIVATE READ:** Sometimes you handle conflict with surprising grace. Other times you manage, sting, withdraw, or defend yourself before you can slow down. No single sharp pattern dominated your responses enough to earn the full call-out. That is a more truthful result than putting you in somebody else's box.

**THE CALL-OUT:** “I'm not always like that” is true and also completely beside the point. The occasional version still counts. A behavior doesn't need to be your brand to affect someone.

**THE COST:** If you only examine the version of yourself that feels flattering, the less attractive behaviors keep turning up under different names.

**TRY THIS:** Pick the answer you least enjoyed selecting. Ask what tends to happen *right before* that response, and what one sentence you could say instead.

**THE KICKER:** Apparently, you're not a villain. You're a person with recurring guest appearances from several villains.

### Proposed scoring, harsh-result gates, and test profiles

**Approval status:** The owner approved these editorial scoring and gate values. The implementing scorer must still verify them using exhaustive/targeted paths before activation.

- Each response adds its bracketed result weight. MX is a fallback, not a scored identity dimension.
- A harsh result (CT, PU, HM, AC) is **eligible only when supported by at least three different questions**, including **at least two +2 primary matches** and **at least one diagnostic/high-signal question** from Q2, Q3, Q5, Q7, or Q9. This prevents one pointed answer from producing a condemning result.
- HW is eligible when at least **three different +2 HW choices** were selected, including at least one of Q2, Q3, Q5, Q7, or Q9. It must not be used as the default simply because the negative gates fail.
- Among eligible results, choose the highest weighted score. Break ties by supported primary matches on the diagnostic questions, then by a deterministic ordered late-answer sequence, then by a documented fallback order.
- If **no result is eligible**, return MX. MX must not create fabricated trait awards; its underlying selected answers still contribute genuine raw trait evidence.
- These rules should be calibrated using realistic mixed responses, not merely the five all-one-category caricatures.

**Representative paths to test:**
- HW: Q1A Q2A Q3A Q4A Q5A Q6A Q7A Q8A Q9A Q10E.
- CT: Q1E Q2E Q3B Q4D Q5E Q6D Q7D Q8B Q9B Q10A.
- PU: Q1B Q2C Q3C Q4B Q5C Q6E Q7B Q8D Q9D Q10B.
- HM: Q1D Q2D Q3B Q4B Q5D Q6B Q7D Q8C Q9D Q10C.
- AC: Q1B Q2B Q3B Q4C Q5B Q6C Q7E Q8E Q9B Q10D.
- MX: Q1A Q2C Q3D Q4B Q5B Q6D Q7D Q8B Q9C Q10E. Verify no eligible result accidentally overwhelms this mixed example; adjust the *example path*, not the approved result meanings, if necessary.

**Approval record:** The `MX` mixed-evidence safety result was included in the three-quiz packet explicitly approved by the owner; it is part of the locked revision. It still needs scoring/reachability validation.

---

# QUIZ 3: WHAT DO PEOPLE SECRETLY LOVE ABOUT YOU?
**Category:** The Good Stuff · **Access:** Approved third active free Private preview · **Logical quiz:** `secretly-love` · **8 questions · 4 choices each**

**Why this is a material revision:** The archived original asked about showing up, making others comfortable, bringing the spark, and being a real one. Those substantially overlapped the first quiz's Emergency Contact, Story, Hype, and Bullshit Detector outcomes. This version asks a different question: *What quiet, specific experience do people get with you that they might not know how to compliment?* It rewards small evidence of attention, permission, recognition, and space. It should feel softer, more intimate, and more surprising without losing the brand's side-eye.

**Intro:** *Not everything people love about you makes a good toast. Some of it happens in the little moments you barely notice. The moments they do.*

**CTA:** *Tell me the quiet part →*

### New, distinct result spectrum
- **UP — YOU LET PEOPLE BE UNIMPRESSIVE.** Around you, others can take off the performance and still feel welcome.
- **FT — YOU REMEMBER THE FOOTNOTES.** You carry specific, seemingly tiny details that tell somebody they are not interchangeable.
- **IW — YOU NOTICE THE WORK NOBODY APPLAUDED.** You recognize invisible effort rather than only visible success.
- **RM — YOU DON'T MAKE CLOSENESS A FULL-TIME JOB.** You give people breathing room without turning space into rejection.

### The full questions and answer-level trait mappings

**Q1. Someone tells you about a tiny win: they finally made a phone call they'd been avoiding for weeks. What do you say?**
- **A [IW2].** “I know how long that was sitting on you. That's a big deal.” *(C4+1, C10+1; P29+2, P31+1)*
- **B [FT2].** “Was that the call about the Tuesday appointment you mentioned last month?” *(C4+1, C10+2; P32+1)*
- **C [UP2].** “You don't have to convince me it's impressive. I'm happy with you.” *(C3+1; P29+1, P31+2, P25+1)*
- **D [RM2].** “Proud of you. No need to tell me more unless you feel like it.” *(C5−1, C19+1; P24+2, P31+1)*

**Q2. Your favorite person is quieter than usual over dinner. You're not sure why. What happens?**
- **A [UP2].** I keep us company without making them explain their mood. *(C19+2; P29+1, P31+1)*
- **B [FT2].** I remember the food they always want when they're having a rough day. I order that. *(C10+2, C4+1; P32+1, P29+1)*
- **C [IW2].** I quietly take care of the thing they've been carrying all week, if they want help. *(C5+1, C9+1; P29+2, P31+2)*
- **D [RM2].** I tell them they can head home early without hurting my feelings. *(C5−2, C19+1; P24+2, P31+1)*

**Q3. A good friend goes quiet for two days. You know they're overwhelmed, not angry with you. Your move?**
- **A [RM2].** I don't make their need for space into a test of our friendship. *(C13+1, C19+2; P23+2, P24+1, P31+1)*
- **B [UP2].** When they return, I don't make them give a courtroom account of where they've been. *(C14+1, C19+1; P29+1, P31+2)*
- **C [FT2].** I save the ridiculous thing they'd love and send it when they resurface. *(C10+2, C15+1; P32+1)*
- **D [IW2].** I send one low-pressure message offering to take a concrete task off their plate. *(C5+1, C9+2; P29+1, P32+2)*

**Q4. Someone you love has been quietly carrying work, family, and everyone else's needs. They shrug: “It's nothing.”**
- **A [IW2].** “It wasn't nothing. I saw how much you did when nobody was looking.” *(C4+2; P29+2, P31+2)*
- **B [FT2].** I mention the one specific sacrifice everyone else seems to have missed. *(C10+1, C4+2; P31+1, P29+1)*
- **C [UP2].** I make space for them to admit they're exhausted without asking for a positive spin. *(C19+2; P25+1, P29+2, P31+1)*
- **D [RM2].** I help create a real break and don't turn it into one more commitment. *(C9+1, C5−1; P24+2, P28−1, P29+1)*

**Q5. At a gathering, someone you care about mentions a very specific preference they'd told you once.**
- **A [FT2].** “I remembered. That's why I picked this one.” *(C10+2; P32+1, P29+1)*
- **B [UP2].** I make sure they know they don't have to pretend they like the popular choice. *(C3+1, C7+1; P24+2, P31+1)*
- **C [IW2].** I thank them for the little work they did to make everyone comfortable today. *(C4+2, C10+1; P29+2, P31+1)*
- **D [RM2].** I offer them the easy option to opt out without making it a scene. *(C5−1, C19+1; P24+2, P31+1)*

**Q6. Plans get canceled because someone is burned out. What would they be most relieved to hear from you?**
- **A [RM2].** “Rest. You don't owe me replacement plans before you've slept.” *(C19+2, C8−1; P24+2, P31+2)*
- **B [UP2].** “You don't need to be the fun version of you for me to want you around.” *(C10+1; P25+1, P29+2, P31+2)*
- **C [FT2].** “I'll save you the specific snack you always steal from my plate.” *(C10+2, C15+1; P32+1)*
- **D [IW2].** “Want me to handle the one annoying errand you haven't had time for?” *(C5+1, C9+2; P29+1, P32+2)*

**Q7. Someone is making a life choice that isn't what you'd choose. You care about them. What do you actually do?**
- **A [RM2].** I let them own the decision without making my approval the prize. *(C8−2, C7+1; P24+2, P31+2)*
- **B [IW2].** I notice the courage and work it took just to reach a decision, regardless of the outcome. *(C4+1, C20+1; P29+2, P31+1)*
- **C [FT2].** I remember the personal reason they once told me this mattered, even if it sounds random to others. *(C10+2; P31+2, P32+1)*
- **D [UP2].** I let them say the uncertain and contradictory parts out loud without turning it into a debate. *(C17+1, C19+1; P25+1, P29+2, P31+1)*

**Q8. Which unexpected message would feel most like something someone might send you?**
- **A [UP1].** “I don't have to be the impressive version of myself with you.” *(C19+1; P29+1, P25+1)*
- **B [FT1].** “You remember stuff I forgot I even told you.” *(C10+1, C4+1)*
- **C [IW1].** “You saw the work nobody else thought to mention.” *(C4+1; P29+1, P31+1)*
- **D [RM1].** “You're the only person who doesn't make me explain why I needed space.” *(C5−1, C19+1; P24+1, P31+1)*

### Full revised result reads

#### UP · YOU LET PEOPLE BE UNIMPRESSIVE.
**THE VERDICT:** Around you, people are allowed to show up without their good lighting.

**THE PRIVATE READ:** They can be tired, repetitive, boring, unsure, or not particularly inspiring today, and you don't immediately ask them to become more entertaining. That's rare. Plenty of people love us when we're shining. The little thing they love about you is that they don't have to shine on command.

**THE CALL-OUT:** Acceptance is a gift, but sometimes you avoid saying the hard thing because you don't want to ruin the comfort. Making room for someone and never challenging them are not the same skill.

**THE COST:** When you always make a soft landing, people may mistake your quiet acceptance for unlimited emotional capacity. They need to know your needs count too.

**TRY THIS:** Keep being the soft place. Occasionally add one honest sentence about what *you* need from the relationship.

**THE KICKER:** Apparently, your superpower is letting people be regular. In this economy? Luxury.

#### FT · YOU REMEMBER THE FOOTNOTES.
**THE VERDICT:** You notice the detail that never made it into the main story.

**THE PRIVATE READ:** The snack they mentioned once. The name of the person they were nervous to call. The little ritual that makes a bad day easier. You keep those details not because you're collecting intelligence but because they belong to *that* person. Around you, people feel less interchangeable.

**THE CALL-OUT:** Sometimes remembering everything means you also silently expect everyone to remember you with the same precision. They may love you deeply and still forget the exact sauce. 😂

**THE COST:** If thoughtfulness becomes a secret scorecard, you can end up disappointed in people who never knew there was a test.

**TRY THIS:** Let the detail be a gift, not a receipt. If remembering matters to you, tell people which little things make *you* feel cared for.

**THE KICKER:** Apparently, you're not extra. You're the footnotes. And somehow that's the whole love story.

#### IW · YOU NOTICE THE WORK NOBODY APPLAUDED.
**THE VERDICT:** You see effort that never got a trophy, a post, or a standing ovation.

**THE PRIVATE READ:** You notice when somebody got through a hard day with no help and no dramatic announcement. You see the invisible labor, the emotional restraint, the tiny step after weeks of fear. Your attention makes someone feel like their life is more than just the outcomes people can photograph.

**THE CALL-OUT:** Sometimes you spot what needs doing so quickly that you slide from recognition into rescue. Somebody can want their effort seen without wanting you to take over the next chapter.

**THE COST:** If you become the only person who notices everything, you can end up carrying more than your share, and resenting the very invisibility you're trying to correct.

**TRY THIS:** Tell someone, “I saw that.” Then ask before moving into fixer mode. Recognition counts even when it doesn't turn into a project.

**THE KICKER:** Apparently, you clap for the rehearsal. Not just the premiere.

#### RM · YOU DON'T MAKE CLOSENESS A FULL-TIME JOB.
**THE VERDICT:** People feel loved by you without having to clock in every morning.

**THE PRIVATE READ:** You're able to care without demanding an immediate reply, a constant explanation, or proof that the relationship still matters. People who are overwhelmed, introverted, or simply busy can relax around you because they don't have to perform availability to keep their place.

**THE CALL-OUT:** Space is healthy. Disappearing indefinitely and calling it “low-maintenance” can also be a convenient way to avoid showing initiative. Respecting their freedom shouldn't mean never reaching out first.

**THE COST:** Some people need more reassurance than you naturally offer. They can misread your easygoing style as indifference unless you make care visible sometimes.

**TRY THIS:** Send the first message occasionally, especially when you don't need anything. Make it clear that freedom and affection can coexist.

**THE KICKER:** Apparently, you don't require daily attendance to remain somebody's person. Beautiful. Maybe send a text though.

### Owner-approved editorial scoring; implementation verification pending

Each answer on Q1–Q7 awards +2 toward its bracketed result; Q8 awards +1. Use the existing generic deterministic scorer and approved version identity behavior. No harsh gate is required: every outcome is affirmative, with balanced tradeoffs rather than manufactured insults. High-signal questions Q2, Q4, Q6, Q7 can inform tie resolution. The exact tie configuration must be verified against the existing server/TypeScript engine and approved before activation.

**Reachability examples:** UP = Q1C Q2A Q3B Q4C Q5B Q6B Q7D Q8A; FT = Q1B Q2B Q3C Q4B Q5A Q6C Q7C Q8B; IW = Q1A Q2C Q3D Q4A Q5C Q6D Q7B Q8C; RM = Q1D Q2D Q3A Q4D Q5D Q6A Q7A Q8D.

**Versioning and history:** The existing `secretly-love` key is currently `historicalOnly: true`. Because this approved revision substantially changes questions, outcomes, and personality evidence, **do not overwrite existing historical completions or reuse the old version as if it were identical**. Preserve the original retired definition and link behavior under its existing version identity, then activate a new logical version with a new stable version key, inheriting only the approved free-preview access. The exact key/versioning implementation should be selected only after inspecting the existing version schema and its first-completion behavior.

---

# OWNER APPROVAL AND ACTIVATION GATE

**Current intended state:** Three active, playable Private previews. The original implementation included only two active preview cards; the third was historical-only. This is the approved replacement source, not proof of implementation.

**Owner-approved editorial scope:** All **10 + 10 + 8 questions**, choices, **5 + 6 + 4 results** (including the sixth Shadow Side outcome), answer-level result weights, Core/Private numeric evidence, and proposed gates/ties presented in this packet are editorially approved. No cap on distinct, legitimately supported answer traits. Do not substitute historical `profileSignals` result-level awards.

**Engineering acceptance remains required:** Verify actual client/server scorer parity, reachability, numeric gate/tie mechanics, and historical identity preservation. If a configuration is genuinely incompatible with the Product Bible or scoring engine, report the exact conflict without changing approved copy. Implement version-safe content, update free-preview cards and registry, and stage required tests/migrations. Do not deploy production migrations without separate explicit authorization.

**Versioning for ALL THREE:** The first two previews are already playable and may have real user completions. Because these drafts materially revise their questions, result definitions, and/or personality mappings, implementation must create explicit new approved content versions for those quizzes too, preserve their historical versions and results, and apply the locked first-completion-per-material-version rule. Do not overwrite existing history or silently reuse immutable question/choice keys when that would reinterpret old responses. Audit the existing cross-version evidence guard before activation so it prevents duplicate submissions/retakes without incorrectly suppressing an explicitly approved, evidence-earning *new material version*.

**Implementation rule:** Every mapped trait supported by each actually selected answer earns its approved +1/+2/+3 points directly, once per eligible question. No extra quiz-completion bonus, reduction, top-three award, or trait points from quiz verdicts. Trait totals and profile eligibility are downstream readings of recorded evidence.


---

# SOURCE FILE: 02_AFTER_DARK_OWNER_APPROVED.md

**Source description:** After Dark: private-private-trouble

**Current editorial status: OWNER-APPROVED AND LOCKED (November 1, 2026). Implementation and production rollout are separate actions.**

# HOW MUCH TROUBLE ARE YOU AFTER DARK? 😈

**APPARENTLY PRIVATE · PRIVATE PRIVATE · 18+**

**Everybody has a private side. Apparently would like to meet the one that comes out after dark. 👀**

The late-night texts. The person you swore you were done with. The chemistry that apparently doesn't respect your better judgment.

We're assuming consenting adults and mutual interest. The trouble we're investigating is what you decide to do with it.

*Answer honestly. Your group chat cannot save you here.*

**10 questions · About 3 minutes**

**CTA:** Expose me 😈 →

---

## QUESTION 1 OF 10

**It's 11:47 p.m. Your phone lights up: "I miss you." It's the ONE person you promised yourself you'd stop entertaining. What happens?**

**A.** Lock the phone. We've already done the sequel, and it was worse.

- Verdict: HALO +2
- Creature: #17 Practical +1; #26 Verify first +1; #28 Holds the Receipt +1; #34 Decisive +1
- Relic: #47 Boundary-holding +2; #56 Self-preserving +2

**B.** "You miss me, or the attention?" Then I enjoy that little pause. 😏

- Verdict: TENSION +2; BAD_DECISION +1
- Creature: #29 Playful +2; #5 Direct +1
- Relic: #58 Challenging +1; #60 Keeps score +1

**C.** I'd need a real explanation before that person gets access to me again.

- Verdict: UNLOCKED +2
- Creature: #26 Verify first +2; #35 Private +1
- Relic: #47 Boundary-holding +2; #43 Reflective +1

**D.** "Where are you?" And yes, I know better. 😭

- Verdict: BAD_DECISION +3
- Creature: #2 Spontaneous +2; #38 Urgent +1; #5 Direct +1
- Relic: #44 Reactive +1; #63 Initiating +2

---

## QUESTION 2 OF 10

**You're out with friends when someone you used to have RIDICULOUS chemistry with walks in. You're pretending you don't see them. What's next?**

**A.** Let our eyes do the talking. I'm not wasting a perfectly good entrance.

- Verdict: TENSION +2
- Creature: #7 Vibe checker +1; #29 Playful +2; #6 Indirect +1
- Relic: #64 Responsive +1

**B.** Say hello, catch up, and get back to my friends. I came for a good time, not a plot twist.

- Verdict: HALO +2
- Creature: #4 Even-Keeled +1; #14 Collaborative +1; #17 Practical +1
- Relic: #47 Boundary-holding +1; #45 Self-secure +1

**C.** Find a moment alone to ask whether that spark is still real.

- Verdict: UNLOCKED +2
- Creature: #35 Private +1; #5 Direct +1; #7 Vibe checker +1
- Relic: #49 Vulnerable +1; #63 Initiating +1

**D.** Find a reason to cross the room. This outfit didn't get ready for nothing. 😂

- Verdict: BAD_DECISION +2
- Creature: #2 Spontaneous +1; #29 Playful +1
- Relic: #63 Initiating +2; #45 Self-secure +1

---

## QUESTION 3 OF 10

**Someone tells you, "You seem so innocent." What's your most honest response?**

**A.** Depends who's around. Not everybody gets the whole version of me.

- Verdict: UNLOCKED +2
- Creature: #35 Private +2
- Relic: #47 Boundary-holding +1

**B.** I mean, I'm fairly innocent. Give or take a few thoughts.

- Verdict: HALO +2
- Creature: #29 Playful +1
- Relic: No confident award

**C.** "Innocent" is a strong word. I just know when to behave.

- Verdict: TENSION +2
- Creature: #29 Playful +1; #15 Control +1
- Relic: #56 Self-preserving +1

**D.** I laugh because they have no idea what I almost did last weekend. 😭

- Verdict: BAD_DECISION +2; UNLOCKED +1
- Creature: #35 Private +1
- Relic: No confident award

---

## QUESTION 4 OF 10

**At the end of a date, they lean closer and say, "If I kissed you right now, would that be a bad idea?" Your reply?**

**A.** "Maybe. Are you always this dramatic?" 😏

- Verdict: TENSION +2
- Creature: #29 Playful +2; #5 Direct +1
- Relic: #58 Challenging +1

**B.** "Goodnight." Then I walk away before I complicate my own life.

- Verdict: HALO +2
- Creature: #34 Decisive +1; #17 Practical +1
- Relic: #56 Self-preserving +2; #47 Boundary-holding +1

**C.** "I've been thinking about that all night."

- Verdict: UNLOCKED +2
- Creature: #5 Direct +2
- Relic: #49 Vulnerable +2; #63 Initiating +1

**D.** "Let's find out."

- Verdict: BAD_DECISION +2
- Creature: #2 Spontaneous +2; #5 Direct +1
- Relic: #63 Initiating +2

---

## QUESTION 5 OF 10

**Your friends have officially banned you from mentioning a certain name. Then THAT NAME texts. What are you telling the group chat?**

**A.** "Nothing. I blocked the number like I said I would."

- Verdict: HALO +2
- Creature: #34 Decisive +1
- Relic: #47 Boundary-holding +2; #41 Accountability +1; #56 Self-preserving +1

**B.** "I didn't answer. But I'm not going to lie, that was a GOOD message." 😂

- Verdict: TENSION +2
- Creature: #29 Playful +1; #37 Patient +1
- Relic: #56 Self-preserving +1

**C.** "We talked. I'm figuring out whether anything has actually changed."

- Verdict: UNLOCKED +2
- Creature: #5 Direct +1; #26 Verify first +1
- Relic: #43 Reflective +1; #49 Vulnerable +1

**D.** "Before y'all start yelling... I may have made plans."

- Verdict: BAD_DECISION +2
- Creature: #2 Spontaneous +1; #29 Playful +1
- Relic: #63 Initiating +1; #42 Defensiveness +1

---

## QUESTION 6 OF 10

**You swore you were keeping things casual. Then they send a voice note saying your name a CERTAIN way. What happens?**

**A.** Play it again. That's all. I do have some self-control.

- Verdict: TENSION +2
- Creature: #29 Playful +1; #37 Patient +1
- Relic: #56 Self-preserving +1

**B.** I pause. This sounds suspiciously like the beginning of something I promised to avoid.

- Verdict: HALO +2
- Creature: #26 Verify first +1; #17 Practical +1
- Relic: #56 Self-preserving +2; #47 Boundary-holding +1

**C.** I admit I like them more than I originally planned to.

- Verdict: UNLOCKED +2
- Creature: #5 Direct +1; #19 Sentimental +1
- Relic: #49 Vulnerable +2; #43 Reflective +1

**D.** I send one back. The whole "keeping it casual" agreement is apparently under review. 😭

- Verdict: BAD_DECISION +2; TENSION +1
- Creature: #2 Spontaneous +1; #29 Playful +1; #5 Direct +1
- Relic: #63 Initiating +2; #44 Reactive +1

---

## QUESTION 7 OF 10

**Someone you've been seeing says, "You're SO different when it's just us." What's the real reason?**

**A.** I don't share every side of myself with everybody. When I trust someone, I'm much more open.

- Verdict: UNLOCKED +3
- Creature: #35 Private +2; #13 Independent +1
- Relic: #47 Boundary-holding +2; #49 Vulnerable +1

**B.** I can flirt all day, then suddenly get shy when it actually matters.

- Verdict: TENSION +2; UNLOCKED +1
- Creature: #29 Playful +1; #35 Private +1
- Relic: No confident award

**C.** I'm pretty much the same. What you see is what you get.

- Verdict: HALO +2
- Creature: #36 Open +2
- Relic: #45 Self-secure +1

**D.** Because private me has been known to make a few questionable suggestions. 👀

- Verdict: BAD_DECISION +1; UNLOCKED +2
- Creature: #35 Private +1; #29 Playful +1
- Relic: #63 Initiating +1

---

## QUESTION 8 OF 10

**It's 1 a.m. You're dressed to go home. They say, "Come back upstairs for five minutes." You KNOW five minutes is fiction. Now what?**

**A.** I go home. Tomorrow already has enough responsibilities.

- Verdict: HALO +2
- Creature: #17 Practical +1; #1 Planner +1
- Relic: #55 Duty-first +1; #56 Self-preserving +2

**B.** I stand by the door, smile, and make them work for one more minute.

- Verdict: TENSION +2
- Creature: #29 Playful +2; #37 Patient +1
- Relic: #64 Responsive +1

**C.** "Tell me what you're hoping those five minutes turn into."

- Verdict: UNLOCKED +2
- Creature: #5 Direct +2; #26 Verify first +1; #29 Playful +1
- Relic: #47 Boundary-holding +1

**D.** I turn around. The rideshare can file a complaint. 😭

- Verdict: BAD_DECISION +3
- Creature: #2 Spontaneous +2; #11 Adventurous +1
- Relic: #63 Initiating +1; #44 Reactive +1

---

## QUESTION 9 OF 10

**Which thing has gotten you into the MOST trouble in relationships or situationships?**

**A.** Giving someone one last chance because I missed how things used to feel.

- Verdict: BAD_DECISION +2; UNLOCKED +1
- Creature: #19 Sentimental +2; #27 Forgiving +1
- Relic: #49 Vulnerable +1; #43 Reflective +1

**B.** Taking too long to say what I want because flirting feels safer.

- Verdict: TENSION +2
- Creature: #6 Indirect +2; #29 Playful +1
- Relic: #50 Armored +1

**C.** Keeping too much to myself until the other person feels shut out.

- Verdict: UNLOCKED +2
- Creature: #35 Private +2
- Relic: #50 Armored +1; #43 Reflective +1

**D.** Noticing red flags, then convincing myself they're just decorations. 😭

- Verdict: BAD_DECISION +3
- Creature: #18 Idealistic +1; #11 Adventurous +1
- Relic: #42 Defensiveness +1

---

## QUESTION 10 OF 10

**You're staring at a text that could reopen an entire chapter. It's not dangerous, just MESSY. You already know the likely consequences. What do you do?**

**A.** Delete it, put the phone down, and let tomorrow-me send a thank-you note.

- Verdict: HALO +2
- Creature: #1 Planner +1; #17 Practical +1; #34 Decisive +1
- Relic: #56 Self-preserving +2; #47 Boundary-holding +2

**B.** Rewrite it into something flirtier and less revealing. I'm testing the waters.

- Verdict: TENSION +2
- Creature: #6 Indirect +2; #29 Playful +1
- Relic: #50 Armored +1

**C.** Send an honest message about what I actually want. No games this time.

- Verdict: UNLOCKED +2
- Creature: #5 Direct +2; #34 Decisive +1
- Relic: #49 Vulnerable +2; #63 Initiating +1

**D.** Hit send. Read it back. Whisper, "Oh, I have made a choice." 😭

- Verdict: BAD_DECISION +3
- Creature: #2 Spontaneous +2; #38 Urgent +1; #34 Decisive +1
- Relic: #63 Initiating +2; #44 Reactive +1

---

# THE FOUR PRIVATE REVEALS

## RESULT 1: 😇 THE HALO STAYS ON. MOSTLY.

**THE VERDICT**

You like a little heat. You just refuse to become the cautionary tale.

**THE PRIVATE READ**

You can enjoy chemistry, attention, and the occasional dangerous-looking text without automatically reopening a door you worked hard to close. You know temptation doesn't always deserve a response. Some chapters were entertaining. That doesn't mean they need a sequel.

**THE CALL-OUT**

Being careful is smart. Just don't confuse protecting your peace with refusing to take any emotional risks.

**THE COST**

You might pass on something genuinely good because it reminds you of something that went badly.

**TRY THIS**

Notice the difference between a real red flag and an unfamiliar feeling. One deserves caution. The other might deserve curiosity.

**THE KICKER**

You looked at the text, considered the consequences, and went to bed. The character development! 👏

*Apparently, your halo has seen things.*

**YOUR TRAITS**

Selective · Self-Controlled · Boundary-Aware

---

## RESULT 2: 😏 YOU LIKE THE TENSION MORE THAN THE TROUBLE.

**THE VERDICT**

You could turn eye contact into an entire event. And frankly, you enjoy the production.

**THE PRIVATE READ**

You like the buildup. The clever texts. The glances from across the room. That moment when both people know there's chemistry but nobody has said the obvious thing yet. You're not necessarily trying to start trouble. You just think anticipation deserves its own season.

**THE CALL-OUT**

Sometimes the flirtation is so elaborate nobody knows whether you're actually interested.

**THE COST**

You can spend so much time enjoying the possibility that the opportunity eventually walks away.

**TRY THIS**

Next time you actually want something to happen, replace one hint with a sentence that cannot be mistaken for friendly banter.

**THE KICKER**

Twenty-seven messages, six inside jokes, two lingering looks. Still no actual plan. 😭

*Apparently, you treat chemistry like a slow-burn television series.*

**YOUR TRAITS**

Playful · Teasing · Anticipation-Loving

---

## RESULT 3: 😈 YOU HAVE A SIDE PEOPLE HAVE TO UNLOCK.

**THE VERDICT**

Public you got the trailer. Somebody special might get the director's cut. 👀

**THE PRIVATE READ**

You're selective about what you reveal and to whom. People who know you casually might be genuinely surprised by how expressive, affectionate, playful, or bold you become when you're comfortable. The private version of you isn't fake. It's simply not available to everybody.

**THE CALL-OUT**

Privacy is attractive. Making someone solve seventeen riddles to understand your feelings is exhausting.

**THE COST**

Someone who genuinely wants to get closer may never know whether you're inviting them in or politely keeping them outside.

**TRY THIS**

When someone has earned your trust, give them one honest clue about what you actually want instead of waiting for them to guess.

**THE KICKER**

The after-dark version exists. Access is invitation-only.

*Apparently, your personality has a very exclusive guest list.*

**YOUR TRAITS**

Private · Expressive · Selectively Vulnerable

---

## RESULT 4: 🔥 YOU ARE THE BAD DECISION.

**THE VERDICT**

You see the red flag, decide it's a lovely shade of burgundy, and text back anyway. 😭

**THE PRIVATE READ**

You know when there's chemistry. You also tend to know when a situation could become complicated. The problem is that sometimes your curiosity, attraction, or nostalgia gets a vote before your better judgment has finished speaking. You're not clueless. Occasionally, you're just extremely persuasive when talking yourself into something you already questioned.

**THE CALL-OUT**

Chemistry is not a background check. Missing someone is not proof that anything changed.

**THE COST**

One electric night can produce three weeks of emotional paperwork and a group chat investigation.

**TRY THIS**

Before reopening a chapter, ask yourself: "What's actually different this time, besides the fact that I miss the plot?"

**THE KICKER**

You said "never again." Apparently there were terms and conditions. 😂

*Apparently, trouble still has your number.*

**YOUR TRAITS**

Bold · Impulsive · Temptation-Prone

---

# SCORING AND CONFIDENCE RULES

**Internal result IDs:**

- HALO = `halo`
- TENSION = `tension`
- UNLOCKED = `unlocked`
- BAD_DECISION = `bad_decision`

**BAD_DECISION hard gate:** Minimum four distinct supporting answers, including at least one active-pursuit signal from Q1D, Q2D, Q4D, Q5D, Q6D, Q8D, or Q10D, and at least **three** high-confidence messy-decision signals from Q1D, Q5D, Q8D, Q9D, or Q10D.

This ensures a user doesn't earn "YOU ARE THE BAD DECISION" merely for flirting, initiating, expressing desire, or being sexually confident. There must be a repeated pattern of pursuing something despite recognizing possible complications.

**UNLOCKED gate:** At least three distinct supporting answers, including at least one from Q3A, Q5C, Q7A, Q8C, Q9C, or Q10C.

HALO and TENSION are ungated.

**Tie order:** Highest eligible total → high-signal contributions from Q2, Q3, Q5, Q7, Q8, Q9, Q10 → most full +2 primary selections → HALO, TENSION, UNLOCKED, BAD_DECISION.

**Permanent personality scoring:** Each answer's approved numeric Creature and Relic awards are independent of verdict scoring. The number of awards is not capped. No result title, joke, or display-only trait earns permanent evidence.

**Reachability fixtures, Q1–Q10:**

- HALO: B, B, B, B, B, B, C, A, A, A
- TENSION: A, A, A, C, B, B, B, B, B, B
- UNLOCKED: C, C, A, C, C, C, A, C, C, C
- BAD_DECISION: D, D, D, D, D, D, D, D, D, D

All four outcomes were confirmed using the actual app's archetype scoring function and the revised eligibility rules. No close-second result is enabled.

**18+ restriction:** Retain the existing server-enforced age eligibility and Apparently Private subscription requirements. The mature theme itself does not create personality awards.

---

# SOURCE FILE: 03_THREE_NEW_PREMIUM_OWNER_APPROVED.md

**Source description:** Premium batch 1: love-soulmates-become; shadow-side-hypocrisy; private-private-proof

**Current editorial status: OWNER-APPROVED AND LOCKED (November 1, 2026). Implementation and production rollout are separate actions.**

# APPARENTLY PRIVATE | FIRST THREE NEW QUIZZES
**OWNER-APPROVED EDITORIAL SOURCE · v1.0 · NOVEMBER 1, 2026**

**IN THIS PACKET:** 1. *What Do You Become When You Really Like Somebody?* (Love & Soulmates)  ·  2. *What Are You Doing That You Swear You Hate?* (Shadow Side)  ·  3. *Do You Want Sex... or Proof?* (Private Private, 18+)

**STATUS: OWNER APPROVED AND LOCKED. App implementation and deployment are separate and have not been verified by this content document.**

This packet contains all three full quizzes: 30 questions, 150 answer choices, 15 complete outcome reveals, category-verdict scores, numeric Core/Creature and Private/Relic awards for every answer, hard-result eligibility, tie rules, and reachability answer fixtures.

**Core format:** 10 questions / five options each; each option appears under A–E. Distinct outcome voices rotate through the letters so the same psychological pattern is not always Choice D or E. Each answer has separate verdict points and evidence awards. No cap exists on the number of trait awards per answer; the authored choices below carry only traits genuinely supported by that behavior. Display-only reveal tags never award profile evidence.

**Locked answer-only scoring:** These owner-approved positive-only per-answer mappings use frozen numeric trait IDs 1–64 and are earned directly from selected answers at +1/+2/+3. No other personality-scoring layer exists. Quiz-result weights select the reveal only and give ZERO extra points. Preserve first-completion protection, semantic content identity, historical user data, age/subscriber gates and noncontradictory trait poles.

**Shared result section order:** TITLE → THE VERDICT → THE PRIVATE READ → THE CALL-OUT → THE COST → TRY THIS → THE KICKER → *Apparently,* signature → YOUR TRAITS.

---
# QUIZ 1: What Do You Become When You Really Like Somebody?
**Category:** Love & Soulmates  
**Quiz ID:** `love-soulmates-become`  
**10 questions · 5 answers per question · About 3–4 minutes**  
**Eyebrow:** APPARENTLY PRIVATE · LOVE & SOULMATES  
**Subtitle:** Crushes have a funny way of introducing people to themselves.  
**Support:** The texts. The overthinking. The disappearing personality. We are checking what attraction does to your behavior, not what you claim to be like when you are calm.  
**Small print:** Answer for what you actually do, not the emotionally evolved version of you in your imagination.  
**CTA:** Clock my crush behavior →

## THE COMPLETE QUESTIONS, VERDICT WEIGHTS, AND PERSONALITY EVIDENCE

### QUESTION 1 OF 10
**They suggest a restaurant you genuinely dislike. Your actual response?**

**A.** “Not my favorite. Want to try the place across the street?”
- **Verdict:** STEADY +2
- **Creature/Core:** #5 Direct +2; #17 Practical +1
- **Relic/Private:** #45 Self-secure +1; #47 Boundary-holding +1

**B.** “I have a better idea. Let me make the reservation.”
- **Verdict:** BOLD +2
- **Creature/Core:** #5 Direct +1; #34 Decisive +1
- **Relic/Private:** #63 Initiating +2; #45 Self-secure +1

**C.** “Either is fine.” I will quietly hope they somehow guess my favorite.
- **Verdict:** GUARDED +2
- **Creature/Core:** #6 Indirect +2; #35 Private +1
- **Relic/Private:** #50 Armored +1; #64 Responsive +1

**D.** I agree, then privately worry that disagreeing would make them less interested.
- **Verdict:** NEEDY +2
- **Creature/Core:** #7 Vibe checker +1; #6 Indirect +1
- **Relic/Private:** #46 Reassurance-seeking +2; #48 Approval-seeking +1

**E.** “I LOVE that place.” I absolutely do not. But they seem excited.
- **Verdict:** PICKME +2
- **Creature/Core:** #6 Indirect +2; #14 Collaborative +1
- **Relic/Private:** #48 Approval-seeking +2; #50 Armored +1

### QUESTION 2 OF 10
**They take four hours to reply after a really good date. What happens during hour three?**

**A.** I send one honest “I had fun” message, then leave it there.
- **Verdict:** BOLD +2
- **Creature/Core:** #5 Direct +1; #34 Decisive +1
- **Relic/Private:** #63 Initiating +1; #49 Vulnerable +1

**B.** I draft a reply in my head, then decide to look much less interested.
- **Verdict:** GUARDED +2
- **Creature/Core:** #35 Private +2; #6 Indirect +1
- **Relic/Private:** #50 Armored +2; #56 Self-preserving +1

**C.** I check their activity, reread the date, and wonder what changed.
- **Verdict:** NEEDY +3
- **Creature/Core:** #7 Vibe checker +2; #3 Emotionally Intense +1
- **Relic/Private:** #46 Reassurance-seeking +3; #44 Reactive +1

**D.** I consider sending something they would find funnier, hotter, or more impressive.
- **Verdict:** PICKME +2
- **Creature/Core:** #7 Vibe checker +1; #29 Playful +1
- **Relic/Private:** #48 Approval-seeking +2; #46 Reassurance-seeking +1

**E.** I notice. Then I get on with whatever I was doing.
- **Verdict:** STEADY +2
- **Creature/Core:** #4 Even-Keeled +2; #37 Patient +1
- **Relic/Private:** #45 Self-secure +2; #43 Reflective +1

### QUESTION 3 OF 10
**Your crush mentions a hobby you know nothing about. Your first instinct?**

**A.** Listen closely, but keep my own interests mostly to myself.
- **Verdict:** GUARDED +2
- **Creature/Core:** #7 Vibe checker +1; #35 Private +2
- **Relic/Private:** #50 Armored +1

**B.** Wonder whether they would prefer someone who already shares that hobby.
- **Verdict:** NEEDY +2
- **Creature/Core:** #3 Emotionally Intense +1; #7 Vibe checker +1
- **Relic/Private:** #46 Reassurance-seeking +2; #48 Approval-seeking +1

**C.** “Wait, I am OBSESSED with that too.” I learned about it 14 seconds ago.
- **Verdict:** PICKME +3
- **Creature/Core:** #6 Indirect +2; #18 Idealistic +1
- **Relic/Private:** #48 Approval-seeking +3; #42 Defensiveness +1

**D.** Ask about it because I am curious, not because I need a new personality.
- **Verdict:** STEADY +2
- **Creature/Core:** #33 Curious +2; #5 Direct +1
- **Relic/Private:** #45 Self-secure +1

**E.** Suggest we try it together. I am interested in the person, not auditioning.
- **Verdict:** BOLD +2
- **Creature/Core:** #11 Adventurous +1; #5 Direct +1
- **Relic/Private:** #63 Initiating +2; #49 Vulnerable +1

### QUESTION 4 OF 10
**You were looking forward to seeing them, but they cancel for a legitimate reason. You...**

**A.** Ask if everything is okay between us, even though they explained the reason.
- **Verdict:** NEEDY +3
- **Creature/Core:** #3 Emotionally Intense +1; #7 Vibe checker +1
- **Relic/Private:** #46 Reassurance-seeking +3; #44 Reactive +1

**B.** Offer to rearrange three other commitments so they will still see me.
- **Verdict:** PICKME +3
- **Creature/Core:** #14 Collaborative +1; #16 Let it play out +1
- **Relic/Private:** #48 Approval-seeking +3; #55 Duty-first +1

**C.** Say no worries, reschedule if we both want to, and keep my evening.
- **Verdict:** STEADY +2
- **Creature/Core:** #4 Even-Keeled +2; #17 Practical +1
- **Relic/Private:** #45 Self-secure +2; #47 Boundary-holding +1

**D.** Tell them I was disappointed and offer a different day.
- **Verdict:** BOLD +2
- **Creature/Core:** #5 Direct +2; #37 Patient +1
- **Relic/Private:** #49 Vulnerable +1; #63 Initiating +1

**E.** Say “all good,” then decide they will have to initiate everything now.
- **Verdict:** GUARDED +2
- **Creature/Core:** #35 Private +1; #28 Holds the Receipt +1
- **Relic/Private:** #50 Armored +2; #56 Self-preserving +1

### QUESTION 5 OF 10
**Your best friend says, “You have been acting different since you met them.” You think...**

**A.** I get defensive. My friend is noticing the things I stopped doing for myself.
- **Verdict:** PICKME +2
- **Creature/Core:** #6 Indirect +1; #15 Control +1
- **Relic/Private:** #42 Defensiveness +2; #48 Approval-seeking +2

**B.** “Have I? Tell me what you have noticed.”
- **Verdict:** STEADY +2
- **Creature/Core:** #33 Curious +1; #5 Direct +1
- **Relic/Private:** #43 Reflective +2; #41 Accountability +1

**C.** “I am excited! But tell me if I have been neglecting our plans.”
- **Verdict:** BOLD +2
- **Creature/Core:** #36 Open +1; #5 Direct +1
- **Relic/Private:** #41 Accountability +1; #61 Perspective-taking +1

**D.** They cannot possibly know. I have been trying so hard to act normal.
- **Verdict:** GUARDED +2
- **Creature/Core:** #35 Private +1; #15 Control +1
- **Relic/Private:** #50 Armored +2

**E.** I start worrying my crush must be noticing something wrong with me too.
- **Verdict:** NEEDY +2
- **Creature/Core:** #3 Emotionally Intense +1; #7 Vibe checker +1
- **Relic/Private:** #46 Reassurance-seeking +2; #62 Self-referencing +1

### QUESTION 6 OF 10
**They say they want to take things slowly. Your honest reaction?**

**A.** “Works for me if we are both clear about what that means.”
- **Verdict:** STEADY +2
- **Creature/Core:** #37 Patient +2; #5 Direct +1
- **Relic/Private:** #45 Self-secure +1; #47 Boundary-holding +1

**B.** “I like you. Here is what I am comfortable with. What about you?”
- **Verdict:** BOLD +2
- **Creature/Core:** #5 Direct +2; #34 Decisive +1
- **Relic/Private:** #49 Vulnerable +2; #63 Initiating +1

**C.** Great. Now I can pretend this matters less than it does.
- **Verdict:** GUARDED +2
- **Creature/Core:** #35 Private +2; #6 Indirect +1
- **Relic/Private:** #50 Armored +2

**D.** I hear “slowly” as “they are about to leave” and need them to explain it again.
- **Verdict:** NEEDY +2
- **Creature/Core:** #3 Emotionally Intense +2; #38 Urgent +1
- **Relic/Private:** #46 Reassurance-seeking +3; #44 Reactive +1

**E.** “Whatever pace YOU want.” Even if it is definitely not mine.
- **Verdict:** PICKME +2
- **Creature/Core:** #6 Indirect +2; #16 Let it play out +1
- **Relic/Private:** #48 Approval-seeking +3; #50 Armored +1

### QUESTION 7 OF 10
**Their close friend is attractive, funny, and clearly comfortable around them. You...**

**A.** Introduce myself and enjoy meeting someone important to them.
- **Verdict:** BOLD +2
- **Creature/Core:** #36 Open +1; #5 Direct +1
- **Relic/Private:** #63 Initiating +1; #45 Self-secure +1

**B.** Become quieter. I would rather watch than admit I feel awkward.
- **Verdict:** GUARDED +2
- **Creature/Core:** #35 Private +1; #7 Vibe checker +2
- **Relic/Private:** #50 Armored +2

**C.** Compare myself immediately and later fish for reassurance about that friend.
- **Verdict:** NEEDY +3
- **Creature/Core:** #31 Competitive +1; #3 Emotionally Intense +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +1

**D.** Start competing to be the funniest, coolest, easiest person in the room.
- **Verdict:** PICKME +3
- **Creature/Core:** #31 Competitive +2; #29 Playful +1
- **Relic/Private:** #48 Approval-seeking +3; #62 Self-referencing +1

**E.** Notice it, but do not manufacture a rivalry from ordinary friendship.
- **Verdict:** STEADY +2
- **Creature/Core:** #4 Even-Keeled +2; #25 Trust first +1
- **Relic/Private:** #45 Self-secure +2; #61 Perspective-taking +1

### QUESTION 8 OF 10
**They ask what you want from this connection. You actually say...**

**A.** “Nothing serious, I guess.” I am lying to both of us.
- **Verdict:** GUARDED +2
- **Creature/Core:** #6 Indirect +2; #35 Private +1
- **Relic/Private:** #50 Armored +2

**B.** “Do you still like me?” That question gets there before my actual answer.
- **Verdict:** NEEDY +3
- **Creature/Core:** #3 Emotionally Intense +2; #38 Urgent +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +1

**C.** “Honestly, whatever you want.” I have a real answer; I just hide it.
- **Verdict:** PICKME +3
- **Creature/Core:** #6 Indirect +2; #16 Let it play out +1
- **Relic/Private:** #48 Approval-seeking +3; #50 Armored +1

**D.** What I want, even if it means we might not be compatible.
- **Verdict:** STEADY +2
- **Creature/Core:** #5 Direct +2; #17 Practical +1
- **Relic/Private:** #45 Self-secure +2; #47 Boundary-holding +1

**E.** “I like you. I want to see where this could genuinely go.”
- **Verdict:** BOLD +2
- **Creature/Core:** #5 Direct +2; #36 Open +1
- **Relic/Private:** #49 Vulnerable +2; #63 Initiating +1

### QUESTION 9 OF 10
**You disagree with them about something that matters to you. What happens?**

**A.** I backpedal, then need them to reassure me that disagreeing did not ruin things.
- **Verdict:** NEEDY +2
- **Creature/Core:** #6 Indirect +1; #3 Emotionally Intense +1
- **Relic/Private:** #46 Reassurance-seeking +3; #48 Approval-seeking +1

**B.** I suddenly “see their point” because I do not want to risk looking difficult.
- **Verdict:** PICKME +3
- **Creature/Core:** #6 Indirect +2; #16 Let it play out +1
- **Relic/Private:** #48 Approval-seeking +3; #50 Armored +1

**C.** I explain my view and listen to theirs. Agreement is not the price of liking me.
- **Verdict:** STEADY +2
- **Creature/Core:** #5 Direct +1; #14 Collaborative +1
- **Relic/Private:** #45 Self-secure +2; #61 Perspective-taking +1

**D.** I bring it up early. Better to know whether we can handle a real conversation.
- **Verdict:** BOLD +2
- **Creature/Core:** #23 Conflict-forward +1; #5 Direct +2
- **Relic/Private:** #63 Initiating +1; #49 Vulnerable +1

**E.** I file it away and go quieter. They can guess that something changed.
- **Verdict:** GUARDED +2
- **Creature/Core:** #35 Private +1; #28 Holds the Receipt +1
- **Relic/Private:** #50 Armored +2; #52 Punishing +1

### QUESTION 10 OF 10
**Finish this sentence honestly: “When I really like somebody, I tend to...”**

**A.** Become the person I think they would choose over everybody else.
- **Verdict:** PICKME +3
- **Creature/Core:** #31 Competitive +1; #6 Indirect +1
- **Relic/Private:** #48 Approval-seeking +3; #50 Armored +1

**B.** Make space for them without evicting myself.
- **Verdict:** STEADY +2
- **Creature/Core:** #13 Independent +2; #17 Practical +1
- **Relic/Private:** #45 Self-secure +2; #47 Boundary-holding +1

**C.** Let them know, because mixed signals bore me.
- **Verdict:** BOLD +2
- **Creature/Core:** #5 Direct +2; #34 Decisive +1
- **Relic/Private:** #63 Initiating +2; #49 Vulnerable +1

**D.** Hide my hand until I am absolutely sure they are showing theirs.
- **Verdict:** GUARDED +2
- **Creature/Core:** #35 Private +2; #26 Verify first +1
- **Relic/Private:** #50 Armored +2; #56 Self-preserving +1

**E.** Need new proof they are interested, even after they have already shown me.
- **Verdict:** NEEDY +3
- **Creature/Core:** #3 Emotionally Intense +1; #7 Vibe checker +1
- **Relic/Private:** #46 Reassurance-seeking +3; #44 Reactive +1

## ALL FIVE FULL PRIVATE REVEALS

### YOU LIKE THEM. YOU STILL REMEMBER WHO YOU ARE.
**Internal outcome ID:** `steady`

**THE VERDICT**
Attraction has entered the chat. Your entire personality has not left the building.

**THE PRIVATE READ**
You can be excited by somebody without rearranging your schedule, standards, opinions, and sense of worth around them. Your answers suggest you can make room for a connection while keeping your own life intact. You notice whether interest is mutual, speak up when something matters, and let an unanswered text remain just an unanswered text.

**THE CALL-OUT**
Your composure is not proof that you never get nervous. It is proof that you do not hand every nervous feeling the steering wheel.

**THE COST**
You may occasionally underestimate how reassuring a direct sign of interest can be. Being steady should not become being unreadable.

**TRY THIS**
Tell the person one thing you genuinely enjoy about them. No strategy, no performance, no three-day waiting period.

**THE KICKER**
You caught feelings. Your calendar survived.

*Apparently, you can have a crush without filing a missing-person report on yourself.*

**YOUR TRAITS (display only):** Grounded · Self-Respecting · Open to Connection

### YOU MAKE THE FIRST MOVE. NO SECRET COMMITTEE REQUIRED.
**Internal outcome ID:** `bold`

**THE VERDICT**
When you like somebody, you tend to let them know. Shocking behavior in this economy.

**THE PRIVATE READ**
You flirt, initiate, make plans, and say the warm thing while it still matters. You are not above nerves. You simply refuse to turn every possible rejection into a three-month research project. Your answers show an appetite for mutuality rather than endless guessing.

**THE CALL-OUT**
Being brave is attractive. But if you are always the one starting everything, check whether the other person is showing up too. A connection is not a solo performance.

**THE COST**
Your momentum can keep you invested in a person who enjoys being pursued more than participating.

**TRY THIS**
Make one clear invitation, then leave room for an equally clear answer and reciprocal effort.

**THE KICKER**
You sent the text. The world continued spinning.

*Apparently, your romantic strategy includes actually communicating.*

**YOUR TRAITS (display only):** Direct · Initiating · Courageous

### YOU ACT UNBOTHERED. YOU ARE VERY BOTHERED.
**Internal outcome ID:** `guarded`

**THE VERDICT**
Your heart is running a full production. Your face has denied the project exists.

**THE PRIVATE READ**
You are careful with your enthusiasm. When someone matters, you may pull back, rehearse your replies, or wait for them to show their hand first. You can genuinely feel a lot while giving the other person remarkably little to work with. The distance protects you from embarrassment, but it also hides your interest.

**THE CALL-OUT**
You keep calling it playing it cool. Sometimes it is fear of being seen wanting something.

**THE COST**
Someone who likes you may conclude you are not interested and stop trying. They cannot respond to feelings they were never allowed to see.

**TRY THIS**
Offer one unambiguous sign of interest. Not a cryptic emoji. A sentence.

**THE KICKER**
You checked their story six times and still replied “haha.”

*Apparently, your feelings have a password-protected guest entrance.*

**YOUR TRAITS (display only):** Guarded · Observant · Slow to Reveal

### NEEDY. THERE, WE SAID IT.
**Internal outcome ID:** `needy`

**THE VERDICT**
You do not just like attention. You keep needing confirmation that you have not lost it.

**THE PRIVATE READ**
Your answers describe a repeated pattern: the reply takes too long, the tone feels different, or the person makes ordinary plans without you, and suddenly the relationship is on trial. You look for signs, request reassurance, and feel settled only until the next uncertain moment. This is not about wanting affection. It is about making somebody continuously prove what they already told you.

**THE CALL-OUT**
Your insecurity is becoming another person’s full-time assignment. Their phone is not a heart monitor for your self-worth.

**THE COST**
They can sincerely like you and still become exhausted by the constant checking, testing, and emotional emergencies.

**TRY THIS**
When anxiety spikes, wait before sending the second interrogation text. Name what you fear privately, then ask one honest question if the concern remains.

**THE KICKER**
They went grocery shopping. You opened a case file.

*Apparently, your reassurance plan has no expiration date.*

**YOUR TRAITS (display only):** Reassurance-Hungry · Hypervigilant · Emotionally Reactive

### PICK-ME. AND IT SHOWS.
**Internal outcome ID:** `pickme`

**THE VERDICT**
You are not dating them yet. You are already campaigning for the position.

**THE PRIVATE READ**
Your answers show you editing your preferences, canceling your own plans, and swallowing objections to look like the easiest person to choose. You become whatever seems most appealing to them, then call the performance chemistry. You might even resent them later for liking the version of you that you introduced.

**THE CALL-OUT**
You keep volunteering to disappear and hoping somebody will call it love. Being chosen is not an achievement if you had to erase yourself to qualify.

**THE COST**
You can win someone’s attention while training them to overlook your needs, because you taught them those needs were negotiable.

**TRY THIS**
Name one preference you would normally hide. Say it plainly, then watch whether this connection can make room for the real you.

**THE KICKER**
You said you love hiking. You own one pair of shoes and they are slippers.

*Apparently, your crush met your public-relations department first.*

**YOUR TRAITS (display only):** Approval-Seeking · Self-Editing · Overaccommodating

## OWNER-APPROVED EDITORIAL SCORING (ENGINEERING QA PENDING)

**Verdict identity:** The five result IDs shown above are editorial outcome labels, never additional permanent personality traits. A primary selection adds +2 verdict points (or +3 on marked high-confidence choices). The label and its Core/Private evidence are independent.

**High-signal questions for tie resolution:** Q2, Q3, Q5, Q7, Q8, Q9, Q10.

- **NEEDY hard gate:** At least 4 distinct primary supporting answers, including at least 3 answers from the marked high-confidence set of question positions: Q2, Q4, Q7, Q8, Q10. These must be the actual primary choices for this verdict, not just secondary weights or trait awards. The eligible outcome must still win the score/tie decision.
- **PICKME hard gate:** At least 4 distinct primary supporting answers, including at least 3 answers from the marked high-confidence set of question positions: Q3, Q4, Q7, Q8, Q9, Q10. These must be the actual primary choices for this verdict, not just secondary weights or trait awards. The eligible outcome must still win the score/tie decision.

**Other outcomes:** No accusation-specific gate. If a harsh candidate fails its gate, exclude it and choose the highest eligible alternative. Never report a harsh title solely because of a single revealing answer.

**Tie resolution:** Highest eligible total → highest total from high-signal questions → most primary +2/+3 selections → fixed fallback STEADY → BOLD → GUARDED → NEEDY → PICKME. No close-second verdict.

**First-completion and numeric-trait rules:** Positive-only +1, +2, or +3 awards for explicitly mapped Core IDs 1–40 and Private IDs 41–64. No arbitrarily limited number of awards per answer. No opposite poles of the same dimension in one choice. No awards from title, verdict, humor, or display tags. Only the first qualifying versioned completion may affect permanent evidence. Retakes never inflate totals.

**Representative outcome reachability fixtures** (letters in Q1→Q10 order; checked using the packet’s proposed transparent point/gate model, not yet against Claude’s production engine):
- **STEADY:** A, E, D, C, B, A, E, D, C, B → STEADY (verdict 20 pts; 10 supporting selections; 0 gate-group selections)
- **BOLD:** B, A, E, D, C, B, A, E, D, C → BOLD (verdict 20 pts; 10 supporting selections; 0 gate-group selections)
- **GUARDED:** C, B, A, E, D, C, B, A, E, D → GUARDED (verdict 20 pts; 10 supporting selections; 0 gate-group selections)
- **NEEDY:** D, C, B, A, E, D, C, B, A, E → NEEDY (verdict 25 pts; 10 supporting selections; 5 gate-group selections)
- **PICKME:** E, D, C, B, A, E, D, C, B, A → PICKME (verdict 26 pts; 10 supporting selections; 6 gate-group selections)

**QA still required before activation:** Exact TypeScript/server SQL scoring parity, true gate-group implementation, exhaustive reachability boundary tests, fingerprints/versioned historical completion behavior, trait-award migration reconciliation, authoritative entitlement checks, and the 18+ backend restriction for Private Private. No sign-off inferred.

---
# QUIZ 2: What Are You Doing That You Swear You Hate?
**Category:** Shadow Side  
**Quiz ID:** `shadow-side-hypocrisy`  
**10 questions · 5 answers per question · About 3–4 minutes**  
**Eyebrow:** APPARENTLY PRIVATE · SHADOW SIDE  
**Subtitle:** The hypocrisy audit has entered the chat. 👀  
**Support:** You have standards. Strong opinions. Pet peeves. We have one small question: do those rules also apply when you are the person breaking them?  
**Small print:** Choose what you actually do on your worst ordinary Tuesday, not what you would defend in court.  
**CTA:** Audit me →

## THE COMPLETE QUESTIONS, VERDICT WEIGHTS, AND PERSONALITY EVIDENCE

### QUESTION 1 OF 10
**You are furious when people arrive late. Today YOU are running twenty minutes behind. What message goes out?**

**A.** “I am late. I am sorry. Start without me.”
- **Verdict:** CONSISTENT +2
- **Creature/Core:** #5 Direct +2; #17 Practical +1
- **Relic/Private:** #41 Accountability +2; #61 Perspective-taking +1

**B.** “I owe you an apology. I complain about this when others do it.”
- **Verdict:** OWNS +2
- **Creature/Core:** #5 Direct +1; #33 Curious +1
- **Relic/Private:** #41 Accountability +2; #43 Reflective +1

**C.** “Traffic was unreal.” I leave out that I also left late.
- **Verdict:** RATIONALIZES +2
- **Creature/Core:** #6 Indirect +1; #17 Practical +1
- **Relic/Private:** #42 Defensiveness +2; #50 Armored +1

**D.** I expect grace, then lecture someone else next week for being ten minutes late.
- **Verdict:** HYPOCRITE +3
- **Creature/Core:** #15 Control +1; #28 Holds the Receipt +1
- **Relic/Private:** #42 Defensiveness +2; #62 Self-referencing +1

**E.** They can wait. I already had enough to deal with today.
- **Verdict:** SELFISH +2
- **Creature/Core:** #15 Control +1
- **Relic/Private:** #62 Self-referencing +2; #56 Self-preserving +1

### QUESTION 2 OF 10
**You hate when people cancel last-minute. Then you get a better invitation on the same night. You...**

**A.** Feel tempted, then admit I would hate this if someone did it to me.
- **Verdict:** OWNS +2
- **Creature/Core:** #17 Practical +1; #33 Curious +1
- **Relic/Private:** #43 Reflective +2; #61 Perspective-taking +1

**B.** Call my old plan “flexible,” even though we agreed on a time.
- **Verdict:** RATIONALIZES +2
- **Creature/Core:** #6 Indirect +1; #16 Let it play out +1
- **Relic/Private:** #42 Defensiveness +1; #50 Armored +1

**C.** Cancel, then complain bitterly when the same person cancels on me.
- **Verdict:** HYPOCRITE +3
- **Creature/Core:** #28 Holds the Receipt +1; #15 Control +1
- **Relic/Private:** #42 Defensiveness +2; #60 Keeps score +1

**D.** Take the better offer. Their evening is their problem now.
- **Verdict:** SELFISH +3
- **Creature/Core:** #16 Let it play out +1; #34 Decisive +1
- **Relic/Private:** #62 Self-referencing +3; #56 Self-preserving +1

**E.** Keep my first plan or ask to reschedule honestly, with no pressure.
- **Verdict:** CONSISTENT +2
- **Creature/Core:** #1 Planner +1; #5 Direct +1
- **Relic/Private:** #41 Accountability +2; #47 Boundary-holding +1

### QUESTION 3 OF 10
**You say you cannot stand gossip. A delicious piece of information lands in your lap. What happens?**

**A.** I tell one person “for context.” It is still clearly gossip.
- **Verdict:** RATIONALIZES +2
- **Creature/Core:** #6 Indirect +1; #7 Vibe checker +1
- **Relic/Private:** #42 Defensiveness +1; #50 Armored +1

**B.** I share it, then call someone else messy for sharing a similar story.
- **Verdict:** HYPOCRITE +3
- **Creature/Core:** #7 Vibe checker +1; #29 Playful +1
- **Relic/Private:** #42 Defensiveness +2; #62 Self-referencing +1

**C.** I share it when it helps me, but expect everybody to protect my business.
- **Verdict:** SELFISH +3
- **Creature/Core:** #15 Control +1; #35 Private +1
- **Relic/Private:** #62 Self-referencing +2; #60 Keeps score +1

**D.** I do not circulate it just because it is entertaining.
- **Verdict:** CONSISTENT +2
- **Creature/Core:** #21 Rule-oriented +1; #35 Private +1
- **Relic/Private:** #47 Boundary-holding +1; #41 Accountability +1

**E.** I feel tempted to tell somebody, then remember why I hated this last time.
- **Verdict:** OWNS +2
- **Creature/Core:** #7 Vibe checker +1; #33 Curious +1
- **Relic/Private:** #43 Reflective +2; #41 Accountability +1

### QUESTION 4 OF 10
**Someone respectfully tells you, “That thing you said hurt me.” Your first move?**

**A.** Say they are too sensitive, although I demand careful wording from them.
- **Verdict:** HYPOCRITE +3
- **Creature/Core:** #5 Direct +1; #23 Conflict-forward +1
- **Relic/Private:** #54 Blunt +2; #42 Defensiveness +2

**B.** Tell them this is a bad time for their feelings. Mine are the priority today.
- **Verdict:** SELFISH +3
- **Creature/Core:** #15 Control +1; #38 Urgent +1
- **Relic/Private:** #62 Self-referencing +3; #52 Punishing +1

**C.** Ask what landed badly, even if it was not my intention.
- **Verdict:** CONSISTENT +2
- **Creature/Core:** #5 Direct +1; #14 Collaborative +1
- **Relic/Private:** #61 Perspective-taking +2; #41 Accountability +1

**D.** Catch my defensiveness and acknowledge the impact.
- **Verdict:** OWNS +2
- **Creature/Core:** #4 Even-Keeled +1; #33 Curious +1
- **Relic/Private:** #43 Reflective +2; #41 Accountability +2

**E.** Start with three paragraphs about why I said it.
- **Verdict:** RATIONALIZES +2
- **Creature/Core:** #5 Direct +1; #15 Control +1
- **Relic/Private:** #42 Defensiveness +2; #62 Self-referencing +1

### QUESTION 5 OF 10
**You frequently say, “People should pull their weight.” A group task goes sideways. What do you do?**

**A.** Assign the annoying pieces to others and call it “delegating.”
- **Verdict:** SELFISH +3
- **Creature/Core:** #15 Control +2; #1 Planner +1
- **Relic/Private:** #62 Self-referencing +2; #56 Self-preserving +1

**B.** Handle my share and clearly name what is still unassigned.
- **Verdict:** CONSISTENT +2
- **Creature/Core:** #1 Planner +1; #17 Practical +2
- **Relic/Private:** #55 Duty-first +2; #41 Accountability +1

**C.** Notice I dropped something, tell the group, and fix it.
- **Verdict:** OWNS +2
- **Creature/Core:** #5 Direct +1; #34 Decisive +1
- **Relic/Private:** #41 Accountability +3; #51 Repair-oriented +1

**D.** Explain how much other invisible work I have already done.
- **Verdict:** RATIONALIZES +2
- **Creature/Core:** #15 Control +1; #5 Direct +1
- **Relic/Private:** #42 Defensiveness +1; #60 Keeps score +1

**E.** Keep a detailed count of their missed tasks while skipping my own.
- **Verdict:** HYPOCRITE +2
- **Creature/Core:** #28 Holds the Receipt +1; #15 Control +1
- **Relic/Private:** #60 Keeps score +2; #42 Defensiveness +2

### QUESTION 6 OF 10
**You tell everyone not to be judgmental. Then a friend makes a choice you would never make. You...**

**A.** Ask how they reached it and respect that their life is theirs.
- **Verdict:** CONSISTENT +2
- **Creature/Core:** #33 Curious +1; #10 Hands-off +1
- **Relic/Private:** #61 Perspective-taking +2; #57 Supportive +1

**B.** Catch myself judging, then ask whether I am missing part of the story.
- **Verdict:** OWNS +2
- **Creature/Core:** #7 Vibe checker +1; #33 Curious +1
- **Relic/Private:** #43 Reflective +2; #61 Perspective-taking +1

**C.** Call my criticism “just asking questions.” I know what I am implying.
- **Verdict:** RATIONALIZES +2
- **Creature/Core:** #6 Indirect +1; #7 Vibe checker +1
- **Relic/Private:** #42 Defensiveness +1; #54 Blunt +1

**D.** Criticize them for the same messy choice I made last year.
- **Verdict:** HYPOCRITE +3
- **Creature/Core:** #28 Holds the Receipt +2; #23 Conflict-forward +1
- **Relic/Private:** #42 Defensiveness +2; #60 Keeps score +1

**E.** Support their choices only while those choices are convenient for me.
- **Verdict:** SELFISH +2
- **Creature/Core:** #15 Control +1
- **Relic/Private:** #62 Self-referencing +2; #56 Self-preserving +1

### QUESTION 7 OF 10
**Your friend asks for a favor on the exact day you ask THEM for help. What seems fair?**

**A.** I initially think my need is bigger, then listen to what they are dealing with.
- **Verdict:** OWNS +2
- **Creature/Core:** #14 Collaborative +1; #33 Curious +1
- **Relic/Private:** #43 Reflective +2; #61 Perspective-taking +2

**B.** I give a long explanation of why my request is the more urgent one.
- **Verdict:** RATIONALIZES +2
- **Creature/Core:** #15 Control +1; #38 Urgent +1
- **Relic/Private:** #62 Self-referencing +1; #42 Defensiveness +1

**C.** Remind them of everything I did for them, while dismissing what they did for me.
- **Verdict:** HYPOCRITE +2
- **Creature/Core:** #28 Holds the Receipt +1; #15 Control +1
- **Relic/Private:** #60 Keeps score +3; #42 Defensiveness +1

**D.** I expect them to rearrange their day. I am not changing mine.
- **Verdict:** SELFISH +3
- **Creature/Core:** #15 Control +2
- **Relic/Private:** #62 Self-referencing +3; #56 Self-preserving +1

**E.** We both explain our limits and work out a realistic trade.
- **Verdict:** CONSISTENT +2
- **Creature/Core:** #14 Collaborative +2; #17 Practical +1
- **Relic/Private:** #61 Perspective-taking +1; #59 Gives freely +1

### QUESTION 8 OF 10
**You criticize people for posting performative apologies. Now YOU owe one. The first draft says...**

**A.** “I am sorry you felt hurt, but here is all the context.”
- **Verdict:** RATIONALIZES +2
- **Creature/Core:** #6 Indirect +1; #15 Control +1
- **Relic/Private:** #42 Defensiveness +3; #50 Armored +1

**B.** I refuse to apologize, then repost a quote about people taking accountability.
- **Verdict:** HYPOCRITE +3
- **Creature/Core:** #23 Conflict-forward +1; #28 Holds the Receipt +1
- **Relic/Private:** #42 Defensiveness +3; #62 Self-referencing +1

**C.** I apologize only because I want access to something from them again.
- **Verdict:** SELFISH +3
- **Creature/Core:** #15 Control +1; #34 Decisive +1
- **Relic/Private:** #62 Self-referencing +3; #50 Armored +1

**D.** “I did this. It hurt you. Here is what I will do differently.”
- **Verdict:** CONSISTENT +2
- **Creature/Core:** #5 Direct +2; #17 Practical +1
- **Relic/Private:** #41 Accountability +3; #51 Repair-oriented +1

**E.** “I was wrong.” Then I delete the clever explanation I almost added.
- **Verdict:** OWNS +2
- **Creature/Core:** #5 Direct +1; #34 Decisive +1
- **Relic/Private:** #41 Accountability +3; #43 Reflective +1

### QUESTION 9 OF 10
**You say everyone deserves boundaries. Someone sets one that inconveniences you. What now?**

**A.** Call them selfish for enforcing a boundary I enforce all the time.
- **Verdict:** HYPOCRITE +3
- **Creature/Core:** #23 Conflict-forward +1; #15 Control +1
- **Relic/Private:** #42 Defensiveness +3; #62 Self-referencing +1

**B.** Keep negotiating because my plans depend on them saying yes.
- **Verdict:** SELFISH +3
- **Creature/Core:** #15 Control +2; #38 Urgent +1
- **Relic/Private:** #62 Self-referencing +3; #48 Approval-seeking +1

**C.** I respect it, even if I am disappointed.
- **Verdict:** CONSISTENT +2
- **Creature/Core:** #4 Even-Keeled +1; #10 Hands-off +1
- **Relic/Private:** #47 Boundary-holding +1; #61 Perspective-taking +2

**D.** I push back once, hear myself, and apologize.
- **Verdict:** OWNS +2
- **Creature/Core:** #5 Direct +1; #34 Decisive +1
- **Relic/Private:** #41 Accountability +2; #43 Reflective +2

**E.** Explain why this one boundary is uniquely unreasonable.
- **Verdict:** RATIONALIZES +2
- **Creature/Core:** #5 Direct +1; #15 Control +1
- **Relic/Private:** #42 Defensiveness +2; #62 Self-referencing +1

### QUESTION 10 OF 10
**Finish honestly: the rule I most often bend for myself is...**

**A.** The one that requires me to sacrifice convenience for someone else.
- **Verdict:** SELFISH +3
- **Creature/Core:** #15 Control +1
- **Relic/Private:** #62 Self-referencing +3; #56 Self-preserving +1

**B.** None automatically. If I make an exception, I accept the same from others.
- **Verdict:** CONSISTENT +2
- **Creature/Core:** #21 Rule-oriented +1; #17 Practical +1
- **Relic/Private:** #41 Accountability +1; #61 Perspective-taking +1

**C.** One I have caught and am actively trying to change.
- **Verdict:** OWNS +2
- **Creature/Core:** #34 Decisive +1; #17 Practical +1
- **Relic/Private:** #43 Reflective +2; #41 Accountability +1

**D.** Usually the rule where my circumstances are “more complicated.”
- **Verdict:** RATIONALIZES +2
- **Creature/Core:** #15 Control +1; #18 Idealistic +1
- **Relic/Private:** #42 Defensiveness +2; #62 Self-referencing +1

**E.** Whatever I was just lecturing someone else about. I hate admitting that.
- **Verdict:** HYPOCRITE +3
- **Creature/Core:** #28 Holds the Receipt +1; #5 Direct +1
- **Relic/Private:** #42 Defensiveness +3; #60 Keeps score +1

## ALL FIVE FULL PRIVATE REVEALS

### YOUR STANDARDS HAVE A RETURN ADDRESS.
**Internal outcome ID:** `consistent`

**THE VERDICT**
You expect things from people. You also expect them from yourself.

**THE PRIVATE READ**
Your answers show a willingness to follow the same rules even when breaking them would be convenient. You can dislike lateness and still apologize when you are late. You can ask for honesty and tell the truth when it makes you look worse. Consistency is not perfection; it is the refusal to pretend your mistakes have a completely different moral category.

**THE CALL-OUT**
Do not get superior about it. Consistency can turn into its own little throne if you start treating everyone else like a case study.

**THE COST**
People may feel judged if your standards arrive with no room for context or growth.

**TRY THIS**
The next time someone breaks a standard you hold, separate the impact from their character. Then offer the accountability you would want.

**THE KICKER**
Look at that. A rule that applies in both directions.

*Apparently, your standards survived contact with your own behavior.*

**YOUR TRAITS (display only):** Consistent · Accountable · Principled

### YOU CATCH YOURSELF. IT IS ANNOYINGLY MATURE.
**Internal outcome ID:** `owns`

**THE VERDICT**
You still have double standards sometimes. You are just willing to name them.

**THE PRIVATE READ**
You can hear yourself saying something you criticized last month and stop mid-sentence. You can admit you wanted grace for something you were less forgiving about in others. That self-correction matters. You are not free of ego; you simply do not let ego write the final version of every disagreement.

**THE CALL-OUT**
Awareness without a behavior change is just commentary. You do not get unlimited points for admitting the problem and repeating it.

**THE COST**
People can lose trust if your apologies get more sophisticated while the pattern stays identical.

**TRY THIS**
Choose the inconsistency that shows up most often and change the next concrete behavior. Fewer speeches, more receipts.

**THE KICKER**
You caught your own hypocrisy before Apparently could invoice you.

*Apparently, self-awareness is useful when it comes with follow-through.*

**YOUR TRAITS (display only):** Reflective · Correctable · Accountable

### YOUR EXCUSES HAVE EXCELLENT VOCABULARY.
**Internal outcome ID:** `rationalizes`

**THE VERDICT**
You can explain almost anything. That is not the same as owning it.

**THE PRIVATE READ**
You see nuance everywhere, especially when the questionable choice belongs to you. You are quick to explain why the situation was different, why you were stressed, why the timing mattered, why the other person started it. Some of those explanations may be true. But if there is always one more context paragraph before your part gets acknowledged, the context has become a shelter.

**THE CALL-OUT**
You do not need a better argument. You need one sentence with no “but” attached.

**THE COST**
People start preparing exhibits before bringing you ordinary feedback. That is exhausting.

**TRY THIS**
Practice saying “I did the thing I criticize, and it affected you.” Discuss context after that sentence has actually landed.

**THE KICKER**
Your accountability meeting keeps getting rescheduled for a clarification session.

*Apparently, you can cross-examine your own reflection.*

**YOUR TRAITS (display only):** Analytical · Defensive Under Pressure · Self-Justifying

### HYPOCRITE. FULL STOP.
**Internal outcome ID:** `hypocrite`

**THE VERDICT**
You condemn in other people what you repeatedly excuse in yourself.

**THE PRIVATE READ**
Your answers do not describe one bad day or a harmless inconsistency. They describe a pattern: you want directness until someone is direct with you; you demand punctuality while treating your own delays as special; you despise gossip until you have a story worth telling. When somebody points out the mismatch, you argue about the circumstances instead of the rule.

**THE CALL-OUT**
You do not have standards. You have rules that change ownership depending on who is being judged. Calling it “different when I do it” is still hypocrisy.

**THE COST**
People stop respecting your complaints, including the valid ones, because your actions keep undermining the person delivering them.

**TRY THIS**
Pick one rule you enforce loudly. Apply it to yourself for thirty days, and own every miss without a counterattack.

**THE KICKER**
The rulebook has your name on the cover and your exemptions in the back.

*Apparently, your double standard came with a lifetime membership.*

**YOUR TRAITS (display only):** Double-Standard-Prone · Defensive · Inconsistent

### SELFISH. THE RULES ARE FOR OTHER PEOPLE.
**Internal outcome ID:** `selfish`

**THE VERDICT**
You want consideration without consistently returning it.

**THE PRIVATE READ**
Your answers show something more pointed than a theoretical double standard. You protect your time while treating other people’s time as available. You expect people to absorb inconvenience, rearrange plans, and understand your needs, but their equally real needs become annoying obstacles. You are willing to use fairness language when you benefit and disappear when fairness requires you to give something up.

**THE CALL-OUT**
That is not healthy self-care. That is letting other people pay the bill for your preferences.

**THE COST**
People do not always confront selfishness. Sometimes they quietly stop offering the help, patience, and access you assumed would be there.

**TRY THIS**
Before requesting your next exception, ask who absorbs the cost. Then volunteer to absorb your fair share without being chased.

**THE KICKER**
You need flexibility. Everybody else apparently needs a time machine.

*Apparently, reciprocity keeps getting sent to your voicemail.*

**YOUR TRAITS (display only):** Self-Prioritizing · Low Reciprocity · Convenience-Led

## OWNER-APPROVED EDITORIAL SCORING (ENGINEERING QA PENDING)

**Verdict identity:** The five result IDs shown above are editorial outcome labels, never additional permanent personality traits. A primary selection adds +2 verdict points (or +3 on marked high-confidence choices). The label and its Core/Private evidence are independent.

**High-signal questions for tie resolution:** Q2, Q3, Q5, Q7, Q8, Q9, Q10.

- **HYPOCRITE hard gate:** At least 4 distinct primary supporting answers, including at least 3 answers from the marked high-confidence set of question positions: Q1, Q2, Q3, Q4, Q6, Q8, Q9, Q10. These must be the actual primary choices for this verdict, not just secondary weights or trait awards. The eligible outcome must still win the score/tie decision.
- **SELFISH hard gate:** At least 4 distinct primary supporting answers, including at least 3 answers from the marked high-confidence set of question positions: Q2, Q3, Q4, Q5, Q7, Q8, Q9, Q10. These must be the actual primary choices for this verdict, not just secondary weights or trait awards. The eligible outcome must still win the score/tie decision.

**Other outcomes:** No accusation-specific gate. If a harsh candidate fails its gate, exclude it and choose the highest eligible alternative. Never report a harsh title solely because of a single revealing answer.

**Tie resolution:** Highest eligible total → highest total from high-signal questions → most primary +2/+3 selections → fixed fallback CONSISTENT → OWNS → RATIONALIZES → HYPOCRITE → SELFISH. No close-second verdict.

**First-completion and numeric-trait rules:** Positive-only +1, +2, or +3 awards for explicitly mapped Core IDs 1–40 and Private IDs 41–64. No arbitrarily limited number of awards per answer. No opposite poles of the same dimension in one choice. No awards from title, verdict, humor, or display tags. Only the first qualifying versioned completion may affect permanent evidence. Retakes never inflate totals.

**Representative outcome reachability fixtures** (letters in Q1→Q10 order; checked using the packet’s proposed transparent point/gate model, not yet against Claude’s production engine):
- **CONSISTENT:** A, E, D, C, B, A, E, D, C, B → CONSISTENT (verdict 20 pts; 10 supporting selections; 0 gate-group selections)
- **OWNS:** B, A, E, D, C, B, A, E, D, C → OWNS (verdict 20 pts; 10 supporting selections; 0 gate-group selections)
- **RATIONALIZES:** C, B, A, E, D, C, B, A, E, D → RATIONALIZES (verdict 20 pts; 10 supporting selections; 0 gate-group selections)
- **HYPOCRITE:** D, C, B, A, E, D, C, B, A, E → HYPOCRITE (verdict 28 pts; 10 supporting selections; 8 gate-group selections)
- **SELFISH:** E, D, C, B, A, E, D, C, B, A → SELFISH (verdict 28 pts; 10 supporting selections; 8 gate-group selections)

**QA still required before activation:** Exact TypeScript/server SQL scoring parity, true gate-group implementation, exhaustive reachability boundary tests, fingerprints/versioned historical completion behavior, trait-award migration reconciliation, authoritative entitlement checks, and the 18+ backend restriction for Private Private. No sign-off inferred.

---
# QUIZ 3: Do You Want Sex... or Proof?
**Category:** Private Private. 😈  
**Quiz ID:** `private-private-proof`  
**10 questions · 5 answers per question · About 3–4 minutes**  
**Eyebrow:** APPARENTLY PRIVATE · PRIVATE PRIVATE 😈 · 18+  
**Subtitle:** Sometimes desire is desire. Sometimes it wants witnesses.  
**Support:** Chemistry, attention, longing, and the little ego boost of being wanted. We are finding out what you are actually chasing when the flirting gets real.  
**Small print:** For consenting adults. Being interested, selective, sexually confident, or not interested in sex is not a negative verdict. Answer for your actual intentions and behavior.  
**CTA:** Tell on me 😈 →

## THE COMPLETE QUESTIONS, VERDICT WEIGHTS, AND PERSONALITY EVIDENCE

### QUESTION 1 OF 10
**Someone you find attractive says, “What are you looking for with me?” Your most honest response?**

**A.** “I want to know you and see if the connection is mutual.”
- **Verdict:** CONNECTION +2
- **Creature/Core:** #5 Direct +2; #33 Curious +1
- **Relic/Private:** #49 Vulnerable +2; #61 Perspective-taking +1

**B.** “I am attracted to you. I am not promising more than that.”
- **Verdict:** SPARK +2
- **Creature/Core:** #5 Direct +2; #29 Playful +1
- **Relic/Private:** #45 Self-secure +1; #63 Initiating +1

**C.** “I am still figuring it out.” What I know is that being wanted feels good.
- **Verdict:** CHOSEN +2
- **Creature/Core:** #19 Sentimental +1; #7 Vibe checker +1
- **Relic/Private:** #46 Reassurance-seeking +2; #43 Reflective +1

**D.** I avoid the question. I mostly text when I need a confidence boost.
- **Verdict:** USING +3
- **Creature/Core:** #6 Indirect +1; #35 Private +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +1

**E.** “Who knows where this could go?” I already know I do not want it to go there.
- **Verdict:** LEADING +3
- **Creature/Core:** #6 Indirect +2; #15 Control +1
- **Relic/Private:** #48 Approval-seeking +2; #42 Defensiveness +1

### QUESTION 2 OF 10
**You have had a rough week and do not feel attractive. What would make you feel better?**

**A.** A fun, mutual flirtation where everybody understands the vibe.
- **Verdict:** SPARK +2
- **Creature/Core:** #29 Playful +2; #5 Direct +1
- **Relic/Private:** #45 Self-secure +1; #63 Initiating +1

**B.** One sincere “I want you” from someone I genuinely like.
- **Verdict:** CHOSEN +2
- **Creature/Core:** #19 Sentimental +1; #7 Vibe checker +1
- **Relic/Private:** #46 Reassurance-seeking +2; #49 Vulnerable +1

**C.** Texting someone I know is into me, just to see how quickly they respond.
- **Verdict:** USING +3
- **Creature/Core:** #7 Vibe checker +1; #34 Decisive +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +2

**D.** Reviving a conversation I do not want to pursue, because I miss being chased.
- **Verdict:** LEADING +3
- **Creature/Core:** #6 Indirect +1; #15 Control +1
- **Relic/Private:** #48 Approval-seeking +2; #50 Armored +1

**E.** Time with someone who actually knows me, even without flirting.
- **Verdict:** CONNECTION +2
- **Creature/Core:** #19 Sentimental +1; #14 Collaborative +1
- **Relic/Private:** #49 Vulnerable +1; #45 Self-secure +1

### QUESTION 3 OF 10
**A former fling messages, “I still think about you.” You do not actually want to see them. You...**

**A.** Enjoy the fact they still remember me, then leave the conversation there.
- **Verdict:** CHOSEN +2
- **Creature/Core:** #19 Sentimental +1; #4 Even-Keeled +1
- **Relic/Private:** #46 Reassurance-seeking +1; #56 Self-preserving +1

**B.** Ask if they miss me a lot. I want the details, not the reunion.
- **Verdict:** USING +2
- **Creature/Core:** #7 Vibe checker +1; #33 Curious +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +1

**C.** Say “I have missed you too, maybe soon,” even though I will not make plans.
- **Verdict:** LEADING +3
- **Creature/Core:** #6 Indirect +2; #35 Private +1
- **Relic/Private:** #48 Approval-seeking +2; #42 Defensiveness +1

**D.** Answer kindly but do not invite something I cannot offer.
- **Verdict:** CONNECTION +2
- **Creature/Core:** #5 Direct +2; #17 Practical +1
- **Relic/Private:** #53 Tactful +1; #61 Perspective-taking +1

**E.** Maybe exchange a compliment, but make the boundary clear.
- **Verdict:** SPARK +2
- **Creature/Core:** #29 Playful +1; #5 Direct +1
- **Relic/Private:** #47 Boundary-holding +2; #45 Self-secure +1

### QUESTION 4 OF 10
**Someone is clearly developing feelings. You know yours are not growing. What do you do?**

**A.** Keep seeing them while the affection still makes me feel better.
- **Verdict:** USING +3
- **Creature/Core:** #16 Let it play out +1; #7 Vibe checker +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +2

**B.** Give “maybe later” answers so they do not leave, despite knowing the truth.
- **Verdict:** LEADING +3
- **Creature/Core:** #6 Indirect +2; #15 Control +1
- **Relic/Private:** #48 Approval-seeking +3; #42 Defensiveness +1

**C.** Tell them the truth promptly and let them choose what happens next.
- **Verdict:** CONNECTION +2
- **Creature/Core:** #5 Direct +2; #17 Practical +1
- **Relic/Private:** #61 Perspective-taking +2; #41 Accountability +1

**D.** Explain that I enjoy the chemistry but cannot offer a relationship.
- **Verdict:** SPARK +2
- **Creature/Core:** #5 Direct +2; #29 Playful +1
- **Relic/Private:** #47 Boundary-holding +1; #53 Tactful +1

**E.** Feel sad about losing their attention, but admit I should be clear.
- **Verdict:** CHOSEN +2
- **Creature/Core:** #19 Sentimental +1; #33 Curious +1
- **Relic/Private:** #43 Reflective +2; #46 Reassurance-seeking +1

### QUESTION 5 OF 10
**You post a photo and notice exactly ONE person you hoped would react has viewed it. No message. What now?**

**A.** Send a flirty “you saw that?” just to pull them back into the game.
- **Verdict:** LEADING +2
- **Creature/Core:** #29 Playful +1; #6 Indirect +1
- **Relic/Private:** #48 Approval-seeking +3; #63 Initiating +1

**B.** Nothing. If I want to talk to them, I will actually start a conversation.
- **Verdict:** CONNECTION +2
- **Creature/Core:** #4 Even-Keeled +1; #5 Direct +1
- **Relic/Private:** #45 Self-secure +2; #63 Initiating +1

**C.** Enjoy the possibility, then move on with my evening.
- **Verdict:** SPARK +2
- **Creature/Core:** #29 Playful +1; #4 Even-Keeled +1
- **Relic/Private:** #45 Self-secure +2

**D.** Feel disappointed. I hoped their reaction would tell me I am still desired.
- **Verdict:** CHOSEN +2
- **Creature/Core:** #7 Vibe checker +1; #3 Emotionally Intense +1
- **Relic/Private:** #46 Reassurance-seeking +2; #43 Reflective +1

**E.** Post something else aimed at baiting their attention, even though I do not want them.
- **Verdict:** USING +2
- **Creature/Core:** #7 Vibe checker +2; #15 Control +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +1

### QUESTION 6 OF 10
**After a great mutual evening, the other person wants to know whether they will see you again. You...**

**A.** Answer based on whether I actually want to keep getting to know them.
- **Verdict:** CONNECTION +2
- **Creature/Core:** #5 Direct +2; #34 Decisive +1
- **Relic/Private:** #49 Vulnerable +1; #41 Accountability +1

**B.** If I want another casual date, I say that clearly and ask what they want.
- **Verdict:** SPARK +2
- **Creature/Core:** #5 Direct +2; #29 Playful +1
- **Relic/Private:** #47 Boundary-holding +1; #63 Initiating +1

**C.** Feel thrilled they asked, then realize I am less sure what I want.
- **Verdict:** CHOSEN +2
- **Creature/Core:** #3 Emotionally Intense +1; #19 Sentimental +1
- **Relic/Private:** #46 Reassurance-seeking +2; #43 Reflective +1

**D.** Keep them warm with affectionate replies until the ego boost wears off.
- **Verdict:** USING +2
- **Creature/Core:** #6 Indirect +1; #16 Let it play out +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +2

**E.** Suggest specific future plans I have no intention of making real.
- **Verdict:** LEADING +3
- **Creature/Core:** #6 Indirect +2; #15 Control +1
- **Relic/Private:** #48 Approval-seeking +3; #42 Defensiveness +1

### QUESTION 7 OF 10
**Imagine nobody could ever brag about wanting you. Which part of dating would you still enjoy most?**

**A.** The actual chemistry and fun, as long as it is mutual.
- **Verdict:** SPARK +2
- **Creature/Core:** #29 Playful +2; #11 Adventurous +1
- **Relic/Private:** #45 Self-secure +1; #63 Initiating +1

**B.** I would still date, but I would miss the feeling of being specially chosen.
- **Verdict:** CHOSEN +2
- **Creature/Core:** #19 Sentimental +1; #7 Vibe checker +1
- **Relic/Private:** #46 Reassurance-seeking +2; #43 Reflective +1

**C.** I am not sure. The attention is honestly a huge part of why I reach out.
- **Verdict:** USING +3
- **Creature/Core:** #7 Vibe checker +1; #3 Emotionally Intense +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +1

**D.** I would probably flirt less. Knowing somebody is chasing me is the best part.
- **Verdict:** LEADING +3
- **Creature/Core:** #29 Playful +1; #15 Control +1
- **Relic/Private:** #48 Approval-seeking +3; #62 Self-referencing +1

**E.** The talks, trust, and getting to know the real person.
- **Verdict:** CONNECTION +2
- **Creature/Core:** #19 Sentimental +1; #33 Curious +1
- **Relic/Private:** #49 Vulnerable +1; #61 Perspective-taking +1

### QUESTION 8 OF 10
**Someone says, “I am getting mixed signals from you.” What is true?**

**A.** My feelings about the attention are clearer than my feelings about the person.
- **Verdict:** CHOSEN +2
- **Creature/Core:** #33 Curious +1; #19 Sentimental +1
- **Relic/Private:** #43 Reflective +2; #46 Reassurance-seeking +1

**B.** I get distant after they reassure me, then return when I feel insecure again.
- **Verdict:** USING +3
- **Creature/Core:** #6 Indirect +1; #7 Vibe checker +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +2

**C.** I know I do not want more. I just hate losing access to their interest.
- **Verdict:** LEADING +3
- **Creature/Core:** #6 Indirect +1; #15 Control +1
- **Relic/Private:** #48 Approval-seeking +3; #42 Defensiveness +1

**D.** I take it seriously and clarify what I actually feel.
- **Verdict:** CONNECTION +2
- **Creature/Core:** #5 Direct +2; #14 Collaborative +1
- **Relic/Private:** #61 Perspective-taking +2; #41 Accountability +1

**E.** I may have been playful without explaining what I am open to. I fix that.
- **Verdict:** SPARK +2
- **Creature/Core:** #29 Playful +1; #5 Direct +2
- **Relic/Private:** #41 Accountability +1; #53 Tactful +1

### QUESTION 9 OF 10
**You could receive exactly ONE of these tonight. What would you choose?**

**A.** A message proving I still have it, from someone I will probably ignore tomorrow.
- **Verdict:** USING +3
- **Creature/Core:** #7 Vibe checker +1; #34 Decisive +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +1

**B.** A person I do not want asking me to give them one more chance.
- **Verdict:** LEADING +3
- **Creature/Core:** #15 Control +1; #29 Playful +1
- **Relic/Private:** #48 Approval-seeking +3; #62 Self-referencing +1

**C.** An honest conversation with somebody I really like.
- **Verdict:** CONNECTION +2
- **Creature/Core:** #5 Direct +1; #19 Sentimental +1
- **Relic/Private:** #49 Vulnerable +2; #61 Perspective-taking +1

**D.** Mutual chemistry with clear expectations and zero mind games.
- **Verdict:** SPARK +2
- **Creature/Core:** #29 Playful +1; #11 Adventurous +1
- **Relic/Private:** #45 Self-secure +1; #47 Boundary-holding +1

**E.** Someone looking me in the eye and telling me they want me.
- **Verdict:** CHOSEN +2
- **Creature/Core:** #19 Sentimental +1; #3 Emotionally Intense +1
- **Relic/Private:** #46 Reassurance-seeking +2; #49 Vulnerable +1

### QUESTION 10 OF 10
**Final check: Which sentence is uncomfortably close to true?**

**A.** I have knowingly let someone hope for something I already ruled out.
- **Verdict:** LEADING +3
- **Creature/Core:** #6 Indirect +1; #15 Control +1
- **Relic/Private:** #48 Approval-seeking +3; #42 Defensiveness +1

**B.** If I cannot be honest about what I want, I should not invite somebody closer.
- **Verdict:** CONNECTION +2
- **Creature/Core:** #5 Direct +2; #17 Practical +1
- **Relic/Private:** #41 Accountability +1; #61 Perspective-taking +2

**C.** I can want physical chemistry without pretending it promises a future.
- **Verdict:** SPARK +2
- **Creature/Core:** #5 Direct +2; #29 Playful +1
- **Relic/Private:** #45 Self-secure +1; #47 Boundary-holding +1

**D.** Sometimes I want the feeling of being wanted more than I want a date.
- **Verdict:** CHOSEN +2
- **Creature/Core:** #19 Sentimental +1; #33 Curious +1
- **Relic/Private:** #46 Reassurance-seeking +2; #43 Reflective +1

**E.** I have reached out to people for confidence I knew I would not return with care.
- **Verdict:** USING +3
- **Creature/Core:** #7 Vibe checker +1; #16 Let it play out +1
- **Relic/Private:** #46 Reassurance-seeking +3; #62 Self-referencing +2

## ALL FIVE FULL PRIVATE REVEALS

### YOU WANT THE PERSON. NOT JUST THE REACTION.
**Internal outcome ID:** `connection`

**THE VERDICT**
The attention is nice. The actual human being is the point.

**THE PRIVATE READ**
Your answers suggest you are drawn to honest closeness. You care whether the interest is mutual, what the other person wants, and whether the situation feels good after the excitement settles. You can enjoy desire without using it to fill a vacancy in your self-worth. You are willing to say what you mean rather than offer chemistry as a substitute for a conversation.

**THE CALL-OUT**
Do not turn being intentional into an audition for a perfect relationship. You are allowed to want something casual, something serious, or nothing right now, as long as you are clear.

**THE COST**
If you overanalyze every connection, attraction may start feeling like an interview.

**TRY THIS**
Say one thing you genuinely want and ask what the other person wants. Keep room for a different answer.

**THE KICKER**
You noticed the chemistry and still remembered there was another person involved.

*Apparently, the person is the prize, not the applause.*

**YOUR TRAITS (display only):** Intentional · Mutual · Clear

### YOU WANT THE HEAT. AND YOU OWN THAT.
**Internal outcome ID:** `spark`

**THE VERDICT**
You like attraction without pretending it is automatically a love story.

**THE PRIVATE READ**
You can admit when a connection is mainly about chemistry and keep your behavior aligned with what you have actually offered. Flirting is fun. Desire is real. That does not require you to promise commitment, use somebody for a confidence boost, or manufacture mystery. Your answers suggest you can be playful and direct about what is, and is not, on the table.

**THE CALL-OUT**
Confidence is not permission to assume the other person wants the same arrangement. They get a full vote.

**THE COST**
If you rely too much on “we both know what this is,” one of you may be operating from a very different script.

**TRY THIS**
Put the terms into words before the situation gets complicated. Clear can still be sexy.

**THE KICKER**
The chemistry has a reservation. The expectations have been informed.

*Apparently, you can be grown without making it everybody else’s guessing game.*

**YOUR TRAITS (display only):** Playful · Direct · Self-Aware

### YOU WANT TO FEEL CHOSEN. MORE THAN YOU ADMIT.
**Internal outcome ID:** `chosen`

**THE VERDICT**
You are not necessarily chasing sex. You are chasing the exhale that comes with being wanted.

**THE PRIVATE READ**
You may love the compliment, the second look, the late-night text, or the feeling that someone made a special effort for you. That does not automatically mean you are manipulating anyone. But your answers suggest that validation is sometimes more important than the person delivering it. The rush feels real, then fades, and you wonder why you need the signal again.

**THE CALL-OUT**
Attention can reassure you for a minute. It cannot become your permanent proof that you matter.

**THE COST**
You may mistake a brief ego lift for genuine compatibility or keep reopening conversations that do not lead anywhere good.

**TRY THIS**
Before responding, ask: “Do I want this person, this experience, or just the feeling of being wanted?” Answer privately before you answer them.

**THE KICKER**
Your phone lit up and your confidence clocked in for a shift.

*Apparently, the notification is sometimes the whole fantasy.*

**YOUR TRAITS (display only):** Validation-Aware · Sensitive to Attention · Searching for Certainty

### YOU'RE USING PEOPLE TO FEEL WANTED.
**Internal outcome ID:** `using`

**THE VERDICT**
You are treating somebody else’s interest like a refill station for your confidence.

**THE PRIVATE READ**
Your answers show a repeated pattern: you reach for someone when you feel undesirable, draw out their affection or desire, and lose interest once you get the proof you came for. Then, when the insecurity returns, you know exactly whose messages you can reopen. The person on the other side believes they are connecting with you. Too often, they are being recruited to fix a feeling you do not want to sit with.

**THE CALL-OUT**
That is not flirting. That is emotional extraction with attractive lighting. They are a person, not a vending machine for reassurance.

**THE COST**
You can leave somebody attached to a connection you had no intention of building, while your own need for validation remains unsolved.

**TRY THIS**
Stop contacting anyone you only reach for when your confidence drops. If you do not want a connection, do not borrow their hope to feel better.

**THE KICKER**
You got the compliment and suddenly remembered you were busy.

*Apparently, your confidence should not require an audience on standby.*

**YOUR TRAITS (display only):** Validation-Dependent · Self-Referencing · Emotionally Inconsiderate

### YOU'RE LEADING PEOPLE ON. AND YOU KNOW IT.
**Internal outcome ID:** `leading`

**THE VERDICT**
You are keeping the door cracked open because you like who waits outside it.

**THE PRIVATE READ**
Your answers describe a deliberate pattern: you know you do not want what someone is hoping for, but you keep offering hints, suggestive invitations, and future-shaped language to preserve their attention. You are not confused about your intentions nearly as often as you act. You just do not want to lose the benefits of someone else believing there is a chance.

**THE CALL-OUT**
Stop calling it “keeping things open.” You are letting someone build expectations you already know you will not meet.

**THE COST**
People spend real time, affection, and emotional energy on a future you are privately ruling out. Once they realize, the chemistry will not excuse the deception.

**TRY THIS**
Say the uncomfortable sentence now: “I like the attention, but I do not want the relationship you are hoping for.” Then stop sending contradictory signals.

**THE KICKER**
You did not want the date. You wanted them to keep asking.

*Apparently, the mixed signals were not mixed on your side.*

**YOUR TRAITS (display only):** Misleading · Attention-Driven · Avoids Clarity

## OWNER-APPROVED EDITORIAL SCORING (ENGINEERING QA PENDING)

**Verdict identity:** The five result IDs shown above are editorial outcome labels, never additional permanent personality traits. A primary selection adds +2 verdict points (or +3 on marked high-confidence choices). The label and its Core/Private evidence are independent.

**High-signal questions for tie resolution:** Q2, Q3, Q5, Q7, Q8, Q9, Q10.

- **USING hard gate:** At least 4 distinct primary supporting answers, including at least 3 answers from the marked high-confidence set of question positions: Q1, Q2, Q4, Q7, Q8, Q9, Q10. These must be the actual primary choices for this verdict, not just secondary weights or trait awards. The eligible outcome must still win the score/tie decision.
- **LEADING hard gate:** At least 4 distinct primary supporting answers, including at least 3 answers from the marked high-confidence set of question positions: Q1, Q2, Q3, Q4, Q6, Q7, Q8, Q9, Q10. These must be the actual primary choices for this verdict, not just secondary weights or trait awards. The eligible outcome must still win the score/tie decision.

**Other outcomes:** No accusation-specific gate. If a harsh candidate fails its gate, exclude it and choose the highest eligible alternative. Never report a harsh title solely because of a single revealing answer.

**Tie resolution:** Highest eligible total → highest total from high-signal questions → most primary +2/+3 selections → fixed fallback CONNECTION → SPARK → CHOSEN → USING → LEADING. No close-second verdict.

**First-completion and numeric-trait rules:** Positive-only +1, +2, or +3 awards for explicitly mapped Core IDs 1–40 and Private IDs 41–64. No arbitrarily limited number of awards per answer. No opposite poles of the same dimension in one choice. No awards from title, verdict, humor, or display tags. Only the first qualifying versioned completion may affect permanent evidence. Retakes never inflate totals.

**Representative outcome reachability fixtures** (letters in Q1→Q10 order; checked using the packet’s proposed transparent point/gate model, not yet against Claude’s production engine):
- **CONNECTION:** A, E, D, C, B, A, E, D, C, B → CONNECTION (verdict 20 pts; 10 supporting selections; 0 gate-group selections)
- **SPARK:** B, A, E, D, C, B, A, E, D, C → SPARK (verdict 20 pts; 10 supporting selections; 0 gate-group selections)
- **CHOSEN:** C, B, A, E, D, C, B, A, E, D → CHOSEN (verdict 20 pts; 10 supporting selections; 0 gate-group selections)
- **USING:** D, C, B, A, E, D, C, B, A, E → USING (verdict 27 pts; 10 supporting selections; 7 gate-group selections)
- **LEADING:** E, D, C, B, A, E, D, C, B, A → LEADING (verdict 29 pts; 10 supporting selections; 9 gate-group selections)

**QA still required before activation:** Exact TypeScript/server SQL scoring parity, true gate-group implementation, exhaustive reachability boundary tests, fingerprints/versioned historical completion behavior, trait-award migration reconciliation, authoritative entitlement checks, and the 18+ backend restriction for Private Private. No sign-off inferred.

---
## OWNER APPROVAL RECORD

- [x] All 30 questions and 150 answer choices approved.
- [x] All verdict weights, numeric Core/Private evidence, and 15 full outcomes (including six harsh outcomes) approved editorially.
- [x] Titles, subtitles, high-signal questions, gate thresholds, and tie orders approved editorially.
- [ ] Engineering verification: confirm the approved gate/tie behavior and TS/SQL parity on actual implementation before activation.
- [ ] Release authorization: local implementation is authorized; commit, push, live migrations, TestFlight, and production release remain separately gated.



---

# SOURCE FILE: 04_FOUR_NEW_PREMIUM_OWNER_APPROVED.md

**Source description:** Premium batch 2: hidden-you-hide; life-match-freedom; style-vibe-attention; good-stuff-trust

**Current editorial status: OWNER-APPROVED AND LOCKED (November 1, 2026). Implementation and production rollout are separate actions.**

# APPARENTLY PRIVATE | FOUR REWRITTEN QUIZZES
**OWNER-APPROVED REWRITTEN EDITORIAL SOURCE v2.0 | APPROVED | 2026-11-01**

**Scope:** Supersede only the four earlier unapproved quiz drafts from Batch 2 with these four now-approved replacements. Nothing in the previously approved quiz batches, the canonical Product Bible, current code, migrations, database, or user history has been changed.

**Editorial correction:** All 40 questions and 200 answer choices have been individually revised for varied motives, speech patterns, settings, and plausible behavior. Result ordering is deliberately mixed. Not every question carries one answer for each outcome. Numeric trait mappings are independently assigned per response, including legitimately empty layers. No result label supplies a personality award.

**User-confirmed evidence rule:** Per trait pole, genuine strong behavior can receive +3; weaker evidence can receive +1/+2. No arbitrary number-of-traits cap. Exact numeric IDs match the 64-trait frozen dictionary. The Product Bible governs all other content and lifecycle constraints; editorial approval does not equal deployment permission.

**Full reveal format:** TITLE → THE VERDICT → THE PRIVATE READ → THE CALL-OUT → THE COST → TRY THIS → THE KICKER → Apparently signature → YOUR TRAITS. The five editorial reveal reads from the earlier unapproved Batch 2 draft are carried forward; questions, outcomes, paths, gates and mappings have been rebuilt.

## Contents
1. **What Do You Hide Even From People Who Know You?** | Hidden You
2. **How Much Freedom Do You Really Need?** | Life Match
3. **What Kind of Attention Do You Attract?** | Style & Vibe
4. **What Do People Trust You With?** | The Good Stuff | APPROVED 17th launch quiz

---

# QUIZ 1 | What Do You Hide Even From People Who Know You?
**Category:** Hidden You  
**Approved stable quiz ID:** `hidden-you-hide`  
**Status:** REQUIRED for original two-per-category 16-quiz lineup  
**Eyebrow:** APPARENTLY PRIVATE · HIDDEN YOU  
**Subtitle:** Everybody edits a little. Some people are running an entirely different account. 👀  
**Intro:** The stories you change, the feelings you shelve, and the parts of yourself that never make the group chat.  
**Small print:** Answer for what you usually do, not what sounds most respectable.  
**Meta:** 10 questions · Approximately 3–4 minutes  
**CTA:** Open the file →

## Full questions, options, verdict weights, and personality evidence

### QUESTION 1 OF 10
**Your cousin asks why you stopped showing up to family dinners. What actually comes out?**

**A.** “It got complicated. I’m not ready to unpack it over potato salad.”

- **Verdict:** PRIVATE +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** #47 Boundary-holding +2

**B.** “I’ve just been SO busy.” Truth is, I’ve been telling each relative a different reason.

- **Verdict:** FAKE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +2
- **Relic/Private:** #48 Approval-seeking +3; #42 Defensiveness +1

**C.** “I didn’t like how I was treated last time, so I took a break.”

- **Verdict:** CONSISTENT +2
- **Creature/Core:** #5 Direct +2; #34 Decisive +1
- **Relic/Private:** #47 Boundary-holding +1

**D.** I tell my cousin the real reason privately. Aunt Linda does not need the director’s cut.

- **Verdict:** ADAPTIVE +2
- **Creature/Core:** #35 Private +1; #7 Vibe checker +1
- **Relic/Private:** #53 Tactful +2; #61 Perspective-taking +1

**E.** I say I’m fine, then bring up how the family always makes time for everybody else.

- **Verdict:** JEALOUS +2
- **Creature/Core:** #31 Competitive +1
- **Relic/Private:** #60 Keeps score +1; #62 Self-referencing +2


### QUESTION 2 OF 10
**A friend gets a job you applied for, too. Later that night, what does your phone look like?**

**A.** Six open tabs about their qualifications. I am apparently conducting an unpaid investigation.

- **Verdict:** JEALOUS +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #31 Competitive +3; #33 Curious +1
- **Relic/Private:** #60 Keeps score +2; #62 Self-referencing +2

**B.** A real congratulations text, then I look for my next opening.

- **Verdict:** CONSISTENT +2
- **Creature/Core:** #39 Ambitious +1; #34 Decisive +1
- **Relic/Private:** No confident trait evidence

**C.** Their good news stings. I put my phone down until I can be decent about it.

- **Verdict:** PRIVATE +2
- **Creature/Core:** #35 Private +1
- **Relic/Private:** #43 Reflective +2

**D.** I tell them they deserve it, then tell someone else they probably knew the hiring manager.

- **Verdict:** FAKE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +2
- **Relic/Private:** #48 Approval-seeking +2; #50 Armored +1

**E.** I celebrate with them now. Tomorrow I ask for interview feedback on my own application.

- **Verdict:** ADAPTIVE +2
- **Creature/Core:** #17 Practical +2; #32 Cooperative +1
- **Relic/Private:** #43 Reflective +1; #61 Perspective-taking +1


### QUESTION 3 OF 10
**People from work and your closest friends end up at the same birthday party. What might surprise them?**

**A.** My work voice clocks out. The bad jokes and weird dance moves clock in.

- **Verdict:** ADAPTIVE +2
- **Creature/Core:** #29 Playful +2; #7 Vibe checker +1
- **Relic/Private:** No confident trait evidence

**B.** My coworkers discover I have a partner. I do not run a personal newsletter at the office.

- **Verdict:** PRIVATE +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** #47 Boundary-holding +1

**C.** I agree with two opposite opinions in the same night and hope nobody compares notes.

- **Verdict:** FAKE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +2; #15 Control +1
- **Relic/Private:** #48 Approval-seeking +3

**D.** That I swear more with friends. My actual beliefs are identical.

- **Verdict:** CONSISTENT +2
- **Creature/Core:** #36 Open +1
- **Relic/Private:** #45 Self-secure +1

**E.** I keep inserting little career wins whenever someone compliments my friend.

- **Verdict:** JEALOUS +2
- **Creature/Core:** #31 Competitive +2; #39 Ambitious +1
- **Relic/Private:** #62 Self-referencing +2; #60 Keeps score +1


### QUESTION 4 OF 10
**Complete this sentence with the version that feels uncomfortably familiar: “I wish people knew...”**

**A.** “…that I changed my mind. I was wrong, and I’ve said so.”

- **Verdict:** CONSISTENT +2
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #41 Accountability +3; #43 Reflective +1

**B.** “…how much I worry. I’m not ready to talk about it publicly.”

- **Verdict:** PRIVATE +2
- **Creature/Core:** #35 Private +2; #3 Emotionally Intense +1
- **Relic/Private:** #50 Armored +1

**C.** “…that being the supportive friend gets old when nobody notices what I do.”

- **Verdict:** JEALOUS +2
- **Creature/Core:** #31 Competitive +1
- **Relic/Private:** #60 Keeps score +2; #62 Self-referencing +1

**D.** “…that the quiet version and the silly version are both real.”

- **Verdict:** ADAPTIVE +2
- **Creature/Core:** #29 Playful +1; #35 Private +1
- **Relic/Private:** No confident trait evidence

**E.** “…that half my compliments are just me trying not to be disliked.”

- **Verdict:** FAKE +2
- **Creature/Core:** #6 Indirect +1
- **Relic/Private:** #48 Approval-seeking +2


### QUESTION 5 OF 10
**Somebody in your friend group is getting a lot of praise. What do you do when they leave?**

**A.** “Okay, but can we talk about the help they had?” I brought supporting exhibits.

- **Verdict:** JEALOUS +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #31 Competitive +3
- **Relic/Private:** #60 Keeps score +3; #62 Self-referencing +2

**B.** Mention a weakness only if it actually matters to a decision we are making.

- **Verdict:** ADAPTIVE +2
- **Creature/Core:** #17 Practical +1
- **Relic/Private:** #53 Tactful +1

**C.** Say the nice thing I would have said with them standing there.

- **Verdict:** CONSISTENT +2
- **Creature/Core:** #5 Direct +1; #32 Cooperative +1
- **Relic/Private:** #57 Supportive +2

**D.** Roll my eyes with the group, although I was calling them my bestie five minutes ago.

- **Verdict:** FAKE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +2
- **Relic/Private:** #48 Approval-seeking +2; #42 Defensiveness +1

**E.** I excuse myself. The comparison is mine to process, not theirs to carry.

- **Verdict:** PRIVATE +2
- **Creature/Core:** #35 Private +1
- **Relic/Private:** #43 Reflective +2; #56 Self-preserving +1


### QUESTION 6 OF 10
**Your partner asks, “Are you upset with me?” You actually are. Pick the closest reply.**

**A.** “Yes, about what happened yesterday. Can we talk after dinner?”

- **Verdict:** CONSISTENT +2
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #49 Vulnerable +1; #51 Repair-oriented +2

**B.** “Nope!” Then I spend the evening telling everybody else what they did.

- **Verdict:** FAKE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +2
- **Relic/Private:** #42 Defensiveness +2; #52 Punishing +2

**C.** “A little. I don’t want to say something unfair before I sort it out.”

- **Verdict:** ADAPTIVE +2
- **Creature/Core:** #37 Patient +1
- **Relic/Private:** #43 Reflective +2; #53 Tactful +1

**D.** “I need a few hours alone. I’m not ignoring you.”

- **Verdict:** PRIVATE +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** #47 Boundary-holding +2

**E.** “Not at you. I’ve been overwhelmed, and I didn’t know how to say it.”

- **Verdict:** PRIVATE +2
- **Creature/Core:** #5 Direct +1
- **Relic/Private:** #49 Vulnerable +2; #43 Reflective +1


### QUESTION 7 OF 10
**An old acquaintance says, “You’ve changed.” Which response is most likely?**

**A.** “Not at all!” Meanwhile I’m already adjusting my story to match what they remember.

- **Verdict:** FAKE +2
- **Creature/Core:** #6 Indirect +1
- **Relic/Private:** #48 Approval-seeking +2

**B.** “I hope so. I learned a few things the hard way.”

- **Verdict:** CONSISTENT +2
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #41 Accountability +1; #43 Reflective +2

**C.** I smile. We last spoke in 2018. They are not owed a progress report.

- **Verdict:** PRIVATE +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** #47 Boundary-holding +1

**D.** I immediately list my accomplishments so they know I’m doing better than them.

- **Verdict:** JEALOUS +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #31 Competitive +2; #39 Ambitious +1
- **Relic/Private:** #62 Self-referencing +3

**E.** “Depends which part you mean.” I’m curious what they noticed.

- **Verdict:** ADAPTIVE +2
- **Creature/Core:** #33 Curious +2
- **Relic/Private:** #61 Perspective-taking +1


### QUESTION 8 OF 10
**Your friend posts a photo of a night you were all out together. What would make you ask them to take it down?**

**A.** It shows something about my personal life I haven’t chosen to share.

- **Verdict:** PRIVATE +2
- **Creature/Core:** #35 Private +3
- **Relic/Private:** #47 Boundary-holding +2

**B.** It caught me crying. I was okay sharing the night, not the whole breakdown.

- **Verdict:** PRIVATE +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** #47 Boundary-holding +2

**C.** They tagged someone who specifically asked not to be tagged.

- **Verdict:** CONSISTENT +2
- **Creature/Core:** #9 Protective +1
- **Relic/Private:** #57 Supportive +1

**D.** The photo contradicts the version of that night I told another person.

- **Verdict:** FAKE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +2
- **Relic/Private:** #42 Defensiveness +3

**E.** It might embarrass someone else. I ask them first instead of assuming.

- **Verdict:** ADAPTIVE +2
- **Creature/Core:** #7 Vibe checker +1
- **Relic/Private:** #53 Tactful +1; #61 Perspective-taking +2


### QUESTION 9 OF 10
**A close friend confronts you: “You told me one thing and them something else.” What happens?**

**A.** I start explaining why each person “needed to hear” their version. The story is getting a sequel.

- **Verdict:** FAKE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +2; #15 Control +1
- **Relic/Private:** #42 Defensiveness +3; #48 Approval-seeking +2

**B.** “You’re right. I contradicted myself. Here’s what I actually think.”

- **Verdict:** CONSISTENT +2
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #41 Accountability +3; #49 Vulnerable +1

**C.** I check the exact wording. Different emphasis is one thing; different facts aren’t.

- **Verdict:** ADAPTIVE +2
- **Creature/Core:** #26 Verify first +2
- **Relic/Private:** #43 Reflective +2; #41 Accountability +1

**D.** “I withheld details. I didn’t tell you something false.” Then I explain the boundary.

- **Verdict:** PRIVATE +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** #47 Boundary-holding +2

**E.** I say, “Everybody heard it wrong,” even though I know exactly what I told each person.

- **Verdict:** FAKE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +1
- **Relic/Private:** #42 Defensiveness +2


### QUESTION 10 OF 10
**Pick the receipt you would least want Apparently to find.**

**A.** A screenshot folder of somebody else’s wins with my little sarcastic comments attached.

- **Verdict:** JEALOUS +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #31 Competitive +2
- **Relic/Private:** #60 Keeps score +3; #62 Self-referencing +2

**B.** A messy journal full of feelings I have never said out loud.

- **Verdict:** PRIVATE +2
- **Creature/Core:** #35 Private +2; #19 Sentimental +1
- **Relic/Private:** #43 Reflective +1

**C.** Two voice notes, sent to two different people, claiming opposite things about the same person.

- **Verdict:** FAKE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +3
- **Relic/Private:** #48 Approval-seeking +3; #42 Defensiveness +1

**D.** The carefully edited email I wrote to be kind without pretending the project went well.

- **Verdict:** ADAPTIVE +2
- **Creature/Core:** #17 Practical +1
- **Relic/Private:** #53 Tactful +2

**E.** An apology where I admitted I was wrong. Embarrassing? Sure. Still true.

- **Verdict:** CONSISTENT +2
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #41 Accountability +2; #49 Vulnerable +1

## All five complete result reveals

### YOU ARE THE SAME PERSON WHEN THE ROOM CHANGES.
**Internal outcome ID:** `consistent`

**THE VERDICT**

No secret audition. No new character every time the audience changes.

**THE PRIVATE READ**

You adjust your language and energy when a situation calls for it, but your values remain recognizable. People may know different sides of you without getting contradictory versions. You can be diplomatic without lying, loyal without being performative, and honest without giving everybody access to your entire life.

**THE CALL-OUT**

Consistency is not permission to become rigid. A different environment may require a genuinely different approach.

**THE COST**

You can miss useful feedback by assuming that being authentic means you never need to change.

**TRY THIS**

Ask one person who sees you in two settings where your tone shifts. Keep the useful adaptation; check for any blind spot.

**THE KICKER**

No emergency press release required. The story matches the receipts.

*Apparently, your personality survives a change of audience.*

**YOUR TRAITS (display only):** Consistent · Grounded · Self-Aware

### PRIVATE. NOT FAKE. THERE IS A DIFFERENCE.
**Internal outcome ID:** `private`

**THE VERDICT**

You are allowed to have thoughts that do not come with public access.

**THE PRIVATE READ**

You choose carefully what to reveal, and not because your private life contradicts your public values. You can be warm and honest while keeping family pain, unfinished dreams, disappointments, and intimate feelings out of general circulation. With trusted people you can open the door without pretending everything is fine.

**THE CALL-OUT**

Privacy becomes a problem when everybody close to you is permanently guessing whether you are okay.

**THE COST**

People who care about you may feel shut out of the moments when support would actually help.

**TRY THIS**

Tell one trusted person one specific thing you have been carrying. A boundary can stay in place while you let yourself be known.

**THE KICKER**

Not everything is a group-chat announcement. Imagine that.

*Apparently, your inner life has a door, not a fake wall.*

**YOUR TRAITS (display only):** Selective · Private · Trust-Building

### YOU KNOW HOW TO READ A ROOM WITHOUT LOSING YOURSELF.
**Internal outcome ID:** `adaptive`

**THE VERDICT**

Different energy, same person. That is a skill.

**THE PRIVATE READ**

You can be more playful with friends, focused at work, and tender with people you love without telling a different story about your principles. You notice context and adjust your delivery. It does not make you fake. It makes you aware that other people and situations are not interchangeable.

**THE CALL-OUT**

Being good at fitting in can become automatic. Check whether you ever swallow a genuine disagreement to keep everybody comfortable.

**THE COST**

Too much adjustment may make it difficult for people to know what you actually want.

**TRY THIS**

At the next low-stakes disagreement, state your real view kindly rather than perfectly matching the room.

**THE KICKER**

Yes, you contain multitudes. No, they do not need separate publicists.

*Apparently, range is not the same thing as a disguise.*

**YOUR TRAITS (display only):** Adaptable · Socially Aware · Authentic

### YOU'RE FAKE. NOT PRIVATE. FAKE.
**Internal outcome ID:** `fake`

**THE VERDICT**

Your personality keeps changing depending on who might reward it.

**THE PRIVATE READ**

You have been agreeing with people you privately mock, claiming opinions you do not hold, and presenting incompatible versions of yourself to stay liked or gain an advantage. That is not simply reading a room. The repeated pattern is telling different people whatever keeps you in their good graces, then acting like you never said it.

**THE CALL-OUT**

Stop calling it “protecting your peace.” You are avoiding the cost of having a real position while collecting the benefits of every side.

**THE COST**

Eventually two people compare notes. Even before that, nobody can build deep trust with a version of you that keeps changing to win approval.

**TRY THIS**

Choose one low-stakes opinion you usually fake agreement about. State the truth without a speech, an insult, or a new story afterward.

**THE KICKER**

You did not change your mind. The guest list changed.

*Apparently, your authenticity has audience settings.*

**YOUR TRAITS (display only):** Approval-Driven · Inconsistent · Conflict-Avoidant

### YOU'RE JEALOUS. YOU JUST HIDE IT WELL.
**Internal outcome ID:** `jealous`

**THE VERDICT**

You clap in public and compete in private.

**THE PRIVATE READ**

You can smile through somebody else’s achievement while immediately searching for a way to minimize it, match it, or prove you deserved it more. Your answers suggest a repeated pattern of silent scorekeeping that turns other people’s happy moments into a referendum on your own worth. A brief pang of envy is human; this is what happens when you keep feeding it.

**THE CALL-OUT**

You are not secretly protecting your ambition. You are letting somebody else’s success ruin a moment that was never about you.

**THE COST**

Friends can sense when your congratulations come with an invisible comparison chart. Resentment makes their good news feel unsafe around you.

**TRY THIS**

Congratulate someone without a qualifying comment. Later, write down what their achievement stirred up in you and what action actually belongs to your life.

**THE KICKER**

They got the promotion. Somehow you opened a personal investigation.

*Apparently, your applause has a competitive subplot.*

**YOUR TRAITS (display only):** Comparative · Resentful · Approval-Sensitive

## Owner-approved editorial scoring and confidence gates (engine QA pending)

**Primary verdict scores:** Each selected answer supplies +2 points to its declared result, or +3 when marked high-confidence; optional explicitly identified secondary outcomes receive +1. These verdict points do not themselves grant Core or Relic awards.

**Harsh outcome protection:** Any harsh candidate requires at least 4 distinct primary outcome selections, including at least 2 marked high-confidence choices from its approved qualifying question list. Those choices must each describe the named harmful *behavior*, not merely a feeling, privacy, rest, attraction, or style preference. The candidate must still win on scores.

- **FAKE gate:** ≥4 primary answers, including ≥2 high-confidence signals from Q1B, Q2D, Q3C, Q5D, Q9A, Q9E, Q10C.
- **JEALOUS gate:** ≥4 primary answers, including ≥2 high-confidence signals from Q2A, Q5A, Q7D, Q10A.

**High-signal tie questions:** Q2, Q3, Q5, Q7, Q8, Q9, Q10.

**Exact tie resolution:** Highest eligible total → high-signal total → primary-support count → fixed fallback CONSISTENT → PRIVATE → ADAPTIVE → FAKE → JEALOUS. No “close second.”

**Identity evidence:** Only the ID-specific answer mappings above can add raw personality evidence, when the user selects that answer on their first qualifying versioned completion. Blank layers are intentional. Same-dimension opposite poles never appear together on one choice. No award is inferred from a call-out title, trait badge, or result prose. Historical first completions, content-version lineage, subscriptions, and any 18+ restrictions remain intact.

**Representative coherent answer paths** (Q1 through Q10; each path wins its named outcome under this draft point/gate logic):

- **CONSISTENT:** C · B · D · A · C · A · B · C · B · E. Winner CONSISTENT (20 verdict points; 10 primary answers; 0 qualifying harsh signals).
- **PRIVATE:** A · C · B · B · E · D · C · A · D · B. Winner PRIVATE (20 verdict points; 10 primary answers; 0 qualifying harsh signals).
- **ADAPTIVE:** D · E · A · D · B · C · E · E · C · D. Winner ADAPTIVE (20 verdict points; 10 primary answers; 0 qualifying harsh signals).
- **FAKE:** B · D · C · E · D · B · A · D · A · C. Winner FAKE (28 verdict points; 10 primary answers; 6 qualifying harsh signals).
- **JEALOUS:** E · A · E · C · A · A · D · A · B · A. Winner JEALOUS (18 verdict points; 7 primary answers; 4 qualifying harsh signals).

**Implementation validation required:** Re-run every reachability fixture with the production TypeScript + SQL scorers; test random and adversarial mixed patterns, gates, tie parity, versioned identity, exact trait ledger, retake non-inflation, historical preservation, entitlement, and accessibility. This is NOT a claim that production tests ran.

---

# QUIZ 2 | How Much Freedom Do You Really Need?
**Category:** Life Match  
**Approved stable quiz ID:** `life-match-freedom`  
**Status:** REQUIRED for original two-per-category 16-quiz lineup  
**Eyebrow:** APPARENTLY PRIVATE · LIFE MATCH  
**Subtitle:** Everybody wants freedom until freedom sends an invoice.  
**Intro:** We are checking independence, structure, exhaustion, and who actually pays for your choices.  
**Small print:** Answer for what you usually do, not what sounds most respectable.  
**Meta:** 10 questions · Approximately 3–4 minutes  
**CTA:** Let me loose →

## Full questions, options, verdict weights, and personality evidence

### QUESTION 1 OF 10
**Your manager says, “Nobody will check when you start or stop. Just deliver Friday.” What actually happens?**

**A.** I work in my own order and send the finished thing Thursday night.

- **Verdict:** OWNED +2
- **Creature/Core:** #13 Independent +2; #1 Planner +1
- **Relic/Private:** #55 Duty-first +2

**B.** Friday arrives and I’m explaining why “flexible” felt like “optional.”

- **Verdict:** IRRESPONSIBLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #16 Let it play out +2
- **Relic/Private:** #42 Defensiveness +2; #56 Self-preserving +1

**C.** I set a few check-ins with myself. No micromanaging required.

- **Verdict:** STRUCTURE +2
- **Creature/Core:** #1 Planner +3
- **Relic/Private:** No confident trait evidence

**D.** I do the work, then realize how much energy I used to spend looking busy.

- **Verdict:** RELIEF +2
- **Creature/Core:** #17 Practical +1
- **Relic/Private:** #43 Reflective +1; #56 Self-preserving +2

**E.** I quietly move the worst tasks to a teammate and still put my name on the finished work.

- **Verdict:** ENTITLED +2
- **Creature/Core:** #15 Control +1
- **Relic/Private:** #62 Self-referencing +3; #42 Defensiveness +1


### QUESTION 2 OF 10
**You book a group trip. Three people sent their money; one has not. You are the one who hasn’t paid. What next?**

**A.** “Can someone cover me until next week?” I asked that last week, too.

- **Verdict:** ENTITLED +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #12 Comfort-seeking +1
- **Relic/Private:** #62 Self-referencing +3; #60 Keeps score +1

**B.** “I’m short. Don’t book my spot. I’ll join if I can pay.”

- **Verdict:** OWNED +2
- **Creature/Core:** #17 Practical +2; #5 Direct +1
- **Relic/Private:** #41 Accountability +2

**C.** I stop answering the group chat and hope the reservation sorts itself out.

- **Verdict:** IRRESPONSIBLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +1; #16 Let it play out +2
- **Relic/Private:** #42 Defensiveness +2

**D.** I check my budget before confirming. This is exactly why I keep a travel fund.

- **Verdict:** STRUCTURE +2
- **Creature/Core:** #1 Planner +2; #17 Practical +2
- **Relic/Private:** No confident trait evidence

**E.** I say I cannot afford it and step out of the booking. Nobody has to chase me for my share.

- **Verdict:** OWNED +2
- **Creature/Core:** #17 Practical +2; #34 Decisive +1
- **Relic/Private:** #41 Accountability +1


### QUESTION 3 OF 10
**You wake up to a completely empty Saturday. Which version sounds best?**

**A.** Phone on silent. I might not get dressed until lunch. I need a day back.

- **Verdict:** RELIEF +2
- **Creature/Core:** #40 Content +1
- **Relic/Private:** #56 Self-preserving +2

**B.** Coffee, a couple errands, then I can relax without thinking about them.

- **Verdict:** STRUCTURE +2
- **Creature/Core:** #1 Planner +1; #17 Practical +1
- **Relic/Private:** No confident trait evidence

**C.** I decide as I go. I can handle Monday’s obligations when they arrive.

- **Verdict:** OWNED +2
- **Creature/Core:** #2 Spontaneous +2; #13 Independent +1
- **Relic/Private:** #55 Duty-first +1

**D.** I want the whole day free, so I tell my partner to handle the things we both agreed to do.

- **Verdict:** ENTITLED +2
- **Creature/Core:** #10 Hands-off +1
- **Relic/Private:** #62 Self-referencing +2; #56 Self-preserving +1

**E.** I make five plans. By noon I’ve forgotten which people I told I’d show up.

- **Verdict:** IRRESPONSIBLE +2
- **Creature/Core:** #2 Spontaneous +2
- **Relic/Private:** #44 Reactive +1


### QUESTION 4 OF 10
**A recurring bill catches you by surprise for the third month in a row. What is the real fix?**

**A.** Put the due date on autopay with an alert. My brain needs backup.

- **Verdict:** STRUCTURE +2
- **Creature/Core:** #1 Planner +3; #17 Practical +1
- **Relic/Private:** No confident trait evidence

**B.** Ask a relative to spot me again. They’re better with money, anyway.

- **Verdict:** ENTITLED +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #10 Hands-off +1
- **Relic/Private:** #62 Self-referencing +3

**C.** Cut a subscription first. I’ve had too many expenses pretending to be small.

- **Verdict:** RELIEF +2
- **Creature/Core:** #17 Practical +2
- **Relic/Private:** #43 Reflective +2; #56 Self-preserving +1

**D.** Pay the late fee and swear I’ll remember next month. I have said that before.

- **Verdict:** IRRESPONSIBLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #16 Let it play out +2
- **Relic/Private:** #42 Defensiveness +1

**E.** I look at three months of statements and change what actually caused it.

- **Verdict:** OWNED +2
- **Creature/Core:** #17 Practical +2; #26 Verify first +1
- **Relic/Private:** #41 Accountability +2


### QUESTION 5 OF 10
**Someone says, “You can’t just do whatever you want.” What part bothers you?**

**A.** The assumption I haven’t considered consequences. Sometimes I absolutely have.

- **Verdict:** OWNED +2
- **Creature/Core:** #13 Independent +2
- **Relic/Private:** #45 Self-secure +1

**B.** That I’ve spent years asking permission for basic time to myself.

- **Verdict:** RELIEF +2
- **Creature/Core:** #13 Independent +1
- **Relic/Private:** #47 Boundary-holding +2; #56 Self-preserving +2

**C.** Why should I have to explain myself when other people can deal with the fallout?

- **Verdict:** ENTITLED +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #22 Rule-bending +2
- **Relic/Private:** #62 Self-referencing +3

**D.** Nothing, if the agreement was fair. I like knowing the rules before I commit.

- **Verdict:** STRUCTURE +2
- **Creature/Core:** #21 Rule-oriented +1; #1 Planner +1
- **Relic/Private:** #41 Accountability +1

**E.** The word “can’t.” I usually say yes before I figure out the practical part.

- **Verdict:** IRRESPONSIBLE +2
- **Creature/Core:** #2 Spontaneous +2
- **Relic/Private:** #44 Reactive +1


### QUESTION 6 OF 10
**Your friend is moving. You promised to help at 9 a.m. You wake up at 8:52. Be serious.**

**A.** I turn my alarm off. They’ll probably have enough hands.

- **Verdict:** IRRESPONSIBLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #16 Let it play out +2
- **Relic/Private:** #55 Duty-first +1; #42 Defensiveness +1

**B.** Shoes, keys, coffee in the car. Yesterday-me packed the trunk.

- **Verdict:** STRUCTURE +2
- **Creature/Core:** #1 Planner +2; #17 Practical +1
- **Relic/Private:** #55 Duty-first +2

**C.** “I overslept. I’m on the way. I’ll stay late to make up for it.”

- **Verdict:** OWNED +2
- **Creature/Core:** #34 Decisive +1
- **Relic/Private:** #41 Accountability +3; #55 Duty-first +2

**D.** I show up, then decide not to volunteer next time unless I can actually make it.

- **Verdict:** OWNED +2
- **Creature/Core:** #17 Practical +1
- **Relic/Private:** #55 Duty-first +1; #47 Boundary-holding +2

**E.** “Actually, can you come pick me up?” The friend with the moving truck.

- **Verdict:** ENTITLED +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #62 Self-referencing +2


### QUESTION 7 OF 10
**Your ideal relationship includes a lot of personal space. How would that work in practice?**

**A.** We put alone time on the calendar so neither person has to guess.

- **Verdict:** STRUCTURE +2
- **Creature/Core:** #1 Planner +1; #14 Collaborative +1
- **Relic/Private:** #53 Tactful +1

**B.** I need a night without being asked for decisions. I say that plainly.

- **Verdict:** RELIEF +2
- **Creature/Core:** #5 Direct +1
- **Relic/Private:** #47 Boundary-holding +2; #56 Self-preserving +2

**C.** We each have our lives, and we still show up for shared responsibilities.

- **Verdict:** OWNED +2
- **Creature/Core:** #13 Independent +2; #17 Practical +1
- **Relic/Private:** #55 Duty-first +2; #47 Boundary-holding +1

**D.** I disappear when the relationship feels demanding and resurface when I’m lonely.

- **Verdict:** IRRESPONSIBLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +2
- **Relic/Private:** #50 Armored +2; #42 Defensiveness +1

**E.** I expect them to respect my space. Their need for support can wait until I feel social.

- **Verdict:** ENTITLED +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #10 Hands-off +2
- **Relic/Private:** #62 Self-referencing +2; #56 Self-preserving +1


### QUESTION 8 OF 10
**You could quit tomorrow with enough savings for six months. What would you do first?**

**A.** Sleep for three days, then find out what I actually want.

- **Verdict:** RELIEF +2
- **Creature/Core:** #40 Content +1
- **Relic/Private:** #56 Self-preserving +3; #43 Reflective +1

**B.** Work out expenses and a timeline. If the numbers work, I leave.

- **Verdict:** OWNED +2
- **Creature/Core:** #17 Practical +2; #34 Decisive +1
- **Relic/Private:** #41 Accountability +1

**C.** Tell my roommate they’ll need to cover more while I “figure things out.” I haven’t asked.

- **Verdict:** ENTITLED +2
- **Creature/Core:** #16 Let it play out +1
- **Relic/Private:** #62 Self-referencing +3

**D.** Start searching for something with a better schedule before resigning.

- **Verdict:** STRUCTURE +2
- **Creature/Core:** #1 Planner +2; #39 Ambitious +1
- **Relic/Private:** No confident trait evidence

**E.** Walk out mid-shift, then panic about rent a month later.

- **Verdict:** IRRESPONSIBLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #2 Spontaneous +3
- **Relic/Private:** #44 Reactive +2


### QUESTION 9 OF 10
**A teammate says your last-minute changes make their job harder. What is your response?**

**A.** “Show me where I caused the rework. I’ll fix my part.”

- **Verdict:** OWNED +2
- **Creature/Core:** #5 Direct +1
- **Relic/Private:** #41 Accountability +3; #61 Perspective-taking +1

**B.** “You’re organized. You’ll figure it out.” I say that like a compliment.

- **Verdict:** ENTITLED +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #62 Self-referencing +3

**C.** “It worked out, didn’t it?” I don’t ask how much cleanup it took.

- **Verdict:** IRRESPONSIBLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #16 Let it play out +2
- **Relic/Private:** #42 Defensiveness +2

**D.** I accept the feedback and propose a cutoff for changes. Then I follow it.

- **Verdict:** OWNED +2
- **Creature/Core:** #17 Practical +1
- **Relic/Private:** #41 Accountability +2

**E.** I realize I keep changing things because I’m overloaded. I ask to reduce scope.

- **Verdict:** RELIEF +2
- **Creature/Core:** #17 Practical +1
- **Relic/Private:** #43 Reflective +2; #49 Vulnerable +1


### QUESTION 10 OF 10
**The app could show one real receipt from the last 30 days. Which one would feel most accurate?**

**A.** Three “quick favors” other people did for me that I never acknowledged or repaid.

- **Verdict:** ENTITLED +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #60 Keeps score +2; #62 Self-referencing +3

**B.** A rare evening where nobody asked anything of me, and I cried from relief.

- **Verdict:** RELIEF +2
- **Creature/Core:** #3 Emotionally Intense +1
- **Relic/Private:** #56 Self-preserving +3

**C.** A missed commitment I blamed on being a free spirit even though I simply didn’t prepare.

- **Verdict:** IRRESPONSIBLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #2 Spontaneous +1
- **Relic/Private:** #42 Defensiveness +2

**D.** A boundary I kept without dropping the promises that were mine.

- **Verdict:** OWNED +2
- **Creature/Core:** #13 Independent +1
- **Relic/Private:** #47 Boundary-holding +3; #55 Duty-first +2

**E.** A reminder on my phone that saved me from forgetting something important.

- **Verdict:** STRUCTURE +2
- **Creature/Core:** #1 Planner +2; #17 Practical +1
- **Relic/Private:** No confident trait evidence

## All five complete result reveals

### FREE. AND ACTUALLY RESPONSIBLE.
**Internal outcome ID:** `owned`

**THE VERDICT**

You do not need supervision to keep your word.

**THE PRIVATE READ**

You choose your own structure, understand the consequences of your decisions, and accept that freedom includes work nobody applauds. You can say no, make changes, and still meet the commitments you voluntarily accepted. You do not mistake a boundary for a blank check to abandon others.

**THE CALL-OUT**

Being dependable does not make you the designated adult for everybody else.

**THE COST**

You may keep taking on more because you are capable of carrying it.

**TRY THIS**

Review your calendar. Keep commitments that are yours; return one responsibility that was never yours to begin with.

**THE KICKER**

Nobody chased you. The thing still got done. Imagine.

*Apparently, accountability looks good with freedom.*

**YOUR TRAITS (display only):** Self-Directed · Reliable · Boundaried

### YOU LOVE FREEDOM. WITH A CALENDAR INVITE.
**Internal outcome ID:** `structure`

**THE VERDICT**

You want autonomy, not chaos.

**THE PRIVATE READ**

You thrive when expectations are clear and you can choose how to meet them. You prefer a predictable routine with room to make your own decisions. Spontaneity has its place, but you do not need to set your life on fire to prove you are independent.

**THE CALL-OUT**

Sometimes you call unfamiliar plans “bad plans” before you have actually considered them.

**THE COST**

Too much structure can keep you from opportunities that demand experimentation.

**TRY THIS**

Leave one genuinely low-risk afternoon unplanned this month. Let the day develop without turning it into a productivity test.

**THE KICKER**

You want to be wild and free. Please add it to the calendar.

*Apparently, your freedom comes with reminders.*

**YOUR TRAITS (display only):** Structured · Independent · Consistent

### YOU NEED A BREAK. NOT A WHOLE NEW PERSONALITY.
**Internal outcome ID:** `relief`

**THE VERDICT**

This sounds like overload, not a hatred of responsibility.

**THE PRIVATE READ**

Your answers point toward too much demand and too little recovery. The life you imagine as “freedom” may really be ordinary rest, shared labor, and the ability to say no without managing everyone’s disappointment. Wanting room to breathe is not lazy or irresponsible.

**THE CALL-OUT**

Rest deserves a plan, too. If every request automatically gets a yes, the schedule will keep swallowing you.

**THE COST**

Resentment can build while you wait for someone else to notice you have reached capacity.

**TRY THIS**

Name the one obligation that could be shared, reduced, paused, or renegotiated. Ask concretely, not apologetically.

**THE KICKER**

Your dream vacation is a Tuesday when nobody needs your charger, signature, or decision.

*Apparently, freedom may look like actual backup.*

**YOUR TRAITS (display only):** Overextended · Reflective · Boundary-Seeking

### YOU'RE IRRESPONSIBLE. NOT FREE-SPIRITED.
**Internal outcome ID:** `irresponsible`

**THE VERDICT**

You want the choice without the follow-through.

**THE PRIVATE READ**

Your answers describe promises made casually, deadlines ignored when something more fun appears, and messes left for other people to untangle. We are not talking about burnout, limited resources, or choosing a different life. We are talking about commitments you had the ability to manage and repeatedly did not.

**THE CALL-OUT**

Stop calling broken promises spontaneity. Somebody else is paying for the freedom you keep taking.

**THE COST**

People eventually stop believing your yes. Opportunities shrink when reliability is optional only for you.

**TRY THIS**

Choose the commitment you have been dodging. Complete it, or clearly renegotiate it before someone else has to rescue you.

**THE KICKER**

You said, “I work best without rules.” The overdue notices disagreed.

*Apparently, freedom does not come with a complimentary cleanup crew.*

**YOUR TRAITS (display only):** Unreliable · Avoidant · Consequence-Blind

### YOU'RE ENTITLED. EVERYBODY ELSE IS YOUR BACKUP PLAN.
**Internal outcome ID:** `entitled`

**THE VERDICT**

You want independence until it is time to absorb the cost.

**THE PRIVATE READ**

You describe your preferences as nonnegotiable while expecting other people to adjust their schedules, fix the consequences, or fund the comfort you chose. This is not about needing legitimate help. It is about assuming your freedom matters more than someone else’s time and obligations.

**THE CALL-OUT**

You do not get to call yourself independent while assigning your responsibilities to people who never agreed to them.

**THE COST**

Relationships become a one-way service arrangement. People may stop offering help because they know a favor becomes a permanent job.

**TRY THIS**

List every recurring task another person handles because of your preferences. Agree on a fair division and take responsibility for one entire task without reminders.

**THE KICKER**

Your personal freedom apparently has a staff meeting. You are never on the agenda.

*Apparently, the help was supposed to be a favor, not your operating model.*

**YOUR TRAITS (display only):** Entitled · Self-Focused · Externally Dependent

## Owner-approved editorial scoring and confidence gates (engine QA pending)

**Primary verdict scores:** Each selected answer supplies +2 points to its declared result, or +3 when marked high-confidence; optional explicitly identified secondary outcomes receive +1. These verdict points do not themselves grant Core or Relic awards.

**Harsh outcome protection:** Any harsh candidate requires at least 4 distinct primary outcome selections, including at least 2 marked high-confidence choices from its approved qualifying question list. Those choices must each describe the named harmful *behavior*, not merely a feeling, privacy, rest, attraction, or style preference. The candidate must still win on scores.

- **IRRESPONSIBLE gate:** ≥4 primary answers, including ≥2 high-confidence signals from Q1B, Q2C, Q4D, Q6A, Q7D, Q8E, Q9C, Q10C.
- **ENTITLED gate:** ≥4 primary answers, including ≥2 high-confidence signals from Q2A, Q4B, Q5C, Q6E, Q7E, Q9B, Q10A.

**High-signal tie questions:** Q2, Q3, Q5, Q6, Q7, Q9, Q10.

**Exact tie resolution:** Highest eligible total → high-signal total → primary-support count → fixed fallback OWNED → STRUCTURE → RELIEF → IRRESPONSIBLE → ENTITLED. No “close second.”

**Identity evidence:** Only the ID-specific answer mappings above can add raw personality evidence, when the user selects that answer on their first qualifying versioned completion. Blank layers are intentional. Same-dimension opposite poles never appear together on one choice. No award is inferred from a call-out title, trait badge, or result prose. Historical first completions, content-version lineage, subscriptions, and any 18+ restrictions remain intact.

**Representative coherent answer paths** (Q1 through Q10; each path wins its named outcome under this draft point/gate logic):

- **OWNED:** A · B · C · E · A · C · C · B · A · D. Winner OWNED (20 verdict points; 10 primary answers; 0 qualifying harsh signals).
- **STRUCTURE:** C · D · B · A · D · B · A · D · A · E. Winner STRUCTURE (18 verdict points; 9 primary answers; 0 qualifying harsh signals).
- **RELIEF:** D · B · A · C · B · B · B · A · E · B. Winner RELIEF (16 verdict points; 8 primary answers; 0 qualifying harsh signals).
- **IRRESPONSIBLE:** B · C · E · D · E · A · D · E · C · C. Winner IRRESPONSIBLE (28 verdict points; 10 primary answers; 8 qualifying harsh signals).
- **ENTITLED:** E · A · D · B · C · E · E · C · B · A. Winner ENTITLED (27 verdict points; 10 primary answers; 7 qualifying harsh signals).

**Implementation validation required:** Re-run every reachability fixture with the production TypeScript + SQL scorers; test random and adversarial mixed patterns, gates, tie parity, versioned identity, exact trait ledger, retake non-inflation, historical preservation, entitlement, and accessibility. This is NOT a claim that production tests ran.

---

# QUIZ 3 | What Kind of Attention Do You Attract?
**Category:** Style & Vibe  
**Approved stable quiz ID:** `style-vibe-attention`  
**Status:** REQUIRED for original two-per-category 16-quiz lineup  
**Eyebrow:** APPARENTLY PRIVATE · STYLE & VIBE  
**Subtitle:** The room noticed something. We are finding out what you actually sent.  
**Intro:** Not the vibe you ordered. The one other people experience when you arrive, speak, celebrate, or leave.  
**Small print:** Answer for what you usually do, not what sounds most respectable.  
**Meta:** 10 questions · Approximately 3–4 minutes  
**CTA:** Read the room →

## Full questions, options, verdict weights, and personality evidence

### QUESTION 1 OF 10
**You arrive alone at a party where you know exactly one person. What do the first ten minutes look like?**

**A.** I find somewhere comfortable and wait until a conversation actually interests me.

- **Verdict:** RESERVED +2
- **Creature/Core:** #35 Private +2; #4 Even-Keeled +1
- **Relic/Private:** No confident trait evidence

**B.** I end up talking to the person who looked as awkward as I felt walking in.

- **Verdict:** WELCOMING +2
- **Creature/Core:** #7 Vibe checker +2; #14 Collaborative +1
- **Relic/Private:** #57 Supportive +2

**C.** I make an entrance, then quietly check who looked up. The outfit had a mission.

- **Verdict:** ATTENTION +2
- **Creature/Core:** #29 Playful +1
- **Relic/Private:** #48 Approval-seeking +2

**D.** Someone asks about my earrings; suddenly we’re discussing our entire childhoods.

- **Verdict:** MAGNETIC +2
- **Creature/Core:** #36 Open +1; #29 Playful +1
- **Relic/Private:** No confident trait evidence

**E.** I tell the host their setup is strange before I even put down my coat.

- **Verdict:** RUDE +2
- **Creature/Core:** #5 Direct +1
- **Relic/Private:** #54 Blunt +2


### QUESTION 2 OF 10
**Your friend tells a story at dinner. Everyone is laughing, but you have a better story. Go.**

**A.** I cut in at the funniest part. Mine is relevant enough. Probably.

- **Verdict:** ATTENTION +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #31 Competitive +2; #38 Urgent +1
- **Relic/Private:** #62 Self-referencing +3

**B.** I let them land the joke, then ask what happened next.

- **Verdict:** WELCOMING +2
- **Creature/Core:** #7 Vibe checker +1
- **Relic/Private:** #57 Supportive +1; #61 Perspective-taking +2

**C.** “This is taking forever.” I say it out loud and reach for the menu.

- **Verdict:** RUDE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #54 Blunt +3; #62 Self-referencing +1

**D.** I listen. My best stories usually come out one-on-one, not at a long table.

- **Verdict:** RESERVED +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** No confident trait evidence

**E.** I add one ridiculous detail from when I was there, and we both end up laughing.

- **Verdict:** MAGNETIC +2
- **Creature/Core:** #29 Playful +2
- **Relic/Private:** #57 Supportive +1


### QUESTION 3 OF 10
**You post a photo that gets almost no reaction. Which private thought is closest?**

**A.** “Oh well.” I liked the photo, and my camera roll agrees.

- **Verdict:** MAGNETIC +2
- **Creature/Core:** #40 Content +1
- **Relic/Private:** #45 Self-secure +2

**B.** “Did it even post?” Then I refresh enough times to qualify as quality assurance.

- **Verdict:** ATTENTION +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #38 Urgent +1
- **Relic/Private:** #46 Reassurance-seeking +2; #48 Approval-seeking +2

**C.** A friend comments; we end up chatting in DMs. That was more fun than the likes.

- **Verdict:** WELCOMING +2
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #57 Supportive +1

**D.** I decide the algorithm hates me and post another photo with a caption asking why everyone is so quiet.

- **Verdict:** ATTENTION +2
- **Creature/Core:** #29 Playful +1
- **Relic/Private:** #48 Approval-seeking +2; #46 Reassurance-seeking +1

**E.** I notice a friend commented and answer them. That’s nice.

- **Verdict:** WELCOMING +2
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #57 Supportive +1


### QUESTION 4 OF 10
**At work, a newer teammate makes a suggestion you think will fail. In the meeting, you...**

**A.** ...say, “That makes no sense,” before they finish explaining.

- **Verdict:** RUDE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #5 Direct +2; #38 Urgent +1
- **Relic/Private:** #54 Blunt +3

**B.** ...ask a question that gives them room to explain the part I may be missing.

- **Verdict:** WELCOMING +2
- **Creature/Core:** #33 Curious +1; #32 Cooperative +1
- **Relic/Private:** #53 Tactful +2; #61 Perspective-taking +2

**C.** ...offer a different path with energy that gets everybody brainstorming.

- **Verdict:** MAGNETIC +2
- **Creature/Core:** #33 Curious +2; #5 Direct +1
- **Relic/Private:** #58 Challenging +1

**D.** ...take notes and follow up afterward rather than challenge them publicly.

- **Verdict:** RESERVED +2
- **Creature/Core:** #35 Private +1
- **Relic/Private:** #53 Tactful +1

**E.** ...turn the discussion toward the approach I proposed last month. They probably forgot.

- **Verdict:** ATTENTION +2
- **Creature/Core:** #31 Competitive +1
- **Relic/Private:** #48 Approval-seeking +2


### QUESTION 5 OF 10
**Someone you barely know starts telling you something painful. What do you do?**

**A.** “That sounds like a lot. Do you want me to listen or help figure something out?”

- **Verdict:** WELCOMING +2
- **Creature/Core:** #7 Vibe checker +2
- **Relic/Private:** #57 Supportive +2; #61 Perspective-taking +2

**B.** I listen kindly, but I don’t offer my own life story in exchange.

- **Verdict:** RESERVED +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** #47 Boundary-holding +1

**C.** “Okay, but why would you do that?” The judgment is already in my voice.

- **Verdict:** RUDE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #54 Blunt +2; #62 Self-referencing +1

**D.** We talk for half an hour. I skip my next errand because they clearly need someone to listen.

- **Verdict:** WELCOMING +2
- **Creature/Core:** #7 Vibe checker +1
- **Relic/Private:** #57 Supportive +2

**E.** I steer it to my own similar experience, because mine was honestly wilder.

- **Verdict:** ATTENTION +2
- **Creature/Core:** #3 Emotionally Intense +1
- **Relic/Private:** #62 Self-referencing +2


### QUESTION 6 OF 10
**Your name is mentioned during an awards speech. Not as the winner. How do you react?**

**A.** I spend the rest of the night making sure everybody knows how much I contributed.

- **Verdict:** ATTENTION +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #31 Competitive +2
- **Relic/Private:** #48 Approval-seeking +3; #60 Keeps score +1

**B.** A small nod. I’m relieved I didn’t have to go onstage.

- **Verdict:** RESERVED +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** No confident trait evidence

**C.** I clap for the winner. They did excellent work.

- **Verdict:** WELCOMING +2
- **Creature/Core:** #32 Cooperative +2
- **Relic/Private:** #57 Supportive +2

**D.** I make a joke afterward that gets the entire table laughing, including the winner.

- **Verdict:** MAGNETIC +2
- **Creature/Core:** #29 Playful +3
- **Relic/Private:** No confident trait evidence

**E.** “Interesting choice,” I say where the winner can hear me.

- **Verdict:** RUDE +2
- **Creature/Core:** #31 Competitive +1
- **Relic/Private:** #54 Blunt +2; #60 Keeps score +1


### QUESTION 7 OF 10
**Which exact sentence are you most likely to hear from someone who just met you?**

**A.** “I was only going to stay ten minutes, but talking to you was fun.”

- **Verdict:** MAGNETIC +2
- **Creature/Core:** #29 Playful +1; #36 Open +1
- **Relic/Private:** No confident trait evidence

**B.** “I thought you were going to be nicer.” I’d already given them an unsolicited critique.

- **Verdict:** RUDE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #5 Direct +1
- **Relic/Private:** #54 Blunt +3

**C.** “I thought you didn’t like me until we actually talked.”

- **Verdict:** RESERVED +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** No confident trait evidence

**D.** “You really know how to bring every conversation back to yourself.” I laugh it off.

- **Verdict:** ATTENTION +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #62 Self-referencing +3; #48 Approval-seeking +1

**E.** “I’m glad you came over. I was nervous too.”

- **Verdict:** WELCOMING +2
- **Creature/Core:** #7 Vibe checker +2; #14 Collaborative +1
- **Relic/Private:** #57 Supportive +1


### QUESTION 8 OF 10
**A friend shows you their new haircut and asks, “Be honest.” You think it is bad. What comes out?**

**A.** “It’s giving helmet.” I’m not going to lie just to be cute.

- **Verdict:** RUDE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #5 Direct +2; #29 Playful +1
- **Relic/Private:** #54 Blunt +3

**B.** “You were brave to try something new.” I mean it, even if the cut is not for me.

- **Verdict:** WELCOMING +2
- **Creature/Core:** #32 Cooperative +1
- **Relic/Private:** #57 Supportive +2

**C.** “The color looks great. If you want an honest opinion on the cut, I have one.”

- **Verdict:** WELCOMING +2
- **Creature/Core:** #5 Direct +1
- **Relic/Private:** #53 Tactful +3; #57 Supportive +1

**D.** “You should have asked me first. You could have avoided that.” It comes out in front of everyone.

- **Verdict:** RUDE +2
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #54 Blunt +2

**E.** “Are you happy with it?” I’m not volunteering a full review if they love it.

- **Verdict:** RESERVED +2
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #53 Tactful +1


### QUESTION 9 OF 10
**Your group makes plans without you. You see the pictures afterward. What happens?**

**A.** I notice, but honestly I was home enjoying my quiet evening.

- **Verdict:** RESERVED +2
- **Creature/Core:** #35 Private +1; #40 Content +1
- **Relic/Private:** No confident trait evidence

**B.** “That looks fun! Next time, count me in.” And I mean it.

- **Verdict:** WELCOMING +2
- **Creature/Core:** #5 Direct +1
- **Relic/Private:** #45 Self-secure +1

**C.** I post something cryptic about loyalty. Everyone gets to wonder who hurt me.

- **Verdict:** ATTENTION +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +2; #3 Emotionally Intense +1
- **Relic/Private:** #48 Approval-seeking +2; #52 Punishing +2

**D.** I message one person: “Where is this place? It looks amazing.”

- **Verdict:** MAGNETIC +2
- **Creature/Core:** #33 Curious +1
- **Relic/Private:** No confident trait evidence

**E.** I send “Wow, fake friends” in the group chat and start naming names.

- **Verdict:** RUDE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #23 Conflict-forward +2
- **Relic/Private:** #54 Blunt +2; #44 Reactive +2


### QUESTION 10 OF 10
**Apparently plays you a recording of one social moment you wish you could redo. Which one is it?**

**A.** I missed someone trying to join our conversation. I would make room next time.

- **Verdict:** WELCOMING +2
- **Creature/Core:** #7 Vibe checker +1
- **Relic/Private:** #41 Accountability +2; #61 Perspective-taking +2

**B.** I made my friend’s big announcement about a dramatic thing happening to me.

- **Verdict:** ATTENTION +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #31 Competitive +1
- **Relic/Private:** #62 Self-referencing +3; #48 Approval-seeking +2

**C.** I got carried away telling a story and forgot to ask anybody else a question.

- **Verdict:** MAGNETIC +2
- **Creature/Core:** #29 Playful +1
- **Relic/Private:** #41 Accountability +1

**D.** I called someone “too sensitive” after humiliating them in front of other people.

- **Verdict:** RUDE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #5 Direct +1
- **Relic/Private:** #54 Blunt +3; #42 Defensiveness +2

**E.** I stayed so far out of it that someone thought I was upset with them.

- **Verdict:** RESERVED +2
- **Creature/Core:** #35 Private +1
- **Relic/Private:** #50 Armored +1

## All five complete result reveals

### YOU MAKE PEOPLE FEEL INVITED.
**Internal outcome ID:** `welcoming`

**THE VERDICT**

Attention follows the comfort you create.

**THE PRIVATE READ**

You make small gestures that help others join a conversation, ask questions without turning everything toward yourself, and notice people who would otherwise fade into the background. You are not necessarily the loudest person in the room. Your presence becomes noticeable because others relax around you.

**THE CALL-OUT**

Being approachable can attract people who treat your attention as unlimited.

**THE COST**

You may leave social situations drained if you rarely protect your own time.

**TRY THIS**

Let one interaction end without taking responsibility for everybody else having a good time.

**THE KICKER**

They met you six minutes ago and have already told you their life story.

*Apparently, your vibe has an open-door policy.*

**YOUR TRAITS (display only):** Welcoming · Attentive · Generous

### YOU ARE NOT COLD. YOU ARE JUST NOT PERFORMING.
**Internal outcome ID:** `reserved`

**THE VERDICT**

Your quietness gets interpreted before you get to explain it.

**THE PRIVATE READ**

You are more comfortable observing than commanding a room. You may be careful with your energy and choose conversation when you have something real to contribute. Other people can mistake restraint for disinterest, but your answers do not show a pattern of belittling or rejecting them.

**THE CALL-OUT**

People cannot read your intentions from silence alone. If you want connection, give it a little signal.

**THE COST**

A potentially good conversation can end before it starts because nobody knows whether you welcome one.

**TRY THIS**

Offer a clear greeting or follow-up question when you are interested. You do not need to put on a performance.

**THE KICKER**

The room wrote a whole story. You had barely said hello.

*Apparently, low volume is not the same thing as bad energy.*

**YOUR TRAITS (display only):** Reserved · Observant · Selective

### YOU HAVE PRESENCE. YOU DO NOT HAVE TO CHASE IT.
**Internal outcome ID:** `magnetic`

**THE VERDICT**

You know how to carry yourself without making the room pay for it.

**THE PRIVATE READ**

You can speak confidently, make an entrance, and enjoy being seen without using somebody else as a prop. You take interest in people, own your contributions, and let others enjoy their own spotlight. This is attraction without an invoice.

**THE CALL-OUT**

A powerful presence can still leave quieter people behind. Do not confuse their silence with agreement.

**THE COST**

People may assume you are always in control, even when you need support.

**TRY THIS**

At your next group gathering, use some of your influence to bring a quieter person into the conversation.

**THE KICKER**

You walked in, said hello, and somehow the room adjusted its posture.

*Apparently, presence beats performance.*

**YOUR TRAITS (display only):** Confident · Engaging · Grounded

### YOU'RE AN ATTENTION SEEKER. JUST ADMIT IT.
**Internal outcome ID:** `attention`

**THE VERDICT**

The moment stops feeling good when it is not about you.

**THE PRIVATE READ**

Your answers show a repeated habit of redirecting stories, inflating experiences, or engineering a reaction whenever somebody else has the room. You do not simply enjoy being noticed. You work to stay in the center, even when the moment belongs to somebody else.

**THE CALL-OUT**

Stop saying “I hate attention” right after manufacturing an event to get more of it. You want the spotlight. The issue is what you do to keep it.

**THE COST**

Other people stop bringing you their news because you turn every celebration into your own episode.

**TRY THIS**

At the next gathering, let someone finish their story without topping it. Ask two follow-up questions and offer no competing anecdote.

**THE KICKER**

They announced an engagement. You somehow unveiled your own subplot.

*Apparently, the spotlight has your forwarding address.*

**YOUR TRAITS (display only):** Approval-Driven · Competitive · Spotlight-Seeking

### YOU'RE RUDE. STOP CALLING IT CONFIDENCE.
**Internal outcome ID:** `rude`

**THE VERDICT**

You keep confusing making an impression with making somebody feel small.

**THE PRIVATE READ**

You describe interrupting, embarrassing people, delivering unsolicited put-downs, and dismissing objections as “just being honest.” These are choices, not side effects of a strong personality. Your answers show repeated disregard for the people who have to absorb the delivery.

**THE CALL-OUT**

Being direct is not a license to be disrespectful. If everybody needs recovery time after your “honesty,” the problem is not that they are too sensitive.

**THE COST**

People prepare defenses instead of sharing ideas. Eventually they avoid you rather than risk another public correction.

**TRY THIS**

Apologize for one specific put-down without explaining why the person deserved it. Next time, ask permission before giving criticism.

**THE KICKER**

You did not “keep it real.” You made the room uncomfortable and called that winning.

*Apparently, your confidence needs a manners check.*

**YOUR TRAITS (display only):** Blunt · Dismissive · Confrontational

## Owner-approved editorial scoring and confidence gates (engine QA pending)

**Primary verdict scores:** Each selected answer supplies +2 points to its declared result, or +3 when marked high-confidence; optional explicitly identified secondary outcomes receive +1. These verdict points do not themselves grant Core or Relic awards.

**Harsh outcome protection:** Any harsh candidate requires at least 4 distinct primary outcome selections, including at least 2 marked high-confidence choices from its approved qualifying question list. Those choices must each describe the named harmful *behavior*, not merely a feeling, privacy, rest, attraction, or style preference. The candidate must still win on scores.

- **ATTENTION gate:** ≥4 primary answers, including ≥2 high-confidence signals from Q2A, Q3B, Q6A, Q7D, Q9C, Q10B.
- **RUDE gate:** ≥4 primary answers, including ≥2 high-confidence signals from Q2C, Q4A, Q5C, Q7B, Q8A, Q9E, Q10D.

**High-signal tie questions:** Q2, Q3, Q4, Q5, Q7, Q8, Q9, Q10.

**Exact tie resolution:** Highest eligible total → high-signal total → primary-support count → fixed fallback WELCOMING → RESERVED → MAGNETIC → ATTENTION → RUDE. No “close second.”

**Identity evidence:** Only the ID-specific answer mappings above can add raw personality evidence, when the user selects that answer on their first qualifying versioned completion. Blank layers are intentional. Same-dimension opposite poles never appear together on one choice. No award is inferred from a call-out title, trait badge, or result prose. Historical first completions, content-version lineage, subscriptions, and any 18+ restrictions remain intact.

**Representative coherent answer paths** (Q1 through Q10; each path wins its named outcome under this draft point/gate logic):

- **WELCOMING:** B · B · C · B · A · C · E · B · B · A. Winner WELCOMING (20 verdict points; 10 primary answers; 0 qualifying harsh signals).
- **RESERVED:** A · D · A · D · B · B · C · E · A · E. Winner RESERVED (18 verdict points; 9 primary answers; 0 qualifying harsh signals).
- **MAGNETIC:** D · E · A · C · A · D · A · B · D · C. Winner MAGNETIC (16 verdict points; 8 primary answers; 0 qualifying harsh signals).
- **ATTENTION:** C · A · B · E · E · A · D · B · C · B. Winner ATTENTION (24 verdict points; 9 primary answers; 6 qualifying harsh signals).
- **RUDE:** E · C · A · A · C · E · B · A · E · D. Winner RUDE (25 verdict points; 9 primary answers; 7 qualifying harsh signals).

**Implementation validation required:** Re-run every reachability fixture with the production TypeScript + SQL scorers; test random and adversarial mixed patterns, gates, tie parity, versioned identity, exact trait ledger, retake non-inflation, historical preservation, entitlement, and accessibility. This is NOT a claim that production tests ran.

---

# QUIZ 4 | What Do People Trust You With?
**Category:** The Good Stuff  
**Approved stable quiz ID:** `good-stuff-trust`  
**Status:** OWNER-APPROVED 17th launch quiz, included in the 17-quiz implementation target  
**Eyebrow:** APPARENTLY PRIVATE · THE GOOD STUFF  
**Subtitle:** Being trusted feels nice. Being trustworthy is where we check the receipts.  
**Intro:** Secrets, favors, hard truths, emergencies. What people hand you, and what happens after they leave.  
**Small print:** Answer for what you usually do, not what sounds most respectable.  
**Meta:** 10 questions · Approximately 3–4 minutes  
**CTA:** Check my record →

## Full questions, options, verdict weights, and personality evidence

### QUESTION 1 OF 10
**A friend says, “I need to tell you something, but nobody can know.” What is your first move?**

**A.** “Is anyone in danger?” Once I know it’s safe, I let them talk.

- **Verdict:** VAULT +2
- **Creature/Core:** #9 Protective +1; #26 Verify first +1
- **Relic/Private:** #47 Boundary-holding +2; #61 Perspective-taking +1

**B.** I listen, already wondering whether I can tell my sister without using names.

- **Verdict:** GOSSIP +2
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** No confident trait evidence

**C.** “Do you need me to just listen or help you deal with it?”

- **Verdict:** SHOWUP +2
- **Creature/Core:** #7 Vibe checker +1
- **Relic/Private:** #57 Supportive +3

**D.** “Can I come over? This sounds bigger than a text.”

- **Verdict:** SHOWUP +2
- **Creature/Core:** #9 Protective +1
- **Relic/Private:** #57 Supportive +2

**E.** “I’ll be honest with you, even if the answer isn’t the one you want.”

- **Verdict:** TRUTH +2
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #58 Challenging +2


### QUESTION 2 OF 10
**You agreed to pick someone up from the airport at 11 p.m. The flight is delayed to 1 a.m.**

**A.** I turn off my phone. They’ll find a rideshare. I’m already in bed.

- **Verdict:** UNRELIABLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #16 Let it play out +2
- **Relic/Private:** #42 Defensiveness +1

**B.** “Send me the updated landing time. I’ll be there.” I make more coffee.

- **Verdict:** SHOWUP +2
- **Creature/Core:** #17 Practical +1
- **Relic/Private:** #55 Duty-first +3

**C.** I keep the pickup details private. They told me this trip was personal.

- **Verdict:** VAULT +2
- **Creature/Core:** #35 Private +1
- **Relic/Private:** #47 Boundary-holding +2

**D.** “I can’t safely drive that late. I can pay half for a car.”

- **Verdict:** TRUTH +2
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #41 Accountability +2; #53 Tactful +1

**E.** Before they land I’ve told three people why they’re coming into town.

- **Verdict:** GOSSIP +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** No confident trait evidence


### QUESTION 3 OF 10
**A mutual friend asks why someone stopped drinking. You know the reason. What comes out?**

**A.** “I probably shouldn’t say this, but...” You can already hear the rest.

- **Verdict:** GOSSIP +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** No confident trait evidence

**B.** “That’s their story. Ask them if they want to talk about it.”

- **Verdict:** VAULT +2
- **Creature/Core:** #5 Direct +1; #35 Private +2
- **Relic/Private:** #47 Boundary-holding +3

**C.** “I don’t want to speculate or speak for them.”

- **Verdict:** TRUTH +2
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #53 Tactful +1

**D.** I change the subject and later check on my friend without making it weird.

- **Verdict:** SHOWUP +2
- **Creature/Core:** #7 Vibe checker +1
- **Relic/Private:** #57 Supportive +2

**E.** I promise to shut down the rumors, then never bother correcting anything.

- **Verdict:** UNRELIABLE +2
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** No confident trait evidence


### QUESTION 4 OF 10
**Someone asks for honest feedback on a presentation that has real problems. What do you do?**

**A.** “The opening works. The numbers on slide four don’t. Want help fixing them?”

- **Verdict:** TRUTH +2
- **Creature/Core:** #5 Direct +2; #17 Practical +1
- **Relic/Private:** #53 Tactful +2; #58 Challenging +2

**B.** I make an hour to rehearse it with them. They asked for help, not applause.

- **Verdict:** SHOWUP +2
- **Creature/Core:** #14 Collaborative +1
- **Relic/Private:** #55 Duty-first +2; #57 Supportive +2

**C.** “I’ll look tonight.” I don’t open it until they’re already presenting.

- **Verdict:** UNRELIABLE +2
- **Creature/Core:** #16 Let it play out +1
- **Relic/Private:** No confident trait evidence

**D.** I tell someone else the deck is a mess before the presenter gets a word from me.

- **Verdict:** GOSSIP +2
- **Creature/Core:** #6 Indirect +1
- **Relic/Private:** #48 Approval-seeking +1

**E.** I mark up the draft privately. No reason to announce their mistakes to the team.

- **Verdict:** VAULT +2
- **Creature/Core:** #35 Private +1
- **Relic/Private:** #53 Tactful +2


### QUESTION 5 OF 10
**You borrow $80 from a friend and promise to repay it on payday. Payday comes.**

**A.** I buy something fun, then hope they feel too awkward to ask.

- **Verdict:** UNRELIABLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #12 Comfort-seeking +1
- **Relic/Private:** #42 Defensiveness +2; #60 Keeps score +1

**B.** “I’m $20 short. Can I send $60 now and the rest Friday?”

- **Verdict:** TRUTH +2
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #41 Accountability +3

**C.** The payment lands before breakfast. They didn’t have to remind me.

- **Verdict:** SHOWUP +2
- **Creature/Core:** #1 Planner +1
- **Relic/Private:** #55 Duty-first +3

**D.** I pay them back and never turn their generosity into a story for other people.

- **Verdict:** VAULT +2
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #47 Boundary-holding +1

**E.** I complain to a mutual friend that they’re being weird about the money.

- **Verdict:** GOSSIP +2
- **Creature/Core:** #6 Indirect +1
- **Relic/Private:** #42 Defensiveness +2; #62 Self-referencing +1


### QUESTION 6 OF 10
**You know a coworker made a serious mistake. It has not been discovered. Your instinct?**

**A.** I bring it to them privately first, unless someone could be harmed by waiting.

- **Verdict:** VAULT +2
- **Creature/Core:** #26 Verify first +2
- **Relic/Private:** #53 Tactful +2; #47 Boundary-holding +1

**B.** “Not my problem.” I leave the error for whoever works the next shift.

- **Verdict:** UNRELIABLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #10 Hands-off +2
- **Relic/Private:** No confident trait evidence

**C.** I help fix the immediate problem, then make sure the right person knows.

- **Verdict:** SHOWUP +2
- **Creature/Core:** #17 Practical +2
- **Relic/Private:** #55 Duty-first +2; #41 Accountability +1

**D.** I tell the team it was a disaster before I tell the person who can fix it.

- **Verdict:** GOSSIP +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** No confident trait evidence

**E.** I report the facts without adding a character assassination.

- **Verdict:** TRUTH +2
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #41 Accountability +2; #53 Tactful +1


### QUESTION 7 OF 10
**A friend is having a terrible week. They say, “Can you come sit with me tonight?” You already made plans.**

**A.** I rearrange one thing I can move and ask what time they need me.

- **Verdict:** SHOWUP +2
- **Creature/Core:** #14 Collaborative +2
- **Relic/Private:** #57 Supportive +3; #55 Duty-first +1

**B.** “Absolutely.” Then I never show up, because I didn’t want to say no.

- **Verdict:** UNRELIABLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #6 Indirect +2
- **Relic/Private:** #48 Approval-seeking +2

**C.** I come over and resist turning their hard week into an update for everyone else.

- **Verdict:** VAULT +2
- **Creature/Core:** #35 Private +1
- **Relic/Private:** #47 Boundary-holding +2; #57 Supportive +1

**D.** “I can come tomorrow morning. Tonight I can call at eight.”

- **Verdict:** TRUTH +2
- **Creature/Core:** #5 Direct +2; #17 Practical +1
- **Relic/Private:** #53 Tactful +2; #47 Boundary-holding +1

**E.** I text the whole group, “We need to talk about what’s going on with them.” They didn’t ask me to.

- **Verdict:** GOSSIP +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** No confident trait evidence


### QUESTION 8 OF 10
**Your friend asks, “Did you know they were talking about me?” You did. What do you say?**

**A.** “I heard something, but I wasn’t going to keep it circulating. Do you want to know the details?”

- **Verdict:** VAULT +2
- **Creature/Core:** #35 Private +1
- **Relic/Private:** #53 Tactful +2; #47 Boundary-holding +1

**B.** I deliver the entire transcript, including the part I helpfully embellished.

- **Verdict:** GOSSIP +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** No confident trait evidence

**C.** I insist I’ll handle it, then avoid the conversation entirely.

- **Verdict:** UNRELIABLE +2
- **Creature/Core:** #6 Indirect +1
- **Relic/Private:** No confident trait evidence

**D.** “Yes. I should have told you it was happening. I’m sorry.”

- **Verdict:** TRUTH +2
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #41 Accountability +3; #49 Vulnerable +1

**E.** I ask how they want to handle it and offer to be there if they confront the person.

- **Verdict:** SHOWUP +2
- **Creature/Core:** #9 Protective +2
- **Relic/Private:** #57 Supportive +2


### QUESTION 9 OF 10
**Which request would your closest friends be most hesitant to give you?**

**A.** “Please tell everybody what I said.” They know I will not speak for them unless asked.

- **Verdict:** VAULT +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** #47 Boundary-holding +2

**B.** “Please tell everybody what I said.” I’m not the messenger unless asked directly.

- **Verdict:** VAULT +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** #47 Boundary-holding +2

**C.** “Please keep this between us.” I have broken that promise before, and I know why they hesitate.

- **Verdict:** GOSSIP +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** #48 Approval-seeking +1; #41 Accountability +1

**D.** “Please tell me the truth.” I’m direct, and I work on not making it sting.

- **Verdict:** TRUTH +2
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #53 Tactful +1

**E.** “Can you be there?” They usually ask because they know I’ll show up.

- **Verdict:** SHOWUP +2
- **Creature/Core:** #14 Collaborative +1
- **Relic/Private:** #55 Duty-first +2


### QUESTION 10 OF 10
**Apparently opens the receipts folder on how you handle someone else’s business. Which file is the thickest?**

**A.** My “just between us” conversations have a suspiciously large distribution list.

- **Verdict:** GOSSIP +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** No confident trait evidence
- **Relic/Private:** No confident trait evidence

**B.** Times I said, “I’m five minutes away,” and actually was.

- **Verdict:** SHOWUP +2
- **Creature/Core:** #1 Planner +1
- **Relic/Private:** #55 Duty-first +2

**C.** Apologies for promising something and then ignoring it until someone chased me.

- **Verdict:** UNRELIABLE +3; **high-confidence harsh-behavior signal**
- **Creature/Core:** #16 Let it play out +2
- **Relic/Private:** #42 Defensiveness +2

**D.** Messages where I refused to confirm a story that wasn’t mine to tell.

- **Verdict:** VAULT +2
- **Creature/Core:** #35 Private +2
- **Relic/Private:** #47 Boundary-holding +3

**E.** Conversations where I said the hard thing privately instead of joining the public pile-on.

- **Verdict:** TRUTH +2
- **Creature/Core:** #5 Direct +2
- **Relic/Private:** #53 Tactful +2; #41 Accountability +1

## All five complete result reveals

### YOU ARE A VAULT. AND PEOPLE KNOW IT.
**Internal outcome ID:** `vault`

**THE VERDICT**

The secret stays where it belongs.

**THE PRIVATE READ**

People can tell you something difficult without watching it travel through the group chat. You ask what kind of support they need, understand the difference between your curiosity and their privacy, and do not treat another person’s life as conversation material. You can also recognize when a real safety concern means silence is not the responsible option.

**THE CALL-OUT**

Being a safe listener does not mean becoming the storage unit for everyone’s emotional emergencies.

**THE COST**

You may carry stories that are heavy long after the person who told you has moved on.

**TRY THIS**

When someone brings a serious concern, ask whether they want you to listen, help plan, or connect them to appropriate support.

**THE KICKER**

The secret entered. No press conference was scheduled.

*Apparently, confidential still means confidential.*

**YOUR TRAITS (display only):** Discreet · Trustworthy · Grounded

### YOU ACTUALLY SHOW UP. WILD CONCEPT.
**Internal outcome ID:** `showup`

**THE VERDICT**

Your yes means yes, not “remind me seventeen times.”

**THE PRIVATE READ**

People know you will tell them what you can realistically do, and then do it. You follow through on the uncomfortable or unglamorous parts of being dependable. You do not need applause for keeping a promise. You are also willing to renegotiate early rather than disappearing and leaving someone to guess.

**THE CALL-OUT**

Reliable people sometimes forget that they are allowed to say no.

**THE COST**

Other people may slowly assign you responsibilities they never asked whether you wanted.

**TRY THIS**

Choose one commitment you maintain from guilt rather than agreement. Renegotiate it before resentment sets in.

**THE KICKER**

You said you would be there. Then you were there. Apparently this is breaking news.

*Apparently, reliability is rare enough to look like a superpower.*

**YOUR TRAITS (display only):** Dependable · Accountable · Considerate

### YOU TELL THE TRUTH WITHOUT USING IT AS A WEAPON.
**Internal outcome ID:** `truth`

**THE VERDICT**

People trust you with the answer they do not want to hear.

**THE PRIVATE READ**

You can tell a friend a decision is risky, admit when you cannot help, or give feedback without making honesty into a public spectacle. You weigh your words, keep private things private, and understand that compassion does not require telling someone what they want to hear.

**THE CALL-OUT**

Sometimes kindness can drift into too much preparation. You do not need the perfect opening sentence to tell a necessary truth.

**THE COST**

Delaying an uncomfortable conversation can make the eventual truth harder to hear.

**TRY THIS**

Say one clear, useful truth to someone who has asked for it. Then leave space for their response.

**THE KICKER**

The truth arrived. Nobody needed a hazmat team.

*Apparently, honesty and kindness are allowed in the same sentence.*

**YOUR TRAITS (display only):** Honest · Tactful · Supportive

### YOU'RE A GOSSIP. EVERYBODY KNOWS.
**Internal outcome ID:** `gossip`

**THE VERDICT**

People trust you with information. You turn it into content.

**THE PRIVATE READ**

Your answers show a pattern of repeating private stories, offering “anonymous” details people can identify, and telling yourself you are only venting or asking for advice. Unless there is an actual safety concern, that information was not yours to distribute. If you need support, there are ways to ask without broadcasting somebody else’s business.

**THE CALL-OUT**

“Do not tell anyone” was not an invitation to choose your favorite three people. You are not the communication department for another person’s private life.

**THE COST**

People stop confiding in you. Worse, someone gets hurt or exposed because you needed an interesting story for the conversation.

**TRY THIS**

Stop repeating a private detail today. If you have already shared one, own it without excuses, tell the person, and do what repair is possible.

**THE KICKER**

You promised to keep it between you two. The group chat apparently counts as one person.

*Apparently, the tea is not yours to serve.*

**YOUR TRAITS (display only):** Loose-Lipped · Approval-Seeking · Boundary-Crossing

### YOU'RE UNRELIABLE. STOP OFFERING.
**Internal outcome ID:** `unreliable`

**THE VERDICT**

Your promises are starting to sound like decorative language.

**THE PRIVATE READ**

You say yes because you want to be seen as helpful, or because saying no is uncomfortable. Then you fail to do what you volunteered for, dodge the follow-up, and let other people find replacement help at the last minute. A genuine emergency is one thing. This is a repeated pattern of making commitments you never protected enough to keep.

**THE CALL-OUT**

Stop volunteering for the version of yourself that exists only when everybody is watching you agree. The actual work still needs a person.

**THE COST**

Your yes costs people time, money, and contingency plans. Eventually nobody asks because your help creates another problem.

**TRY THIS**

For the next month, make fewer promises. For every yes, put the task and deadline on your calendar immediately. Tell people early if you cannot deliver.

**THE KICKER**

“I got you” has become an extremely unreliable weather forecast.

*Apparently, your intentions keep missing their appointments.*

**YOUR TRAITS (display only):** Overcommitted · Avoidant · Inconsistent

## Owner-approved editorial scoring and confidence gates (engine QA pending)

**Primary verdict scores:** Each selected answer supplies +2 points to its declared result, or +3 when marked high-confidence; optional explicitly identified secondary outcomes receive +1. These verdict points do not themselves grant Core or Relic awards.

**Harsh outcome protection:** Any harsh candidate requires at least 4 distinct primary outcome selections, including at least 2 marked high-confidence choices from its approved qualifying question list. Those choices must each describe the named harmful *behavior*, not merely a feeling, privacy, rest, attraction, or style preference. The candidate must still win on scores.

- **GOSSIP gate:** ≥4 primary answers, including ≥2 high-confidence signals from Q2E, Q3A, Q6D, Q7E, Q8B, Q9C, Q10A.
- **UNRELIABLE gate:** ≥4 primary answers, including ≥2 high-confidence signals from Q2A, Q5A, Q6B, Q7B, Q10C.

**High-signal tie questions:** Q2, Q3, Q5, Q6, Q7, Q8, Q9, Q10.

**Exact tie resolution:** Highest eligible total → high-signal total → primary-support count → fixed fallback VAULT → SHOWUP → TRUTH → GOSSIP → UNRELIABLE. No “close second.”

**Identity evidence:** Only the ID-specific answer mappings above can add raw personality evidence, when the user selects that answer on their first qualifying versioned completion. Blank layers are intentional. Same-dimension opposite poles never appear together on one choice. No award is inferred from a call-out title, trait badge, or result prose. Historical first completions, content-version lineage, subscriptions, and any 18+ restrictions remain intact.

**Representative coherent answer paths** (Q1 through Q10; each path wins its named outcome under this draft point/gate logic):

- **VAULT:** A · C · B · E · D · A · C · A · A · D. Winner VAULT (20 verdict points; 10 primary answers; 0 qualifying harsh signals).
- **SHOWUP:** C · B · D · B · C · C · A · E · E · B. Winner SHOWUP (20 verdict points; 10 primary answers; 0 qualifying harsh signals).
- **TRUTH:** E · D · C · A · B · E · D · D · D · E. Winner TRUTH (20 verdict points; 10 primary answers; 0 qualifying harsh signals).
- **GOSSIP:** B · E · A · D · E · D · E · B · C · A. Winner GOSSIP (27 verdict points; 10 primary answers; 7 qualifying harsh signals).
- **UNRELIABLE:** A · A · E · C · A · B · B · C · A · C. Winner UNRELIABLE (21 verdict points; 8 primary answers; 5 qualifying harsh signals).

**Implementation validation required:** Re-run every reachability fixture with the production TypeScript + SQL scorers; test random and adversarial mixed patterns, gates, tie parity, versioned identity, exact trait ledger, retake non-inflation, historical preservation, entitlement, and accessibility. This is NOT a claim that production tests ran.

---

## Editorial verification summary

- Four complete quizzes, 40 behaviorally distinct questions, 200 A–E responses, and 20 full reveal reads.
- Five potential outcomes per quiz, including two explicit harsh call-outs. None is assigned based on one answer.
- Different outcome positions across questions, and questions where the same result has two distinct credible responses while another result is absent.
- Every raw evidence assignment was selected for the actual wording of its response. Core-only, Private-only, and no-evidence answers are allowed.
- Every outcome has a plausible representative path that wins the stated draft model. Production client/server parity is still pending.
- Prior approved quizzes and all repo/database resources remain untouched.

## OWNER APPROVAL RECORD
- [x] Quiz 1: Hidden You, complete content and editorial scoring approved
- [x] Quiz 2: Life Match, complete content and editorial scoring approved
- [x] Quiz 3: Style & Vibe, complete content and editorial scoring approved
- [x] Quiz 4: The Good Stuff, complete content and editorial scoring approved for the 17-quiz launch target
- [ ] Engineering QA: verify TypeScript/SQL winner parity, harsh-result gates, versioning, and permissions before production activation


---
