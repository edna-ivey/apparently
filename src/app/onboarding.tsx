import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
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

type Step = 'welcome' | 'basic' | 'transition' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'final';
const STEP_ORDER: Step[] = ['welcome', 'basic', 'transition', 'q1', 'q2', 'q3', 'q4', 'q5', 'final'];

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

  // Mirrors the (tabs) layout's own gate in the opposite direction: a device that has
  // already completed onboarding but manually lands here again (a stale web bookmark, a
  // back-navigation) gets sent to Today instead of re-running the flow. Placed after every
  // hook call above so hook order stays unconditional across renders.
  if (onboardingState !== 'loading' && onboardingState.completed) {
    return <Redirect href="/" />;
  }

  const goNext = () => setStepIndex((index) => Math.min(index + 1, STEP_ORDER.length - 1));
  const goBack = () => setStepIndex((index) => Math.max(index - 1, 0));

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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            {stepIndex > 0 ? (
              <Pressable onPress={goBack} hitSlop={12} style={styles.backButton}>
                <ThemedText style={styles.backText}>← Back</ThemedText>
              </Pressable>
            ) : (
              <View style={styles.backButton} />
            )}
            {currentQuestion ? (
              <ThemedText style={styles.progress}>
                {questionIndex + 1} of {QUESTIONS.length}
              </ThemedText>
            ) : null}
          </View>

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
    backgroundColor: Brand.plum,
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
      <BrandSignature variant="full" />
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
          placeholderTextColor={Brand.inkSecondary}
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
            placeholderTextColor={Brand.inkSecondary}
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
      <BrandSignature variant="hero" />
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
      <BrandSignature variant="hero" />
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
    backgroundColor: '#F0E8DD',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFF9F5',
    ...Platform.select({
      web: {
        marginVertical: 28,
        borderRadius: 28,
        boxShadow: '0 24px 64px rgba(23, 21, 29, 0.10)',
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
    color: Brand.violet,
    fontSize: 14,
    fontWeight: '700',
  },
  progress: {
    color: Brand.inkSecondary,
    fontSize: 13,
    fontWeight: '700',
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
  centeredStep: {
    alignItems: 'center',
    paddingTop: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
  },
  introGap: {
    gap: Spacing.two,
  },
  heading: {
    color: Brand.ink,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subcopy: {
    color: Brand.inkSecondary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  fieldGroup: {
    gap: Spacing.two,
  },
  fieldLabel: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    color: Brand.ink,
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
    borderColor: '#F0E6E8',
    backgroundColor: '#FFFFFF',
  },
  pillSelected: {
    backgroundColor: Brand.pink,
    borderColor: Brand.pink,
  },
  pillText: {
    color: Brand.ink,
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
    color: Brand.ink,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.6,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E6E8',
  },
  choiceCardSelected: {
    backgroundColor: '#FFE5EF',
    borderColor: Brand.pink,
  },
  choiceBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F3FF',
  },
  choiceBadgeSelected: {
    backgroundColor: Brand.pink,
  },
  choiceBadgeText: {
    color: Brand.violet,
    fontSize: 12,
    fontWeight: '800',
  },
  choiceBadgeTextSelected: {
    color: '#FFFFFF',
  },
  choiceText: {
    flex: 1,
    color: Brand.ink,
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
    color: Brand.inkSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
});
