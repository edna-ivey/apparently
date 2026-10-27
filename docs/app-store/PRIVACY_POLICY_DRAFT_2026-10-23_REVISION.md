# Apparently You Privacy Policy — DRAFT REVISION, NOT PUBLISHED
Prepared 2026-10-23, for owner review only. **Not published to apparentlyyou.com, not
rendered in-app, requires explicit owner approval before either happens.** The live policy
(last updated October 21, 2026) is unchanged and still accurate for the app as it exists in
production today — this revision is needed only because of the advertising/notifications/
analytics work built this pass, none of which has been applied to production yet either. Do
not publish this until the underlying feature itself ships (publishing a policy describing
features that aren't live yet would itself be inaccurate).

## What changed from the live version, and why (read this first)
1. **The live policy's sentence "We do not use any advertising, analytics, or behavioral-
   tracking SDK" is removed** — it becomes false the moment AdMob/first-party analytics ship.
2. **New: a real Advertising section**, including the one legally significant new fact —
   **this app would, for the first time, engage in what Apple's App Tracking Transparency
   framework defines as "tracking"** for the specific slice of users who are (a) free, (b)
   confirmed 18+, and (c) grant the ATT permission: Google AdMob may use the device
   advertising identifier for cross-app ad personalization in that case. Every other user
   (subscribers always; free users who are not 18+-confirmed; free users who decline ATT) sees
   only non-personalized ads with no such identifier use. **This sentence needs real legal
   review before publishing** — it is the one place in this revision that is a substantive
   legal-risk statement, not just a factual description.
3. **New: a Notifications section** (device push token, category preferences, reminder time,
   timezone for quiet hours).
4. **New: a first-party analytics disclosure** (ad funnel + notification funnel events, no
   third-party SDK).
5. **Retention/deletion section extended** to list the new data types, all of which already
   cascade-delete with the account (confirmed: `push_tokens`, `notification_preferences`,
   `notification_outbox`, `analytics_events`, and `user_known_creature_traits` all reference
   `auth.users(id) on delete cascade` in the relevant migrations — not a new claim being made
   without evidence).
6. **Age and children section extended** by one sentence: non-personalized ads are forced for
   any account that hasn't confirmed 18+, regardless of their own ATT answer — reusing the
   already-approved age-eligibility gate, not a new age question.

Everything else below is unchanged from the live, already-approved policy.

---

# Apparently You Privacy Policy
Last updated: [DATE OF ACTUAL PUBLICATION — leave as a placeholder until the owner approves
both this text and the underlying feature going live]

Apparently You is a personality and entertainment app operated by **Super Great Ventures LLC**
("we", "us"). Contact: **privacy@apparentlyyou.com** for any privacy question, or to request
access, correction, or deletion of your data.

## Information we process
- Profile information you choose to provide: display name, age range, gender selection and optional custom gender.
- Quiz and Daily responses, results, personality traits and evidence, Creature and Relic progression, and content you choose to share through comparison/sharing features.
- An anonymous account identifier (not tied to an email or phone number at signup) used to associate your saved responses, app state and purchases with your installation.
- Subscription status and purchase entitlement records from Apple and RevenueCat. We never see or store your payment card details -- those are processed entirely by Apple.
- Technical diagnostic information, only when our error-monitoring service (Sentry) is active: app version, build number, environment, which backend operation failed, a structural error code, and a stack trace. We do not transmit quiz answer text, personality results, screenshots, session recordings, or your raw device IP address in these events.
- **(New)** If you enable notifications: a device-specific push notification token, which notification categories you've turned on or off, your preferred Daily reminder time, any quiet hours you set, and your device's timezone (used only to apply your quiet hours at the correct local time, including across daylight saving changes).
- **(New)** Basic app-usage events we collect ourselves, never sent to any third party: whether an ad was shown/dismissed and at which general placement (never which specific ad or advertiser), whether a notification was sent or opened and in which category, and whether a quiz was completed or a result revealed. Used only to operate, measure, and improve these two features.
- **(New, free users only, and only with your permission)** If you are shown advertising (see "Advertising" below) and you are confirmed 18 or older and have granted Apple's App Tracking Transparency permission, Google AdMob may process your device's advertising identifier to personalize the ads you see. This never happens for subscribers, for anyone who has not confirmed being 18 or older, or for anyone who declines the App Tracking Transparency prompt.

## Why we process it
To provide the app, personalize your results, preserve your progress, support comparison and sharing, enforce age restrictions and subscription access, troubleshoot errors, prevent abuse, meet legal obligations, **(new)** show advertising to free users so that the app can remain free for them while keeping Apparently Private subscribers' experience completely ad-free, and **(new)** send you the notifications you've chosen to receive.

## Advertising (new section)
**Apparently Private subscribers never see advertising anywhere in the app, on any screen, at
any time.** Free users may see occasional advertisements: a full-screen ad after completing a
public quiz or your Free Daily, and labeled "Ad" cards mixed into the Explore quiz list. We use
Google AdMob to supply these ads.

If you are confirmed 18 or older and grant Apple's App Tracking Transparency permission when
asked, Google AdMob may use your device's advertising identifier to show you ads personalized
to your activity, including activity in other apps — this is the specific use Apple's App
Tracking Transparency framework is designed to let you control, and [LEGAL REVIEW NEEDED:
confirm this sentence should say] we consider this "tracking" under Apple's definition for
that slice of users. You can decline the App Tracking Transparency prompt, or change your
answer later in iOS Settings → Privacy & Tracking → Apparently You, and continue using the app
and seeing ads — declining simply means the ads you see are not personalized this way. If you
have not confirmed being 18 or older, or if Google's own consent screen indicates your region
requires it, you see only non-personalized advertising regardless of your App Tracking
Transparency answer.

We never send your quiz answers, personality trait values, Creature or Relic details, or any
Apparently Private content to Google, AdMob, or any advertising network, for any purpose.

## Notifications (new section)
If you enable notifications, you can choose which categories to receive (Daily reminders,
friend/Compare activity, Creature updates, new quizzes, Apparently Private updates), your
preferred Daily reminder time, and quiet hours, at any time in Settings. Daily reminders are
scheduled on your own device and never leave it unless you've completed the day's Daily (in
which case we simply don't send one). You can turn off notifications entirely at any time in
iOS Settings.

## Services and recipients
- Supabase: account authentication and application data storage. Our Supabase project is hosted in the United States (US West).
- Apple App Store: payments and subscription management.
- RevenueCat: subscription status and entitlement synchronization. RevenueCat identifies you only by the same anonymous account identifier described above -- never your name or email.
- Sentry: diagnostic/error monitoring, active in production builds.
- Expo/EAS and Vercel: app build/deployment and website hosting infrastructure. **(New)** Expo's push notification service also delivers the notifications described above, identified only by a device-specific push token -- Expo does not use this for advertising or any purpose of its own.
- **(New)** Google AdMob: supplies advertising to free users, as described above.
- We operate a first-party analytics system of our own (no third-party analytics SDK) that records the basic usage events described above, solely to operate and improve the app -- this data is never sold or shared outside Super Great Ventures LLC. No other third party receives your data.

## Sharing and visibility
When you explicitly create a share link for a comparison result, anyone with that link can view the comparison content you chose to share. A shared page does not display your profile name or other account details -- only the result content itself. There is currently no separate control to manually revoke a share link; a share link stops working once the account that created it is deleted (see "Retention and deletion" below).

## Retention and deletion
We retain your data while your account exists and as needed to provide the service. You can permanently delete your account at any time from Settings → Delete Account.

Deletion is immediate and permanent: it removes your authentication record and, through that, every row tied to your account -- your profile, Daily and quiz answers, personality evidence, Creature and Relic progress, tester-access records, any share links you created, **(new)** your push notification token(s) and notification preferences, and **(new)** the usage events described above that are tied to your account. This cannot be undone.

A few things are not controlled by this deletion, and we want to be upfront about them: your subscription and purchase history remain with Apple and RevenueCat as required for their own recordkeeping; any diagnostic error events already sent to Sentry before deletion persist under Sentry's own retention policy; a routine database backup taken before your deletion may still contain your data until that backup itself ages out of our backup retention window; and **(new)** any advertisement already shown to you before deletion was never associated with your account identifier by Google in the first place (ad requests do not carry your Apparently You account id), so there is nothing account-specific for Google to retain or delete on our instruction.

## Your choices
You can change your profile fields in Settings, manage or cancel your Apple subscription at any time, restore a prior purchase, **(new)** choose which notifications you receive and when, **(new)** change your App Tracking Transparency answer at any time in iOS Settings, and request account deletion -- all from Settings. For any other request about your data, contact privacy@apparentlyyou.com.

## Age and children
Apparently You is not intended for children under 13. The app asks for an age confirmation during onboarding and never creates an account or collects further information from anyone who indicates they are under 13.

Separately, the app offers a 13-17 demographic choice (for personalization only) and a distinct 18+ age-eligibility gate that restricts access to mature "Private Private" content regardless of the demographic choice above. **(New)** The same 18+ confirmation also determines advertising: any account that has not confirmed being 18 or older is always shown non-personalized advertising only, regardless of its own App Tracking Transparency answer.

## Security
We use authentication and access controls intended to limit unauthorized access to your data. No service can guarantee absolute security.

## Changes
We may update this policy as the service changes. The "Last updated" date above reflects the most recent material change.

## Contact
**Super Great Ventures LLC** | privacy@apparentlyyou.com

## Open items requiring owner/legal sign-off before this can be published
1. The "tracking" characterization in the Advertising section — confirm the exact wording with
   counsel if desired; this is the one place in this document making a claim with real legal
   weight (Apple's App Tracking Transparency framework and California/other state privacy law
   both turn on exactly this characterization).
2. A formal business mailing address is still not included (same open item as the live
   policy) -- unchanged by this revision.
3. Do not publish before the underlying AdMob/notifications/analytics features themselves are
   live -- this document describes a future state, and publishing it early would itself be an
   inaccurate privacy disclosure about data practices not yet in effect.
