# App Review notes | DRAFT
Apparently You is an entertainment and personality quiz app. Users can begin without email/password through anonymous account creation. Answering quizzes and Daily questions produces personality evidence and visual identity progression (Creature). Apparently Private is a paid area containing more mature questions, a separate Private identity layer, and Relic progression.

For review, use the supplied app build and onboarding flow. **[VERIFY]** Age eligibility controls restrict mature Private content. The Settings screen should include Privacy Policy, Terms, Restore Purchases, Manage Subscription and Delete Account.

Subscription products intended for review: monthly $3.99, standard annual $29.99, Founding Member first year $19.99 renewing at $29.99 annually, subject to actual App Store configuration and eligibility. All price displays must match the live StoreKit offering.

**Review access to premium content (engineering-verified, not invented for this draft):**
Apparently Private already has a real, production-safe mechanism for exactly this case --
`tester_access_grants` + `has_tester_access()` (migration `20260924010000_secure_entitlement_
authorization.sql`, unchanged by Build 18). It is admin-granted, server-side, checked
ALONGSIDE (never instead of) the real RevenueCat entitlement inside `get_private_daily`,
`submit_private_daily_answer`, and `submit_quiz_result` -- it never bypasses or weakens
production authorization, it just adds one more user_id that passes the same real checks.
Recommended review steps for App Store Connect's Review Notes field:
1. Reviewer installs the build and opens the app -- an anonymous Supabase account is created
   automatically, no login required (visible in onboarding).
2. The reviewer does not need to know their own account id. Instead: before submitting for
   review, the owner opens the admin panel (`/admin`, is_admin()-gated) and grants tester
   access to a NEW disposable test account the owner creates themselves on a spare
   device/simulator using the same build, then provides Apple that SAME device/account's
   login state (i.e. hands Apple a pre-authenticated test device or screen-recorded walk-
   through) rather than asking Apple's reviewer to self-serve a grant.
   Alternative, if Apple requires the reviewer's own fresh install to work standalone: use
   Apple's real sandbox purchase flow (StoreKit Sandbox tester Apple ID) to let the reviewer
   actually subscribe for $0-equivalent sandbox currency through the real paywall -- this
   exercises the real purchase path end-to-end, which is generally the stronger review
   experience and requires no admin grant at all.
3. Either path exercises the SAME production authorization code reviewers would need to see
   -- no review-only code branch exists or is proposed.
**[NEEDS OWNER DECISION]** which of the two paths above to use for this submission (tester
grant to a pre-authenticated device vs. a real sandbox purchase), and to actually create that
sandbox tester / perform that admin grant before submission -- this document explains the
real mechanism; it does not and cannot perform either action.

**[NEEDS OWNER]** Contact person, phone/email, App Store Connect review credentials if any, production service readiness, and precise steps to access all features.
