import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Celestial, CelestialType, CelestialWash, PortalRings } from '@/components/today/celestial';
import { CreatureProgressCard } from '@/components/today/CreatureProgressCard';
import { CreatureStage } from '@/components/today/CreatureStage';
import { FeaturedQuizCard } from '@/components/today/FeaturedQuizCard';
import { ReadModal } from '@/components/today/ReadModal';
import { RelicStage } from '@/components/today/RelicStage';
import { RoomDistribution } from '@/components/today/RoomDistribution';
import { TodayWelcomeModal } from '@/components/today/TodayWelcomeModal';
import { Brand, BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { Elevation, Radius } from '@/constants/design-system';
import { useTodayCreatureConnection } from '@/data/creature/use-today-creature-connection';
import { useTodayRelicConnection } from '@/data/relic/use-today-relic-connection';
import { useConsumerDailyExperience } from '@/data/consumer-daily';
import { usePrivateDailyExperience } from '@/data/consumer-private-daily';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';
import { isRemoteDailyEnabled } from '@/lib/supabase';
import { getConsensusLanguage, getPercentLanguage, stripApparentlyPrefix } from '@/data/personality';
import { useAdEligibility } from '@/services/ad-eligibility-service';
import { showInterstitialIfDue } from '@/services/ad-interstitial-service';
import { logAnalyticsEvent } from '@/services/analytics-service';
import { cancelTodaysDailyReminder } from '@/services/daily-reminder-service';
import { getNotificationPermissionStatus, hasShownContextualPermissionPrompt, markContextualPromptShown, requestNotificationPermission } from '@/services/notification-permission-service';
import { registerPushToken } from '@/services/push-token-service';
import { NotificationPermissionPrompt } from '@/components/today/NotificationPermissionPrompt';

// Advertising, 2026-10-22: one ad at most per completed Free Daily, shown only after the user
// closes the real reveal they already saw (never before, never during answering) -- the task's
// own "the reveal must appear first" requirement. Dedup key is the real prompt text + the
// device's own local calendar day -- a genuinely new day's Daily (even one that happens to
// recycle an old prompt) gets its own key; reopening/closing the SAME day's already-seen
// reveal any number of times never shows a second ad. Never applied to the Private Daily
// reveal -- Apparently Private stays completely ad-free (task's own explicit ad-free-surfaces
// rule), so only the 'free' ReadModal's onClose ever calls this.
const DAILY_AD_SHOWN_KEY_STORAGE = 'apparently:ads:daily-ad-shown-key';

const getTodayLocalDateKey = (): string => new Date().toDateString();

const hasShownDailyAdForKey = async (key: string): Promise<boolean> => {
  try {
    const stored =
      typeof window !== 'undefined' && 'localStorage' in window ? window.localStorage.getItem(DAILY_AD_SHOWN_KEY_STORAGE) : await AsyncStorage.getItem(DAILY_AD_SHOWN_KEY_STORAGE);
    return stored === key;
  } catch {
    return false;
  }
};

const markDailyAdShownForKey = async (key: string): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.setItem(DAILY_AD_SHOWN_KEY_STORAGE, key);
      return;
    }
    await AsyncStorage.setItem(DAILY_AD_SHOWN_KEY_STORAGE, key);
  } catch {
    // Best-effort -- a failure to persist here just means today's dedup key may not stick,
    // so a later close of the same day's reveal could show the ad again. Rare (same storage
    // this app already relies on elsewhere) and low-stakes; never worth blocking the reveal
    // itself over.
  }
};

