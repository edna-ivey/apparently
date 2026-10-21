# Apparently You | App Review Notes, final draft
Updated October 21, 2026. Paste into App Store Connect after completing bracketed test and contact details.

Apparently You is an entertainment and self-reflection personality app. It asks users quizzes and Daily questions, builds personality evidence from their responses, and assembles a personalized Creature with a name and combined personality Read. Users can explore the Five Parts of their Creature, compare, and share a Creature image.

Account access: The app creates an anonymous Supabase session on first use. No email/password is required for standard onboarding. If App Store Connect's Sign-in Required checkbox is enabled, correct it to reflect the actual anonymous onboarding experience. Do not enter fictional credentials.

Business model: The free app has optional Apparently Private auto-renewable subscriptions. The paywall displays actual Apple StoreKit prices and offers. Product identifiers: apparently_private_monthly and apparently_private_annual. Entitlement: apparently_private. Standard US prices are $3.99/month and $29.99/year. Eligible first-time subscribers to the subscription group may see an annual $19.99 first-year introductory offer, renewing at $29.99/year. Eligibility and availability are determined by Apple. Users can restore purchases and manage subscriptions through Apple.

To inspect premium features, open Apparently Private from the app and use the real sandbox subscription purchase flow. Apple reviewers should be able to inspect the full purchase flow in Apple's test environment. No review-only purchase bypass or undocumented credentials are provided. If a separate demo account with an expired subscription is required, provide an actual working one through the secure App Review information fields before submission, not in public notes.

Age handling: Onboarding offers a 13–17 age range. Mature Apparently Private content has separate age eligibility controls. Verify those controls on the submitted binary before review and accurately complete Apple's age-rating questionnaire.

Services: Supabase (anonymous authentication and application storage), RevenueCat/Apple (subscription entitlement and billing), and Sentry (diagnostics if enabled). Sharing is user-initiated. Save to Photos uses iOS photo-library permission for saving the Creature image.

Privacy Policy, Terms of Use, Restore Purchases, subscription management, and Delete Account are accessible from Settings. Deleting an account does not cancel an Apple subscription.

Tested device/OS: [INSERT ACTUAL FINAL-BUILD DEVICE AND IOS VERSION].
Region/availability: [CONFIRM REGIONS AND ANY FEATURE DIFFERENCES].
Reviewer contact: [CONFIRM CONTACT NAME, PHONE, EMAIL].
Backend readiness: [VERIFY MIGRATIONS AND DELETE ACCOUNT FUNCTION DEPLOYED AND TESTED].
Subscription review screenshots: [ATTACH REAL PAYWALL SCREENSHOT IN SUBSCRIPTION REVIEW FIELDS].

Do not submit these notes as final until bracketed facts are verified.
