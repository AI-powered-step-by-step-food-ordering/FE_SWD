'use client';

import { useEffect, useMemo, useRef } from 'react';

interface ProgressBarProps {
  steps: string[];
  currentStep: number; // 1-indexed
}

export default function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  const clampedCurrent = Math.min(Math.max(currentStep, 1), Math.max(steps.length, 1));

  // Refs for auto-scroll to active step (hooks must be top-level, not conditional)
  const rowRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  const isPlaceholder = steps.length <= 1;

  useEffect(() => {
    const activeRef = stepRefs.current[clampedCurrent - 1];
    const row = rowRef.current;
    if (activeRef && row) {
      // Smoothly center the active step in view
      activeRef.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [clampedCurrent, steps.length]);

  if (isPlaceholder) {
    return (
      <div className="mb-4">
        <div className="w-full rounded-full border border-dashed border-green-300 bg-white/60 py-3 px-4 text-center text-sm text-gray-600">
          Chọn Template ở cột trái để hiển thị các bước
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 overflow-x-auto step-scrollbar" ref={rowRef}>
      <div className="relative flex items-center gap-6 min-w-max pr-4">
        {steps.map((step, index) => {
          const passed = index + 1 < clampedCurrent; // fully completed
          const active = index + 1 === clampedCurrent;
          return (
            <div key={`${index}-${step}`} className="flex items-center gap-4" ref={(el) => { stepRefs.current[index] = el; }}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  active || passed ? 'bg-green-600 text-white shadow ring-2 ring-green-300' : 'bg-gray-200 text-gray-600'
                }`}
                title={step}
              >
                {index + 1}
              </div>
              <span
                className={`text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                  active || passed ? 'text-green-700' : 'text-gray-500'
                }`}
                title={step}
              >
                {step}
              </span>
              {/* connector with inner animated fill */}
              {index < steps.length - 1 && (
                <div className="relative h-1 w-16 rounded-full bg-gray-200/80 overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-600 transition-all duration-700 ${
                      passed ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