// A single floating answer tile — shared shape for both Free (gold/pink accent) and Private
// (coral/pink accent) Daily. No card chrome of its own; the 2x2 grid floats directly on the
// page's celestial atmosphere, per the approved "no more rectangles" direction.
function OptionTile({
  letter,
  label,
  selected,
  locked,
  accentColor,
  onPress,
}: {
  letter: string;
  label: string;
  selected: boolean;
  locked: boolean;
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: locked }}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [
        tileStyles.tile,
        selected && [tileStyles.tileSelected, { borderColor: accentColor, shadowColor: accentColor }],
        locked && tileStyles.tileLocked,
        pressed && tileStyles.tilePressed,
      ]}>
      <View style={[tileStyles.badge, selected && { backgroundColor: accentColor }]}>
        <ThemedText style={[tileStyles.badgeText, selected && tileStyles.badgeTextSelected]}>{letter}</ThemedText>
      </View>
      <ThemedText style={[tileStyles.label, selected && tileStyles.labelSelected]}>{label}</ThemedText>
    </Pressable>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    width: '47.5%',
    minHeight: 104,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: Spacing.three,
    gap: Spacing.one,
  },
  tileSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  tileLocked: {
    opacity: 0.4,
  },
  tilePressed: {
    opacity: 0.85,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,249,245,0.85)',
  },
  badgeTextSelected: {
    color: Brand.plum,
  },
  label: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(255,249,245,0.9)',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();

  // The ONE place that decides local vs remote Daily — see src/data/consumer-daily.ts. This
  // screen works entirely off the resulting shape (and option INDEX, never a raw id of
  // either type), so it never has to know or care which source is active.
  const { experience, draftIndex, selectDraftOption, confirmAnswer, isCommitting, commitError, retry, retryDistribution } =
    useConsumerDailyExperience();

  const privateDaily = usePrivateDailyExperience();
  const privateReady = privateDaily.experience.phase === 'ready' ? privateDaily.experience : null;
  const privateIsCommitted = privateReady !== null && privateReady.committedIndex !== null;
  const privateDisplayedOption = privateReady ? privateReady.committedIndex ?? privateDaily.draftIndex : null;
  const privateSelectedChoice = privateReady ? privateReady.question.options[privateDisplayedOption ?? 0] ?? null : null;

  // Which Read modal (if any) is open. Holds no answer/commit state of its own — closing and
  // reopening it can never duplicate evidence or touch persistence, it only toggles what's on
  // screen. Replaces the old inline worldExpanded/privateRoomExpanded toggles now that the Room
  // always lives inside the modal rather than an inline expand/collapse section.
  const [activeModal, setActiveModal] = useState<'free' | 'private' | null>(null);

  // Advertising, 2026-10-22: see this file's own header comment for the full placement rule.
  const dailyAdEligibility = useAdEligibility('dailyInterstitial');
  const handleCloseFreeReadModal = (prompt: string) => {
    setActiveModal(null);
    if (!dailyAdEligibility.eligible) {
      return;
    }
    const key = `${prompt}|${getTodayLocalDateKey()}`;
    void (async () => {
      if (await hasShownDailyAdForKey(key)) {
        return;
      }
      logAnalyticsEvent({ name: 'ad_eligible', properties: { placement: 'daily_interstitial' } });
      const shown = await showInterstitialIfDue('daily_interstitial', !dailyAdEligibility.personalizedAdsAllowed);
      if (shown) {
        await markDailyAdShownForKey(key);
      }
    })();
  };

  // Real, non-fabricated Creature/Relic connections for both the panel cards and the Read
  // modals — see each hook's own header comment for exactly what "revealed" does and does not
  // mean, and why these intentionally do not duplicate you.tsx's own state machine.
  const creatureConnection = useTodayCreatureConnection();
  const relicConnection = useTodayRelicConnection();

  // Narrows the 5-variant experience union down to "there is a question to show" — true for
  // 'local' always, and for 'remote' only once phase is 'ready'. Every render below that
  // needs a question/committedIndex/distribution goes through this instead of re-deriving it.
  const ready =
    experience.source === 'local' ? experience : experience.phase === 'ready' ? experience : null;

  const isCommitted = ready !== null && ready.committedIndex !== null;

  // Notifications, 2026-10-22: the moment today's Free Daily is known to be answered -- whether
  // a fresh commit this session or an already-committed Daily this device opens later the same
  // day -- cancel today's pending local reminder (task requirement: "do not send a reminder
  // after that Daily has already been completed"). The NEXT day's reminder is scheduled
  // separately on launch/foreground -- see _layout.tsx.
  useEffect(() => {
    if (isCommitted) {
      void cancelTodaysDailyReminder();
    }
  }, [isCommitted]);

  // Notifications, 2026-10-22: the contextual explainer trigger point -- a completed Daily is
  // real, experienced value (the task's own bar for when to ask). Checked, not assumed: only
  // actually shows if this device has never seen it before (hasShownContextualPermissionPrompt)
  // AND the OS itself still reports 'undetermined' (a device that already has a real granted/
  // denied answer, e.g. restored from a backup, never sees this at all).
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  useEffect(() => {
    if (!isCommitted) {
      return;
    }
    void (async () => {
      if (await hasShownContextualPermissionPrompt()) {
        return;
      }
      const currentStatus = await getNotificationPermissionStatus();
      if (currentStatus === 'undetermined') {
        setShowNotificationPrompt(true);
      }
    })();
  }, [isCommitted]);
  const displayedOption = ready ? ready.committedIndex ?? draftIndex : null;
  const selectedChoice = ready ? ready.question.options[displayedOption ?? 0] ?? ready.question.options[0] : null;
  // A vote can be locked in while its distribution is still loading or has failed — that must
  // never be presented as a real percentage. `selectedPercent` (and `consensus` below) stay
  // null unless distribution has ACTUALLY loaded; nothing here ever falls back to 0.
  const distribution = ready?.distribution ?? null;
  const selectedPercent =
    distribution?.status === 'ready' && displayedOption !== null ? distribution.percentages[displayedOption] ?? null : null;
  // null for local prototype data (no real population count) and whenever distribution
  // hasn't successfully loaded — getPercentLanguage only applies the first-voter copy when
  // this is the real server-reported value 1, never a guess.
  const totalAnswers = distribution?.status === 'ready' ? distribution.totalAnswers : null;

  const consensus = useMemo(() => {
    if (!ready || displayedOption === null || ready.distribution.status !== 'ready') {
      return null;
    }
    return getConsensusLanguage(
      ready.distribution.percentages.map((percent) => ({ percent })),
      displayedOption,
    );
  }, [ready, displayedOption]);

  // A fresh local Daily always starts with these page-level flourishes reset — draft
  // selection itself is reset inside the hook. `prompt` stands in for "which local question
  // is active" without this screen needing a raw local question id. React's documented
  // "adjusting state when a prop changes" pattern (setState during render, not in an effect) --
  // same trigger condition the effect this replaced had ([localQuestionKey]).
  const localQuestionKey = experience.source === 'local' ? experience.question.prompt : null;
  const [prevLocalQuestionKey, setPrevLocalQuestionKey] = useState(localQuestionKey);
  if (localQuestionKey !== prevLocalQuestionKey) {
    setPrevLocalQuestionKey(localQuestionKey);
    if (experience.source === 'local') {
      setActiveModal(null);
    }
  }

  const freePercentLine = consensus && selectedPercent !== null ? getPercentLanguage(selectedPercent, consensus.label, totalAnswers) : null;
  const freeReadText = selectedChoice
    ? stripApparentlyPrefix(selectedChoice.apparentlyFeedback ?? 'You gave us something to think about.')
    : '';
  const freeConnectText =
    creatureConnection.status === 'revealed'
      ? `${creatureConnection.name} is taking shape with every answer — today's choice is part of the pattern now.`
      : 'Every answer adds to the pattern. Your Creature is still listening.';

  const privateReadText = privateSelectedChoice ? stripApparentlyPrefix(privateSelectedChoice.apparentlyFeedback ?? 'Noted.') : '';
  const PRIVATE_CONNECT_TEXT =
    'Some truths stay beneath the surface. Every private answer reveals more of your Undercurrent and brings your Relic into focus.';

  const freeRoomSlot =
    ready && ready.distribution.status === 'ready' ? (
      <RoomDistribution
        options={ready.question.options}
        percentages={ready.distribution.percentages}
        selectedIndex={displayedOption}
        feedbackText={null}
        totalAnswers={ready.distribution.totalAnswers}
        variant="free"
      />
    ) : ready && (ready.distribution.status === 'loading' || ready.distribution.status === 'idle') ? (
      <ThemedText style={styles.roomStatusText}>Tallying the room…</ThemedText>
    ) : ready && ready.distribution.status === 'error' ? (
      <View style={styles.roomStatusBlock}>
        <ThemedText style={styles.roomStatusText}>The Room is having a moment.</ThemedText>
        <Pressable onPress={retryDistribution} accessibilityRole="button">
          <ThemedText style={styles.roomRetry}>Try again →</ThemedText>
        </Pressable>
      </View>
    ) : null;

  const privateRoomSlot =
    privateReady && privateReady.distribution.status === 'ready' ? (
      <RoomDistribution
        options={privateReady.question.options}
        percentages={privateReady.distribution.percentages}
        selectedIndex={privateDisplayedOption}
        feedbackText={null}
        totalAnswers={privateReady.distribution.totalAnswers}
        variant="private"
      />
    ) : privateReady && (privateReady.distribution.status === 'loading' || privateReady.distribution.status === 'idle') ? (
      <ThemedText style={styles.roomStatusText}>Tallying the room…</ThemedText>
    ) : privateReady && privateReady.distribution.status === 'error' ? (
      <View style={styles.roomStatusBlock}>
        <ThemedText style={styles.roomStatusText}>The Room is having a moment.</ThemedText>
        <Pressable onPress={privateDaily.retryDistribution} accessibilityRole="button">
          <ThemedText style={styles.roomRetry}>Try again →</ThemedText>
        </Pressable>
      </View>
    ) : null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <PortalRings />
        <CelestialWash />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topInset }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <ThemedText style={styles.wordmark}>apparently you.</ThemedText>
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={styles.settingsButton}>
              <ThemedText style={styles.settingsIcon}>⚙</ThemedText>
            </Pressable>
          </View>

          <ThemedText style={styles.eyebrow}>Today&apos;s Drop</ThemedText>

          {experience.source === 'remote' && experience.phase === 'loading' && (
            <View style={styles.questionCard}>
              <ThemedText style={styles.prompt}>Loading today&apos;s drop…</ThemedText>
            </View>
          )}

          {experience.source === 'remote' && experience.phase === 'no-live-daily' && (
            <View style={styles.questionCard}>
              <ThemedText style={styles.observation}>No live Daily right now.</ThemedText>
            </View>
          )}

          {experience.source === 'remote' && experience.phase === 'error' && (
            <View style={styles.questionCard}>
              <ThemedText style={styles.observation}>Today&apos;s Drop is having a moment.</ThemedText>
              <Pressable style={styles.worldButton} onPress={retry}>
                <ThemedText style={styles.worldButtonText}>Try again →</ThemedText>
              </Pressable>
            </View>
          )}

          {ready && !isCommitted && (
            <View style={styles.stage}>
              <ThemedText style={styles.prompt}>{ready.question.prompt}</ThemedText>
              <View style={styles.optionsGrid}>
                {ready.question.options.map((option, index) => {
                  const isSelected = displayedOption === index;
                  return (
                    <OptionTile
                      key={`option-${index}`}
                      letter={String.fromCharCode(65 + index)}
                      label={option.label}
                      selected={isSelected}
                      locked={false}
                      accentColor={Brand.gold}
                      onPress={() => selectDraftOption(index)}
                    />
                  );
                })}
              </View>
              {draftIndex === null && (
                <ThemedText style={styles.microcopy} themeColor="textSecondary">
                  Pick first. Then we&apos;ll show you the room.
                </ThemedText>
              )}
              <Pressable
                disabled={draftIndex === null || isCommitting}
                onPress={confirmAnswer}
                style={[styles.confirmButton, (draftIndex === null || isCommitting) && styles.confirmButtonDisabled]}>
                <ThemedText style={styles.confirmButtonText}>{isCommitting ? 'Locking it in…' : 'Lock it in →'}</ThemedText>
              </Pressable>
              {commitError && (
                <ThemedText style={styles.microcopy} themeColor="textSecondary">
                  {commitError}
                </ThemedText>
              )}
            </View>
          )}

          {ready && isCommitted && selectedChoice && (
            <View style={styles.completedCard}>
              <View style={styles.completedBadge}>
                <ThemedText style={styles.completedBadgeText}>✓ Answered today</ThemedText>
              </View>
              <ThemedText style={styles.completedQuestion}>&ldquo;{ready.question.prompt}&rdquo;</ThemedText>
              <Pressable
                style={({ pressed }) => [styles.viewReadBtn, pressed && styles.pressed]}
                onPress={() => setActiveModal('free')}
                accessibilityRole="button">
                <ThemedText style={styles.viewReadBtnText}>View Your Read →</ThemedText>
              </Pressable>
            </View>
          )}

          {/* Apparently Private's Daily zone — remote-only, renders independently of Free
              Daily completion (Build 15 correction: an earlier pass gated this behind
              `isCommitted`, meaning Private Daily was invisible until Free Daily was answered;
              that dependency has been removed — both Dailies must be visible from first load).
              Five real states: an intentional loading state, a retry affordance on a genuine
              load failure, locked teaser (prompt only, no choices/Room/response), unlocked-but-
              unanswered (real choices, answer-before-Room), and answered (real reaction, Room
              now lives in the shared Read modal). 'no-live-private' intentionally renders
              nothing — there is genuinely no Private Daily today, not an error. */}
          {isRemoteDailyEnabled && privateDaily.experience.phase !== 'no-live-private' && (
            <View style={styles.privateZone}>
              <View style={styles.privateDivider} />
              <ThemedText style={styles.privateEyebrow}>👀 Apparently Private</ThemedText>

              {privateDaily.experience.phase === 'loading' && (
                <View style={styles.privateLockedCard}>
                  <ThemedText style={styles.privateDropCopy}>Loading today&apos;s Private question…</ThemedText>
                </View>
              )}

              {privateDaily.experience.phase === 'error' && (
                <View style={styles.privateLockedCard}>
                  <ThemedText style={styles.privateDropCopy}>We couldn&apos;t load today&apos;s Private question.</ThemedText>
                  <Pressable style={styles.privateOutlineButton} onPress={privateDaily.retry} accessibilityRole="button">
                    <ThemedText style={styles.privateOutlineButtonText}>Retry →</ThemedText>
                  </Pressable>
                </View>
              )}

              {/* Build 15: the real Private Daily prompt, given the same visual weight as Free
                  Daily's own question (serif italic, full card presence) rather than a small
                  text line — this is "a prominent, beautifully designed Daily question card,"
                  per spec. Only the prompt is server-sent for a locked user (see
                  consumer-private-daily.ts: 'locked' never carries options) — the four answer
                  choices themselves are never exposed, by construction, not by a UI omission.
                  A lock glyph + explicit "requires Apparently Private" line replaces the terse
                  "Today's question lives in Private." so the ask is unambiguous. */}
              {privateDaily.experience.phase === 'locked' && (
                <View style={styles.privateLockedCard}>
                  <View style={styles.privateLockBadge}>
                    <ThemedText style={styles.privateLockBadgeText}>🔒 PREMIUM PREVIEW</ThemedText>
                  </View>
                  <ThemedText style={styles.privateDropTitle}>{privateDaily.experience.prompt}</ThemedText>
                  <ThemedText style={styles.privateDropCopy}>
                    Answering today&apos;s Private question requires Apparently Private.
                  </ThemedText>
                  <View style={styles.privateButtonRow}>
                    <Pressable style={styles.privateOutlineButton} onPress={() => router.push('/private')} accessibilityRole="button">
                      <ThemedText style={styles.privateOutlineButtonText}>Enter Private →</ThemedText>
                    </Pressable>
                    <Pressable style={styles.privateSolidButton} onPress={() => router.push('/paywall')} accessibilityRole="button">
                      <ThemedText style={styles.privateSolidButtonText}>Unlock Apparently Private →</ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}

              {privateReady && (
                <>
                  <ThemedText style={styles.privateStatusLine}>
                    {privateReady.access === 'premium'
                      ? 'Unlocked'
                      : privateReady.access === 'tester'
                        ? 'Tester access · Unlocked'
                        : 'Door open today'}
                  </ThemedText>
                  <ThemedText style={styles.privateDropTitle}>{privateReady.question.prompt}</ThemedText>

                  {!privateIsCommitted && (
                    <>
                      <View style={styles.optionsGrid}>
                        {privateReady.question.options.map((option, index) => {
                          const isSelected = privateDisplayedOption === index;
                          return (
                            <OptionTile
                              key={`private-option-${index}`}
                              letter={String.fromCharCode(65 + index)}
                              label={option.label}
                              selected={isSelected}
                              locked={false}
                              accentColor={Brand.coral}
                              onPress={() => privateDaily.selectDraftOption(index)}
                            />
                          );
                        })}
                      </View>
                      <Pressable
                        disabled={privateDaily.draftIndex === null || privateDaily.isCommitting}
                        onPress={privateDaily.confirmAnswer}
                        style={[
                          styles.privateConfirmButton,
                          (privateDaily.draftIndex === null || privateDaily.isCommitting) && styles.confirmButtonDisabled,
                        ]}>
                        <ThemedText style={styles.privateConfirmButtonText}>
                          {privateDaily.isCommitting ? 'Locking it in…' : 'Lock it in →'}
                        </ThemedText>
                      </Pressable>
                      {privateDaily.commitError && (
                        <ThemedText style={styles.microcopy} themeColor="textSecondary">
                          {privateDaily.commitError}
                        </ThemedText>
                      )}
                    </>
                  )}

                  {privateIsCommitted && privateSelectedChoice && (
                    <View style={styles.completedCardPrivate}>
                      <View style={styles.completedBadgePrivate}>
                        <ThemedText style={styles.completedBadgePrivateText}>✓ Answered today</ThemedText>
                      </View>
                      <Pressable
                        style={({ pressed }) => [styles.viewReadBtnPrivate, pressed && styles.pressed]}
                        onPress={() => setActiveModal('private')}
                        accessibilityRole="button">
                        <ThemedText style={styles.viewReadBtnText}>View Your Read →</ThemedText>
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          <View style={styles.panelRow}>
            <FeaturedQuizCard />
            <CreatureProgressCard />
          </View>
        </ScrollView>

        {/* Mounted alongside (not inside) the scroll content -- its own visibility is purely
            the persisted dismissed-flag, so it never gates or delays Today's real content
            (both Dailies) from loading and rendering underneath it. */}
        <TodayWelcomeModal />

        <NotificationPermissionPrompt
          visible={showNotificationPrompt}
          onEnable={() => {
            setShowNotificationPrompt(false);
            void requestNotificationPermission().then((status) => {
              if (status === 'granted') {
                void registerPushToken();
              }
            });
          }}
          onDismiss={() => {
            setShowNotificationPrompt(false);
            void markContextualPromptShown();
          }}
        />

        <ReadModal
          visible={activeModal === 'free'}
          onClose={() => handleCloseFreeReadModal(ready?.question.prompt ?? '')}
          variant="free"
          readText={freeReadText}
          percentLine={freePercentLine}
          connectText={freeConnectText}
          stage={<CreatureStage connection={creatureConnection} size={150} />}
          roomTitle="See the Room"
          room={freeRoomSlot}
          ctaLabel="Explore Your Identity →"
          onCta={() => {
            handleCloseFreeReadModal(ready?.question.prompt ?? '');
            router.push('/explore');
          }}
        />

        <ReadModal
          visible={activeModal === 'private'}
          onClose={() => setActiveModal(null)}
          variant="private"
          readText={privateReadText}
          connectText={PRIVATE_CONNECT_TEXT}
          stage={<RelicStage connection={relicConnection} size={120} />}
          roomTitle="See the Room · Private"
          room={privateRoomSlot}
          ctaLabel="Enter Private →"
          onCta={() => {
            setActiveModal(null);
            router.push('/private');
          }}
        />

        {/* We're Noticing / personality-signal flourish (local demo only) and the old
            "YOUR 7 ... X/50" milestone bar were both removed in earlier passes — see git
            history for this file. Real aggregate Commonality lives on You
            (CommonalitySection, real get_my_commonality() data); Today keeps only the real
            per-question Room distribution for today's specific question(s), now inside the
            Read modal above. */}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Celestial direction (approved Living Portal preview rounds) — a touch deeper than
    // Brand.plum so the app column reads as a deliberate object sitting on a page on wide
    // web viewports, same role the previous cream tone played. Invisible on native, where
    // safeArea always fills the container exactly.
    backgroundColor: '#17000F',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Celestial.background,
    ...Platform.select({
      web: {
        marginVertical: 28,
        borderRadius: Radius.xl,
        boxShadow: Elevation.shell,
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  // Build 15: tightened from Spacing.four -- the permanent welcome card (now a one-time modal,
  // see TodayWelcomeModal) previously absorbed some of the visual weight between sections;
  // without it, the old four-section gap read as too much empty space.
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordmark: {
    color: Celestial.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    color: Celestial.textSecondary,
    fontSize: 15,
  },
  eyebrow: {
    ...CelestialType.eyebrow,
    textAlign: 'center',
  },
  // Loading/empty/error states for the Free Daily — kept as a soft glass card (these are
  // transient/edge states, not part of the core answer flow the floating-tile redesign
  // targets).
  questionCard: {
    backgroundColor: Celestial.glassFill,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  // The floating stage — no card background, question sits directly on the portal atmosphere
  // (PortalRings/CelestialWash behind it), per the approved "no more rectangles" direction.
  stage: {
    gap: Spacing.three,
    alignItems: 'center',
  },
  prompt: {
    ...CelestialType.question,
    fontSize: 23,
    lineHeight: 29,
    textAlign: 'center',
  },
  observation: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    color: Celestial.textPrimary,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.three,
    width: '100%',
  },
  microcopy: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  // The one and only path to commitDailyAnswer — pink like every other primary CTA in the
  // app (onboarding's ctaText included), so it reads as the deliberate confirmation step it
  // is rather than a secondary action.
  confirmButton: {
    backgroundColor: Brand.pink,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
    alignSelf: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.35,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
  worldButton: {
    backgroundColor: Brand.gold,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  worldButtonText: {
    color: Brand.plum,
    fontSize: 14,
    fontWeight: '800',
  },
  // Compact post-answer state — replaces the old full inline Read/Room expansion. Today stays
  // visually clean; the real Read/Room live in the reopenable modal.
  completedCard: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  completedBadge: {
    backgroundColor: 'rgba(246,184,63,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(246,184,63,0.4)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  completedBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFD88A',
  },
  completedQuestion: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 22,
    color: '#D8C9FF',
    opacity: 0.85,
    textAlign: 'center',
  },
  viewReadBtn: {
    backgroundColor: Brand.gold,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
  },
  viewReadBtnPrivate: {
    backgroundColor: Brand.coral,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
  },
  viewReadBtnText: {
    color: Brand.plum,
    fontSize: 14,
    fontWeight: '800',
  },
  // Apparently Private's zone — borderless/atmospheric, distinct from Free Daily via a pink
  // eyebrow + coral accent rather than card chrome, separated from Free Daily by a thin
  // divider rather than a boxed card.
  privateZone: {
    gap: Spacing.three,
    alignItems: 'center',
  },
  privateDivider: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(255,158,214,0.3)',
    marginBottom: Spacing.one,
  },
  privateEyebrow: {
    color: '#FF9ED6',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textAlign: 'center',
  },
  privateStatusLine: {
    color: Brand.coral,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Build 15: a real card shell for the locked/loading/error states only (the unlocked
  // premium state stays floating, matching Free Daily's own "no more rectangles" stage) — this
  // is what gives a free user's Private Daily preview the same visual presence as Free Daily's
  // question, instead of reading as a small text aside beneath it.
  privateLockedCard: {
    width: '100%',
    gap: Spacing.three,
    alignItems: 'center',
    backgroundColor: 'rgba(255,121,95,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,121,95,0.25)',
    borderRadius: 24,
    padding: Spacing.four,
  },
  privateLockBadge: {
    backgroundColor: 'rgba(255,121,95,0.16)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  privateLockBadgeText: {
    color: Brand.coral,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  privateDropTitle: {
    ...CelestialType.question,
    textAlign: 'center',
  },
  privateDropCopy: {
    color: 'rgba(255,249,245,0.7)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  privateButtonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  privateOutlineButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,249,245,0.3)',
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  privateOutlineButtonText: {
    color: Brand.cream,
    fontSize: 13,
    fontWeight: '800',
  },
  privateSolidButton: {
    backgroundColor: Brand.coral,
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  privateSolidButtonText: {
    color: Brand.plum,
    fontSize: 13,
    fontWeight: '800',
  },
  privateConfirmButton: {
    backgroundColor: Brand.coral,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
    alignSelf: 'center',
  },
  privateConfirmButtonText: {
    color: Brand.plum,
    fontSize: 15,
    fontWeight: '800',
  },
  completedCardPrivate: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  completedBadgePrivate: {
    backgroundColor: 'rgba(255,158,214,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,158,214,0.4)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  completedBadgePrivateText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FF9ED6',
  },
  roomStatusText: {
    color: Celestial.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  roomStatusBlock: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  roomRetry: {
    color: Brand.gold,
    fontSize: 13,
    fontWeight: '800',
  },
  // Featured Quiz + Your Creature — one shared row so both panels (see celestial.tsx's Panel
  // shell, used inside each component) read as one family rather than two differently-weighted
  // stacked cards.
  panelRow: {
    gap: Spacing.three,
  },
});
