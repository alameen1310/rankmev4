import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, BookOpen, Target, Users, Gift, Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Confetti } from '@/components/Confetti';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const GOALS = [
  { id: 'jamb', label: 'JAMB', icon: '🎓' },
  { id: 'waec', label: 'WAEC', icon: '📝' },
  { id: 'school', label: 'School Exams', icon: '🏫' },
  { id: 'general', label: 'General Knowledge', icon: '🧠' },
  { id: 'practice', label: 'Just Practicing', icon: '🎯' },
];

const SUBJECTS = [
  { id: 'math', label: 'Mathematics', icon: '📐', preChecked: true },
  { id: 'english', label: 'English', icon: '📖', preChecked: true },
  { id: 'physics', label: 'Physics', icon: '⚛️' },
  { id: 'chemistry', label: 'Chemistry', icon: '🧪' },
  { id: 'biology', label: 'Biology', icon: '🧬' },
  { id: 'economics', label: 'Economics', icon: '📊' },
  { id: 'government', label: 'Government', icon: '🏛️' },
  { id: 'literature', label: 'Literature', icon: '📚' },
];

const slideVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['math', 'english']);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewardRevealed, setRewardRevealed] = useState(false);

  const totalSteps = 5;

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const revealReward = () => {
    setRewardRevealed(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
  };

  const next = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <Confetti isActive={showConfetti} />

      {/* Progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                i <= step ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
                  <Zap className="h-10 w-10 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold mb-2">Welcome to RankMe</h1>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Turn study into competition. Climb leaderboards. Challenge friends. Win streaks.
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Goals */}
            {step === 1 && (
              <div className="flex-1 flex flex-col pt-8">
                <h2 className="text-xl font-bold mb-1">What are you preparing for?</h2>
                <p className="text-sm text-muted-foreground mb-6">Select up to 2</p>
                <div className="space-y-2">
                  {GOALS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all game-tap text-left",
                        selectedGoals.includes(g.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className="text-xl">{g.icon}</span>
                      <span className="font-semibold text-sm">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Subjects */}
            {step === 2 && (
              <div className="flex-1 flex flex-col pt-8">
                <h2 className="text-xl font-bold mb-1">Pick your favorite subjects</h2>
                <p className="text-sm text-muted-foreground mb-6">Select at least 2 to get started</p>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECTS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all game-tap text-left",
                        selectedSubjects.includes(s.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className="text-lg">{s.icon}</span>
                      <span className="font-semibold text-xs">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: First-play reward */}
            {step === 3 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                <div className="relative">
                  <button
                    onClick={revealReward}
                    disabled={rewardRevealed}
                    className={cn(
                      "w-24 h-24 rounded-2xl flex items-center justify-center text-5xl transition-transform",
                      !rewardRevealed && "animate-bounce-subtle cursor-pointer"
                    )}
                  >
                    {rewardRevealed ? '🎉' : '🎁'}
                  </button>
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    {rewardRevealed ? "You got +50 XP!" : "Welcome Gift!"}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {rewardRevealed
                      ? "Your bonus XP has been added. Start quizzing to earn more!"
                      : "Tap the box to claim your first reward"}
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Notifications + Start */}
            {step === 4 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Stay in the game</h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Get notified about daily challenges, rival activity, and streak reminders.
                  </p>
                </div>
                <div className="w-full space-y-2 max-w-xs">
                  <Button
                    onClick={() => {
                      if ('Notification' in window) {
                        Notification.requestPermission();
                      }
                      next();
                    }}
                    className="w-full game-tap"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Turn on notifications
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={next}
                    className="w-full text-muted-foreground"
                  >
                    Not now
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      {step !== 4 && (
        <div className="px-6 pb-8 pt-4">
          <Button
            onClick={next}
            disabled={step === 1 && selectedGoals.length === 0}
            className="w-full h-14 text-base font-semibold rounded-xl game-tap shadow-[0_6px_18px_rgba(79,110,247,0.16)]"
          >
            {step === 0 ? 'Get Started' :
             step === 3 ? (rewardRevealed ? 'Continue' : 'Skip') :
             'Continue'}
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
