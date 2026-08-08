"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Bike, Trophy, Heart, Dumbbell } from "lucide-react";

const STEPS = 3;

const GOALS = [
  { id: "fun", label: "تفریح و سرگرمی", icon: Heart, color: "bg-red-50 text-red-500 border-red-200" },
  { id: "fitness", label: "تناسب اندام", icon: Dumbbell, color: "bg-blue-50 text-blue-500 border-blue-200" },
  { id: "professional", label: "مسیر حرفه‌ای", icon: Trophy, color: "bg-gold-50 text-gold-600 border-gold-200" },
  { id: "transport", label: "حمل و نقل شهری", icon: Bike, color: "bg-green-50 text-green-500 border-green-200" },
];

const LEVELS = [
  { id: "BEGINNER", label: "مبتدی", desc: "تازه می‌خوام شروع کنم", emoji: "🌱" },
  { id: "INTERMEDIATE", label: "متوسط", desc: "یه مدت هست اسکیت می‌کنم", emoji: "⚡" },
  { id: "ADVANCED", label: "پیشرفته", desc: "تجربه زیادی دارم", emoji: "🏆" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFinish() {
    setSaving(true);
    try {
      await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, goal, skillLevel: level }),
      });
      router.push("/app");
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  function canNext() {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return goal !== "";
    if (step === 2) return level !== "";
    return false;
  }

  return (
    <div className="flex flex-col min-h-full px-6">
      {/* Progress */}
      <div className="flex gap-2 pt-8 mb-8">
        {Array.from({ length: STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-500",
              i <= step ? "bg-primary" : "bg-surface-container"
            )}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1">
        {/* Step 0: Name */}
        {step === 0 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2">خوش اومدی! 👋</h1>
            <p className="text-on-surface-muted text-sm mb-8">
              اسمت رو بگو تا بیشتر آشنا بشیم
            </p>
            <input
              type="text"
              placeholder="نام شما"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full h-14 px-4 text-lg bg-surface-dim rounded-[var(--radius-input)] border border-transparent focus:border-primary focus:outline-none transition-colors text-center"
            />
          </div>
        )}

        {/* Step 1: Goal */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2">
              {name}، هدفت از اسکیت چیه؟
            </h1>
            <p className="text-on-surface-muted text-sm mb-8">
              بر اساس هدفت بهترین مسیر رو پیشنهاد می‌دیم
            </p>
            <div className="grid gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-[var(--radius-card)] border-2 transition-all text-right",
                    goal === g.id
                      ? "border-primary bg-primary/5"
                      : "border-surface-container bg-white"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", g.color)}>
                    <g.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{g.label}</span>
                  {goal === g.id && (
                    <div className="mr-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Level */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2">سطح مهارتت کجاست؟</h1>
            <p className="text-on-surface-muted text-sm mb-8">
              آموزش‌ها بر اساس سطحت فیلتر میشن
            </p>
            <div className="grid gap-3">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-[var(--radius-card)] border-2 transition-all text-right",
                    level === l.id
                      ? "border-primary bg-primary/5"
                      : "border-surface-container bg-white"
                  )}
                >
                  <span className="text-3xl">{l.emoji}</span>
                  <div>
                    <p className="font-bold text-sm">{l.label}</p>
                    <p className="text-xs text-on-surface-muted mt-0.5">{l.desc}</p>
                  </div>
                  {level === l.id && (
                    <div className="mr-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pb-10 pt-6">
        {step > 0 && (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setStep(step - 1)}
          >
            قبلی
          </Button>
        )}
        <Button
          size="full"
          disabled={!canNext() || saving}
          onClick={() => {
            if (step < STEPS - 1) setStep(step + 1);
            else handleFinish();
          }}
        >
          {step < STEPS - 1 ? (
            <>
              بعدی
              <ArrowLeft className="w-4 h-4 mr-2" />
            </>
          ) : saving ? (
            "در حال ذخیره..."
          ) : (
            "شروع کنیم! 🛼"
          )}
        </Button>
      </div>
    </div>
  );
}
