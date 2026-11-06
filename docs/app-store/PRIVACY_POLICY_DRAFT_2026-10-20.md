# Apparently You Privacy Policy
Last updated: November 4, 2026

Finalized 2026-10-21: owner-confirmed legal operator (Super Great Ventures LLC) and every
data-practice claim below cross-checked directly against the live app and infrastructure --
account deletion's real cascade behavior (`supabase/functions/delete-account/index.ts`),
Sentry's actual production config (`src/services/observability.ts`), the full list of
third-party services (cross-checked against `package.json` -- AdMob, first-party analytics and push delivery now used), share-link revocation behavior (none; a share is only invalidated by the sharer's own
account deletion), and the under-13 onboarding age gate. This is the canonical source kept in
sync by hand with `src/app/privacy-policy.tsx`, which renders the same content in-app.
Governing-law/dispute jurisdiction is intentionally not addressed here (privacy policies don't
require one); see the Terms of Use for that note.

Apparently You is a personality and entertainment app operated by **Super Great Ventures LLC**
("we", "us"). Contact: **privacy@apparentlyyou.com** for any privacy question, or to request
access, correction, or deletion of your data.

## Information we process
- Profile information you choose to provide: display name, age range, gender selection and optional custom gender.
- Quiz and Daily responses, results, personality traits and evidence, Creature and Relic progression, and content you choose to share through comparison/sharing features.
- An anonymous account identifier (not tied to an email or phone number at signup) used to associate your saved responses, app state and purchases with your installation.
- Subscription status and purchase entitlement records from Apple and RevenueCat. We never see or store your payment card details -- those are processed entirely by Apple.
- App engagement events, ad placement and impression measurements, and notification permission and delivery events, associated with an anonymous app account identifier. When notifications are enabled, we also maintain push tokens and notification preference and time-zone settings.
- Technical diagnostic information, only when our error-monitoring service (Sentry) is active: app version, build number, environment, which backend operation failed, a structural error code, and a stack trace. We do not transmit quiz answer text, personality results, screenshots, session recordings, or your raw device IP address in these events -- our Sentry configuration explicitly disables default PII collection, screenshot capture and session replay, and strips authorization headers and request bodies before anything is sent.

## Why we process it
To provide the app, personalize your results, preserve your progress, support comparison and sharing, enforce age restrictions and subscription access, deliver notifications you enable, understand app usage, serve and measure advertising where permitted, troubleshoot errors, prevent abuse, and meet legal obligations.

## Services and recipients
- Supabase: account authentication and application data storage. Our Supabase project is hosted in the United States (US West).
- Apple App Store: payments and subscription management.
- RevenueCat: subscription status and entitlement synchronization. RevenueCat identifies you only by the same anonymous account identifier described above -- never your name or email.
- Sentry: diagnostic/error monitoring, configured as described above, active in production builds.
- Expo/EAS and Vercel: app build/deployment and website hosting infrastructure.
- Google AdMob: serves and measures advertisements for eligible free users. Google and its advertising partners may process device identifiers, advertising information, ad interactions, approximate location inferred from technical data, and consent choices according to their policies and applicable requirements.
- First-party analytics: we record limited app events, such as quiz completion, ad delivery, and notification interactions, with event metadata and your anonymous account identifier in Supabase. These events are not intended to contain your raw quiz answers or personality trait values.
- Expo Push Service and Apple Push Notification service: if you enable notifications, device push tokens, delivery metadata, and notification content may be processed to deliver requested alerts. Notification preferences and time-zone settings are stored to respect your choices.
- We use Google consent prompts and Apple App Tracking Transparency where required. Declining tracking or personalized advertising does not prevent non-personalized ads where permitted.

## Sharing and visibility
When you explicitly create a share link for a comparison result, anyone with that link can view the comparison content you chose to share. A shared page does not display your profile name or other account details -- only the result content itself. There is currently no separate control to manually revoke a share link; a share link stops working once the account that created it is deleted (see "Retention and deletion" below).

## Retention and deletion
We retain your data while your account exists and as needed to provide the service. You can permanently delete your account at any time from Settings -> Delete Account.

Deletion is immediate and permanent: it removes your authentication record and, through that, every row tied to your account -- your profile, Daily and quiz answers, personality evidence, Creature and Relic progress, tester-access records, and any share links you created. This cannot be undone.

A few things are not controlled by this deletion, and we want to be upfront about them: your subscription and purchase history remain with Apple and RevenueCat as required for their own recordkeeping (deleting your Apparently You account does not cancel an Apple subscription -- manage or cancel it directly in iOS Settings or at apps.apple.com/account/subscriptions); any diagnostic error events already sent to Sentry before deletion persist under Sentry's own retention policy; and a routine database backup taken before your deletion may still contain your data until that backup itself ages out of our backup retention window.

## Your choices
You can change your profile fields and notification preferences in Settings, turn off iOS notification permission, respond to advertising consent and App Tracking Transparency prompts where presented, manage or cancel your Apple subscription, restore a prior purchase, and request account deletion. For other requests about your data, contact privacy@apparentlyyou.com.

## Age and children
Apparently You is not intended for children under 13. The app asks for an age confirmation during onboarding and never creates an account or collects further information from anyone who indicates they are under 13.

Separately, the app offers a 13-17 demographic choice (for personalization only) and a distinct 18+ age-eligibility gate that restricts access to mature "Private Private" content regardless of the demographic choice above.

## Security
We use authentication and access controls intended to limit unauthorized access to your data. No service can guarantee absolute security.

## Changes
We may update this policy as the service changes. The "Last updated" date above reflects the most recent material change.

## Contact
**Super Great Ventures LLC** | privacy@apparentlyyou.com

## Open item (not a factual gap -- a business decision)
A formal business mailing address is not included above. US privacy law does not require one for
a policy like this; add one here and in-app if the owner wants it included.
