"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const MOODS = [
  { id: "love", emoji: "😍", label: "عاشقم" },
  { id: "excited", emoji: "🤩", label: "هیجان زده‌ام" },
  { id: "cool", emoji: "😎", label: "باحالم" },
  { id: "happy", emoji: "😄", label: "خوشحال‌ترینم" },
  { id: "kind", emoji: "🤗", label: "مهربونم" },
  { id: "satisfied", emoji: "😊", label: "راضی‌ام" },
  { id: "neutral", emoji: "😐", label: "بی‌تفاوتم" },
  { id: "tired", emoji: "😩", label: "خسته‌ام" },
  { id: "sad", emoji: "😢", label: "ناراحتم" },
  { id: "sick", emoji: "🤒", label: "مریضم" },
  { id: "angry", emoji: "😡", label: "عصبانی‌ام" },
  { id: "confused", emoji: "😵‍💫", label: "گیجم" },
];

interface MoodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mood: string) => void;
  currentMood?: string | null;
}

export function MoodSelector({ isOpen, onClose, onSelect, currentMood }: MoodSelectorProps) {
  const [selected, setSelected] = useState<string | null>(currentMood || null);

  useEffect(() => {
    setSelected(currentMood || null);
  }, [currentMood]);

  if (!isOpen) return null;

  function handleConfirm() {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-24 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose}><X className="w-5 h-5" /></button>
          <h2 className="font-bold text-base">امروز چطوری؟</h2>
          <div className="w-5" />
        </div>

        <div className="grid grid-cols-4 gap-3">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setSelected(mood.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                selected === mood.id
                  ? "bg-primary/10 ring-2 ring-primary scale-105"
                  : "bg-surface-dim hover:bg-surface-container"
              }`}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-[10px] font-medium text-on-surface-muted">{mood.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selected}
          className={`w-full mt-5 py-3 rounded-2xl text-sm font-bold transition-colors ${
            selected
              ? "bg-primary text-black"
              : "bg-surface-container text-on-surface-muted"
          }`}
        >
          تأیید
        </button>
      </div>
    </div>
  );
}

// Small button for home page
export function MoodButton({ mood, onClick }: { mood: string | null; onClick: () => void }) {
  const currentEmoji = mood ? MOODS.find((m) => m.id === mood)?.emoji : "😊";

  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full bg-surface-dim flex items-center justify-center text-lg hover:scale-110 transition-transform"
    >
      {currentEmoji || "😊"}
    </button>
  );
}
