# Build 17 physical-device test checklist

Covers the three Build 16 TestFlight bug reports and their fixes. None of these have been run
on a physical device as part of this change — automated validation (tsc, lint,
`scripts/validate-creature-preview-photo-and-age-range.ts`, full validator suite) is green, but
that is not a substitute for on-device verification. Do not treat any item below as passed
until actually exercised on a real iPhone.

## Creature preview

- [ ] Open Your Read with a real Creature (First Form).
- [ ] Open Your Read with a real mixed Creature.
- [ ] Tap the Creature — preview modal opens.
- [ ] Creature renders large and centered, with its atmospheric glow.
- [ ] The correct Creature name appears in the preview.
- [ ] Close the modal (×), reopen it — no stale state, no crash, no flash of a previous
      Save/Share result.
- [ ] Confirm Your Read itself shows the Creature exactly once (no second copy below it).
- [ ] Repeat on a smaller iPhone (SE-class width) — no clipped artwork, no overlapping buttons.
- [ ] Repeat on a larger iPhone (Pro Max-class width) — layout still feels intentional, not
      stretched or tiny.
- [ ] VoiceOver: the avatar announces "View your Creature"; close/Share/Save buttons are each
      announced with their real label.

## Photo saving

- [ ] Tap Save to Photos. Confirm button shows "Saving…" then "Saved ✓".
- [ ] Open the iOS Photos app — the image actually appears.
- [ ] Confirm the saved image shows the complete Creature artwork, not clipped or cut off.
- [ ] Confirm the Creature's name and the "apparently you." mark are visible in the saved image.
- [ ] Confirm the saved image contains NO close button, action buttons, or any other modal
      chrome.
- [ ] First-time permission prompt: deny access — confirm the "Allow access to Photos…" message
      appears (not the generic save-failed message).
- [ ] With permission denied and "don't ask again," confirm the "enable it in Settings" message
      appears.
- [ ] Grant permission after a prior denial, tap Save again — confirm it now succeeds.
- [ ] Tap Save, then immediately tap it again before it finishes — confirm only one save
      happens (button is disabled while saving).
- [ ] Force a transient failure if possible (e.g. airplane mode has no effect here since this
      is local-only; otherwise just confirm the error path shows a real retry affordance) —
      confirm tapping Save again after an error works normally.

## Sharing

- [ ] Tap Share Creature — the native iOS share sheet opens.
- [ ] Share to Messages (or another installed app) — confirm the Creature image is attached,
      not a text message or a screenshot of the whole screen.
- [ ] Share via AirDrop to another device if available — confirm the image transfers correctly.
- [ ] Open the share sheet and tap Cancel — confirm no error is shown and the modal returns to
      normal.
- [ ] Tap Share, then immediately tap Save (or vice versa) — confirm the second action is
      blocked while the first is in progress (shared `busy` guard).

## Age ranges

- [ ] Fresh onboarding: confirm 13-17 appears as a selectable option alongside the adult
      ranges, in the same position/order as Settings.
- [ ] Select 13-17 in onboarding, complete onboarding, then open Settings — confirm 13-17 shows
      as the selected age range.
- [ ] In Settings, change the age range (e.g. 13-17 to 18-24, or vice versa) — confirm the
      selection persists after fully closing and relaunching the app.
- [ ] With an account whose age-eligibility is confirmed 13-17 (via the separate age-gate),
      confirm Apparently Private / Private Private remain inaccessible regardless of whatever
      age range is selected in Settings.
- [ ] Confirm changing the Settings age range does NOT alter, reset, or re-prompt the separate
      age-eligibility gate in any way.
- [ ] Confirm an existing (pre-fix) profile that already had an 18+ age range selected is
      unaffected — no reset, no re-onboarding, no data loss.
