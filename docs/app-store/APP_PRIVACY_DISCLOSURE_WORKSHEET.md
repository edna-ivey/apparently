# App Privacy declaration worksheet | NOT YET ANSWERED IN APP STORE CONNECT
Review Apple's App Privacy definitions and ALL integrated SDKs before checking answers. Never select 'No data collected' based solely on no email login.

| Candidate data type | Why it may apply | Status |
|---|---|---|
| User ID | Supabase anonymous auth UID, RevenueCat appUserID | Confirm collection/linkage |
| Name | Optional onboarding display name | Confirm server vs device |
| Sensitive info / other user content | Quiz answers, profile custom gender, private evidence | Determine Apple taxonomy and purposes |
| Product interaction | Quiz completions and Daily activity stored to deliver features | Determine if collected/linked |
| Purchases | RevenueCat/Apple entitlement and transaction state | Confirm declaration treatment |
| Diagnostics | Sentry error/crash/performance data when configured | Inspect production DSN, payloads and SDK manifest |
| Device ID / IP | SDKs and server infrastructure may process | Verify provider collection and Apple definitions |
| Contact info | Not requested in current anonymous onboarding | Recheck support, feedback and account recovery |

For each applicable type: collected? linked to user? used for tracking? purposes? third-party collection? retention? Cross-check Supabase tables/RPCs, RevenueCat, Sentry, Expo and web sharing. Owner signs off before publishing.
