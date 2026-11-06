import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Celestial, CelestialWash, PortalRings } from '@/components/today/celestial';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { setAgeEligibilityOnce, type AgeEligibility } from '@/data/age-eligibility';
import {
  AGE_RANGES,
  completeOnboarding,
  GENDER_IDENTITIES,
  useOnboardingState,
  type AgeRange,
  type GenderIdentity,
  type SelfPerceptionAnswers,
} from '@/data/onboarding';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';

type SelfPerceptionField = keyof SelfPerceptionAnswers;

type QuestionDef = {
  field: SelfPerceptionField;
  prompt: string;
  choices: string[];
};

// Copy is exact and approved — do not reword. These are what the user CLAIMS about
// themselves; they are never scored or translated into personality signals here.
const QUESTIONS: QuestionDef[] = [
  {
    field: 'groupRole',
    prompt: "In a group, you'd say you're usually...",
    choices: [
      'The one making the plan',
      'The one keeping the vibe alive',
      'The one quietly observing everything',
      "Depends who I'm with",
    ],
  },
  {
    field: 'dramatic',
    prompt: 'Be serious. How dramatic are you?',
    choices: [
      'Basically never',
      "Only when it's warranted 😌",
      'I have my moments',
      'Why are we acting like dramatic is bad?',
    ],
  },
  {
    field: 'decisionStyle',
    prompt: "When you make decisions, you think you're more...",
    choices: [
      'Head first. Facts matter.',
      'Heart first. I know what I feel.',
      'Gut first. I just know.',
      'An exhausting combination of all three',
    ],
  },
  {
    field: 'proudTrait',
    prompt: "Pick the one you'd most proudly claim.",
    choices: ['Loyal', 'Independent', 'Funny', 'Ambitious'],
  },
  {
    field: 'selfBlindSpot',
    prompt: 'And the one you might be lying to yourself about? 👀',
    choices: ["I'm easygoing.", "I don't care what people think.", "I'm not petty.", "I don't overthink."],
  },
];

// 'age-gate' is the first real question after Welcome, deliberately before any other data
// collection -- a self-identified under-13 answer diverts to 'age-blocked' (handled as its
// own standalone render branch, like 'welcome', never entering STEP_ORDER's forward
// progression at all) rather than continuing onboarding. Apparently You is 13+; see
// src/data/age-eligibility.ts for why this is tracked completely separately from the
// demographic AgeRange field below (personalization only, never a legal gate -- a 13-17
// eligible user needs an accurate bucket to pick here too, so AgeRange includes '13-17'
// alongside the adult ranges; selecting it can never grant/deny access to anything on its own).
type Step = 'welcome' | 'age-gate' | 'basic' | 'transition' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'final';
const STEP_ORDER: Step[] = ['welcome', 'age-gate', 'basic', 'transition', 'q1', 'q2', 'q3', 'q4', 'q5', 'final'];
// Every step after the standalone Welcome screen shares one chrome and one progress read —
// basic info, the transition card, all five questions, and final all count as real forward
// progress now (not just the 5 questions, which is all the old "N of M" text ever reflected).
const CHROME_STEPS = STEP_ORDER.length - 1;

