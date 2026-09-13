// LORA voice-first experience utilities (BonusP23)

export function isSpeechSupported() {
  return typeof window !== "undefined" && (("SpeechRecognition" in window) || ("webkitSpeechRecognition" in window));
}

export function startSpeechRecognition(
  lang: string,
  onResult: (text: string) => void,
  onEnd?: () => void
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const SR = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  if (!SR) return () => undefined;
  const recognition = new (SR as new () => { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: { results: { isFinal: boolean; [0]: { transcript: string } }[] }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void })();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };
  recognition.onend = () => onEnd?.();
  recognition.start();
  return () => recognition.stop();
}

export function speak(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  window.speechSynthesis.speak(utter);
}
