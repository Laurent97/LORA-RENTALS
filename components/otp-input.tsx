"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { OTP_LENGTH } from "@/lib/constants";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

// One-time-code input. Supports typing, paste, backspace, arrows and
// mobile OTP autofill (autocomplete="one-time-code" on the first box).
export function OtpInput({ value, onChange, onComplete, length = OTP_LENGTH, disabled, error, autoFocus = true }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const handleInput = (i: number, raw: string) => {
    const chars = raw.replace(/\D/g, "");
    if (!chars) return;
    // Handles both single keystrokes and full-code autofill into one box
    const next = (value.slice(0, i) + chars + value.slice(i + chars.length)).slice(0, length);
    commit(next);
    refs.current[Math.min(i + chars.length, length - 1)]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) commit(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) {
        commit(value.slice(0, i - 1) + value.slice(i));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    commit(e.clipboardData.getData("text"));
    refs.current[length - 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste} role="group" aria-label="Verification code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-14 w-11 rounded-xl border-2 bg-background text-center font-mono text-2xl font-bold tabular-nums transition-colors sm:h-16 sm:w-12",
            "focus:outline-none focus:ring-2 focus:ring-gold/60",
            error ? "border-destructive" : d ? "border-gold" : "border-border",
            disabled && "opacity-60"
          )}
        />
      ))}
    </div>
  );
}