// A real visual progress read across the whole post-welcome flow — segmented bar, filled gold
// up to (and including) the current step. Replaces the old plain "N of M" text, which only
// ever appeared during the 5 question steps and said nothing on basic/transition/final.
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressRow} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: total, now: current + 1 }}>
      {Array.from({ length: total }, (_, index) => (
        <View key={index} style={[styles.progressSegment, index <= current && styles.progressSegmentFilled]} />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const onboardingState = useOnboardingState();
  const contentWidth = useResponsiveContentWidth();
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEP_ORDER[stepIndex];

  const [firstName, setFirstName] = useState('');
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [gender, setGender] = useState<GenderIdentity | null>(null);
  const [customGender, setCustomGender] = useState('');
  const [answers, setAnswers] = useState<Partial<SelfPerceptionAnswers>>({});
  const [submitting, setSubmitting] = useState(false);
  // 'blocked' is a terminal state, never advanced past -- see the age-gate comment above.
  // Deliberately NOT persisted anywhere: a self-identified under-13 answer never creates a
  // session or writes any data (see handleAgeGateAnswer below), so there's nothing to recover
  // on relaunch either -- the gate simply asks again, which is the correct, privacy-conscious
  // behavior for an answer that was never supposed to leave this screen.
  const [ageGateResult, setAgeGateResult] = useState<'answering' | 'blocked' | 'cleared'>('answering');

  // Mirrors the (tabs) layout's own gate in the opposite direction: a device that has
  // already completed onboarding but manually lands here again (a stale web bookmark, a
  // back-navigation) gets sent to Today instead of re-running the flow. Placed after every
  // hook call above so hook order stays unconditional across renders.
  if (onboardingState !== 'loading' && onboardingState.completed) {
    return <Redirect href="/" />;
  }

  const goNext = () => setStepIndex((index) => Math.min(index + 1, STEP_ORDER.length - 1));
  const goBack = () => setStepIndex((index) => Math.max(index - 1, 0));

  // 'under13': block immediately, never call setAgeEligibilityOnce (which itself calls
  // ensureAnonymousSession) -- no session, no profile row, no data retained for a
  // self-identified minor, anywhere, ever. '13to17'/'18plus': persist (local + best-effort
  // server sync) and continue into the rest of onboarding exactly as before this gate existed.
  const handleAgeGateAnswer = (answer: 'under13' | AgeEligibility) => {
    if (answer === 'under13') {
      setAgeGateResult('blocked');
      return;
    }
    setAgeGateResult('cleared');
    void setAgeEligibilityOnce(answer);
    goNext();
  };

  const basicComplete = firstName.trim().length > 0 && ageRange !== null && gender !== null;

  // Selecting a choice only updates the draft answer and moves the highlight — it does NOT
  // advance the screen. Physical-device testing found immediate auto-advance made accidental
  // taps impossible to correct; the explicit Next CTA (rendered by QuestionStep) is now the
  // only thing that moves to the next question.
  const handleSelectAnswer = (field: SelfPerceptionField, value: string) => {
    setAnswers((previous) => ({ ...previous, [field]: value }));
  };

  // Reachable only after all five questions have been answered in order (forward progress
  // only ever happens via handleAnswer), so this cast is safe.
  const handleFinish = async () => {
    if (!ageRange || !gender || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await completeOnboarding(
        {
          firstName: firstName.trim(),
          ageRange,
          gender,
          ...(gender === 'Another identity' && customGender.trim() ? { customGender: customGender.trim() } : {}),
        },
        answers as SelfPerceptionAnswers,
      );
      router.replace('/');
    } finally {
      setSubmitting(false);
    }
  };

  const questionIndex = step.startsWith('q') ? Number(step.slice(1)) - 1 : -1;
  const currentQuestion = questionIndex >= 0 ? QUESTIONS[questionIndex] : null;

  // The welcome screen is visually its own thing — a dark, premium first-impression moment,
  // not a variant of the light questionnaire shell every other step shares below. It's the
  // very first step, so there's nothing to go Back to.
  if (step === 'welcome') {
    return <WelcomeStep onContinue={goNext} />;
  }

  if (ageGateResult === 'blocked') {
    return <AgeBlockedStep />;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <PortalRings />
        <CelestialWash />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            {stepIndex > 0 ? (
              <Pressable onPress={goBack} hitSlop={12} style={styles.backButton}>
                <ThemedText style={styles.backText}>← Back</ThemedText>
              </Pressable>
            ) : (
              <View style={styles.backButton} />
            )}
            <StepProgress current={stepIndex - 1} total={CHROME_STEPS} />
            <View style={styles.backButton} />
          </View>

          {step === 'age-gate' && <AgeGateStep onAnswer={handleAgeGateAnswer} />}

          {step === 'basic' && (
            <BasicInfoStep
              firstName={firstName}
              onFirstName={setFirstName}
              ageRange={ageRange}
              onAgeRange={setAgeRange}
              gender={gender}
              onGender={setGender}
              customGender={customGender}
              onCustomGender={setCustomGender}
              canContinue={basicComplete}
              onContinue={goNext}
            />
          )}

          {step === 'transition' && <TransitionStep onContinue={goNext} />}

          {currentQuestion && (
            <QuestionStep
              question={currentQuestion}
              selected={answers[currentQuestion.field] ?? null}
              onSelect={(value) => handleSelectAnswer(currentQuestion.field, value)}
              onNext={goNext}
              isLastQuestion={questionIndex === QUESTIONS.length - 1}
            />
          )}

          {step === 'final' && (
            <FinalStep firstName={firstName.trim()} submitting={submitting} onFinish={handleFinish} />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// The first real Apparently You introduction — deliberately NOT a variant of the light
// questionnaire look the rest of onboarding shares. Deep plum, cream type, restrained
// coral/pink accents, generous whitespace, one CTA — this is the "entering the product"
// moment, not a form.
// magnetic-loop.png (used everywhere else via BrandSignature) has a cream/white background
// baked into the source pixels — confirmed by sampling its corners (opaque, ~#FDFBF8), not a
// rendering bug. On the dark plum welcome screen that shows up as an obvious white square
// behind the mark. app-icon.png is the same Magnetic Loop artwork but full-bleed against a
// dark plum background (corners sampled at ~#22011E–#2A0126, i.e. essentially Brand.plum
// itself) — using it here lets the mark float on the screen's own plum background with no
// visible edge, using an existing approved asset rather than editing either PNG. This swap
// is scoped to the welcome screen only; every other screen (including the You-page avatar)
// keeps using magnetic-loop.png via BrandSignature/MAGNETIC_LOOP_SOURCE, unchanged.
const WELCOME_LOOP_SOURCE = require('@/assets/images/brand/app-icon.png');

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={welcomeStyles.container}>
      <SafeAreaView style={welcomeStyles.safeArea}>
        <View style={welcomeStyles.content}>
          <Image source={WELCOME_LOOP_SOURCE} resizeMode="contain" style={welcomeStyles.loop} />
          <ThemedText style={welcomeStyles.wordmark}>apparently you.</ThemedText>
          <ThemedText style={welcomeStyles.hero}>We ask. You answer.{'\n'}We keep the receipts.</ThemedText>
          <ThemedText style={welcomeStyles.support}>
            One daily drop, irresistible quizzes, and a running read on the patterns that make you... you.
          </ThemedText>
          <Pressable onPress={onContinue} style={styles.cta}>
            <ThemedText style={styles.ctaText}>Come see →</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const welcomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    // Unchanged value (Celestial.background === Brand.plum) — switched to the shared token so
    // this screen references the same source every other celestial screen does.
    backgroundColor: Celestial.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.four,
  },
  loop: {
    width: 120,
    height: 120,
  },
  wordmark: {
    color: Brand.cream,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: -Spacing.two,
  },
  hero: {
    color: Brand.cream,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  support: {
    color: 'rgba(255, 249, 245, 0.7)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 360,
  },
});

// The 13+ eligibility gate -- deliberately the first real question, before any other data
// collection. Three plain options, no birthdate, no exact age: the minimum information that
// actually answers the two legally-relevant thresholds (13, 18) -- see
// src/data/age-eligibility.ts's own header comment for why this is intentionally coarser than
// the existing demographic AgeRange question later in the flow.
function AgeGateStep({ onAnswer }: { onAnswer: (answer: 'under13' | AgeEligibility) => void }) {
  return (
    <View style={styles.stepGap}>
      <View style={styles.brandRow}>
        <Image source={WELCOME_LOOP_SOURCE} resizeMode="contain" style={styles.brandIcon} />
        <ThemedText style={styles.brandWordmark}>apparently you.</ThemedText>
      </View>
      <View style={styles.introGap}>
        <ThemedText type="title" style={styles.heading}>
          Quick one first.
        </ThemedText>
        <ThemedText style={styles.subcopy}>Apparently You is for ages 13 and up. How old are you?</ThemedText>
      </View>
      <View style={styles.fieldGroup}>
        <Pressable style={styles.pill} onPress={() => onAnswer('under13')}>
          <ThemedText style={styles.pillText}>Under 13</ThemedText>
        </Pressable>
        <Pressable style={styles.pill} onPress={() => onAnswer('13to17')}>
          <ThemedText style={styles.pillText}>13 to 17</ThemedText>
        </Pressable>
        <Pressable style={styles.pill} onPress={() => onAnswer('18plus')}>
          <ThemedText style={styles.pillText}>18 or older</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// Terminal state -- never advanced past, matching the Welcome screen's own standalone render
// pattern. No continue path, no data collected beyond this screen (see handleAgeGateAnswer).
function AgeBlockedStep() {
  return (
    <View style={welcomeStyles.container}>
      <SafeAreaView style={welcomeStyles.safeArea}>
        <View style={welcomeStyles.content}>
          <Image source={WELCOME_LOOP_SOURCE} resizeMode="contain" style={welcomeStyles.loop} />
          <ThemedText style={welcomeStyles.wordmark}>apparently you.</ThemedText>
          <ThemedText style={welcomeStyles.hero}>Apparently, you have to wait a bit.</ThemedText>
          <ThemedText style={welcomeStyles.support}>
            Apparently You is for ages 13 and up. Come back and see us once you&apos;re old enough — we&apos;ll be here.
          </ThemedText>
        </View>
      </SafeAreaView>
    </View>
  );
}

type BasicInfoStepProps = {
  firstName: string;
  onFirstName: (value: string) => void;
  ageRange: AgeRange | null;
  onAgeRange: (value: AgeRange) => void;
  gender: GenderIdentity | null;
  onGender: (value: GenderIdentity) => void;
  customGender: string;
  onCustomGender: (value: string) => void;
  canContinue: boolean;
  onContinue: () => void;
};

function BasicInfoStep({
  firstName,
  onFirstName,
  ageRange,
  onAgeRange,
  gender,
  onGender,
  customGender,
  onCustomGender,
  canContinue,
  onContinue,
}: BasicInfoStepProps) {
  return (
    <View style={styles.stepGap}>
      <View style={styles.brandRow}>
        <Image source={WELCOME_LOOP_SOURCE} resizeMode="contain" style={styles.brandIcon} />
        <ThemedText style={styles.brandWordmark}>apparently you.</ThemedText>
      </View>
      <View style={styles.introGap}>
        <ThemedText type="title" style={styles.heading}>
          A little about you.
        </ThemedText>
        <ThemedText style={styles.subcopy}>Just enough to make your results more interesting.</ThemedText>
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>What should we call you?</ThemedText>
        <TextInput
          value={firstName}
          onChangeText={onFirstName}
          placeholder="First name"
          placeholderTextColor={Celestial.textMuted}
          style={styles.textInput}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>How old are you?</ThemedText>
        <View style={styles.pillWrap}>
          {AGE_RANGES.map((range) => {
            const isSelected = ageRange === range;
            return (
              <Pressable
                key={range}
                onPress={() => onAgeRange(range)}
                style={[styles.pill, isSelected && styles.pillSelected]}>
                <ThemedText style={[styles.pillText, isSelected && styles.pillTextSelected]}>{range}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>How do you describe your gender?</ThemedText>
        <View style={styles.pillWrap}>
          {GENDER_IDENTITIES.map((option) => {
            const isSelected = gender === option;
            return (
              <Pressable
                key={option}
                onPress={() => onGender(option)}
                style={[styles.pill, isSelected && styles.pillSelected]}>
                <ThemedText style={[styles.pillText, isSelected && styles.pillTextSelected]}>{option}</ThemedText>
              </Pressable>
            );
          })}
        </View>
        {gender === 'Another identity' && (
          <TextInput
            value={customGender}
            onChangeText={onCustomGender}
            placeholder="Optional — describe it your way"
            placeholderTextColor={Celestial.textMuted}
            style={styles.textInput}
            autoCorrect={false}
            returnKeyType="done"
          />
        )}
      </View>

      <Pressable disabled={!canContinue} onPress={onContinue} style={[styles.cta, !canContinue && styles.ctaDisabled]}>
        <ThemedText style={styles.ctaText}>Okay, now the fun part →</ThemedText>
      </Pressable>
    </View>
  );
}

function TransitionStep({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={[styles.stepGap, styles.centeredStep]}>
      <Image source={WELCOME_LOOP_SOURCE} resizeMode="contain" style={styles.heroIcon} />
      <ThemedText style={styles.transitionEyebrow}>Before we get nosy...</ThemedText>
      <ThemedText type="title" style={[styles.heading, styles.centerText]}>
        Give us your version.
      </ThemedText>
      <ThemedText style={[styles.subcopy, styles.centerText]}>
        Five quick picks. We&apos;ll remember what you said.
      </ThemedText>
      <Pressable onPress={onContinue} style={styles.cta}>
        <ThemedText style={styles.ctaText}>Go ahead →</ThemedText>
      </Pressable>
    </View>
  );
}

function QuestionStep({
  question,
  selected,
  onSelect,
  onNext,
  isLastQuestion,
}: {
  question: QuestionDef;
  selected: string | null;
  onSelect: (value: string) => void;
  onNext: () => void;
  isLastQuestion: boolean;
}) {
  const canContinue = selected !== null;

  return (
    // flexGrow lets the spacer below push the Next CTA down toward the bottom of the visible
    // screen on a phone with room to spare, without pinning it via absolute positioning — on
    // a shorter device, or with the keyboard/larger text, the spacer just collapses and the
    // ScrollView scrolls normally instead.
    <View style={[styles.stepGap, styles.growStep]}>
      <ThemedText type="title" style={styles.questionPrompt}>
        {question.prompt}
      </ThemedText>
      <View style={styles.choiceList}>
        {question.choices.map((choice, index) => {
          const isSelected = selected === choice;
          return (
            <Pressable
              key={choice}
              onPress={() => onSelect(choice)}
              style={[styles.choiceCard, isSelected && styles.choiceCardSelected]}>
              <View style={[styles.choiceBadge, isSelected && styles.choiceBadgeSelected]}>
                <ThemedText style={[styles.choiceBadgeText, isSelected && styles.choiceBadgeTextSelected]}>
                  {String.fromCharCode(65 + index)}
                </ThemedText>
              </View>
              <ThemedText style={styles.choiceText}>{choice}</ThemedText>
              {isSelected && <ThemedText style={styles.choiceCheck}>✓</ThemedText>}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.spacer} />
      <Pressable disabled={!canContinue} onPress={onNext} style={[styles.cta, !canContinue && styles.ctaDisabled]}>
        <ThemedText style={styles.ctaText}>{isLastQuestion ? 'Save my story →' : 'Next →'}</ThemedText>
      </Pressable>
    </View>
  );
}

function FinalStep({
  firstName,
  submitting,
  onFinish,
}: {
  firstName: string;
  submitting: boolean;
  onFinish: () => void;
}) {
  return (
    <View style={[styles.stepGap, styles.centeredStep]}>
      <Image source={WELCOME_LOOP_SOURCE} resizeMode="contain" style={styles.heroIcon} />
      <ThemedText type="title" style={[styles.heading, styles.centerText]}>
        Oh, we have thoughts.
      </ThemedText>
      <ThemedText style={[styles.subcopy, styles.centerText]}>We&apos;ll see how that holds up.</ThemedText>
      {firstName.length > 0 && (
        <ThemedText style={[styles.finalGreeting, styles.centerText]}>Nice to meet you, {firstName}.</ThemedText>
      )}
      <Pressable disabled={submitting} onPress={onFinish} style={[styles.cta, submitting && styles.ctaDisabled]}>
        <ThemedText style={styles.ctaText}>Give me today&apos;s drop →</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
        borderRadius: 28,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.five,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  backButton: {
    minWidth: 60,
  },
  backText: {
    color: Celestial.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  progressSegment: {
    height: 4,
    flex: 1,
    maxWidth: 28,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  progressSegmentFilled: {
    backgroundColor: Brand.gold,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 28,
    height: 28,
  },
  brandWordmark: {
    color: Celestial.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  // Matches BrandSignature's own 'hero' ICON_SIZE (48) for visual parity with every other
  // screen still using that component — only the image source differs here (see
  // WELCOME_LOOP_SOURCE's own comment for why).
  heroIcon: {
    width: 48,
    height: 48,
  },
  stepGap: {
    gap: Spacing.four,
  },
  growStep: {
    flexGrow: 1,
  },
  spacer: {
    flexGrow: 1,
  },
  // flexGrow + centered justify (rather than a fixed top padding) — these two steps are short
  // on content by design (one brand moment, one headline, one CTA), so they now center as a
  // single composed moment within the full screen instead of pinning near the top and leaving
  // bare, unintentional-looking space below the CTA.
  centeredStep: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  introGap: {
    gap: Spacing.two,
  },
  // Matches Today/Read's exact "major identity moment" treatment (src/app/(tabs)/index.tsx's
  // own `prompt` style) literally, value for value — same family/style/weight — rather than
  // the shared Type.display token (which several other untouched screens also consume), so
  // this reads as the same voice without touching anything outside onboarding.
  heading: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '500',
    color: Celestial.textPrimary,
    fontSize: 29,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  subcopy: {
    color: Celestial.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  fieldGroup: {
    gap: Spacing.two,
  },
  fieldLabel: {
    color: Celestial.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: Celestial.glassFill,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    color: Celestial.textPrimary,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    backgroundColor: Celestial.glassFill,
  },
  pillSelected: {
    backgroundColor: Brand.pink,
    borderColor: Brand.pink,
  },
  pillText: {
    color: Celestial.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  cta: {
    backgroundColor: Brand.pink,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.two,
  },
  ctaDisabled: {
    opacity: 0.35,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  transitionEyebrow: {
    color: Brand.pink,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  questionPrompt: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '500',
    color: Celestial.textPrimary,
    fontSize: 26,
    lineHeight: 33,
    letterSpacing: -0.3,
  },
  choiceList: {
    gap: Spacing.two,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 58,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: Celestial.glassFill,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
  },
  choiceCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: Brand.pink,
  },
  choiceBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  choiceBadgeSelected: {
    backgroundColor: Brand.pink,
  },
  choiceBadgeText: {
    color: Celestial.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  choiceBadgeTextSelected: {
    color: '#FFFFFF',
  },
  choiceText: {
    flex: 1,
    color: Celestial.textPrimary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  choiceCheck: {
    color: Brand.pink,
    fontSize: 18,
    fontWeight: '800',
  },
  finalGreeting: {
    color: Celestial.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
});
