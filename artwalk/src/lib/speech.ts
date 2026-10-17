import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Split narration into sentence-sized chunks (Chrome stops long utterances after ~15 s). */
export function toChunks(text: string): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .match(/[^.!?…]+[.!?…]+["”’)]*\s*|[^.!?…]+$/g) ?? [text];
  const chunks: string[] = [];
  for (const s of sentences.map((x) => x.trim()).filter(Boolean)) {
    if (s.length <= 240) chunks.push(s);
    else chunks.push(...(s.match(/.{1,220}(\s|$)/g) ?? [s]).map((x) => x.trim()));
  }
  return chunks;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang === 'en-CA' ? 4 : v.lang === 'en-US' || v.lang === 'en-GB' ? 2 : 0) +
    (/natural|neural|premium|enhanced|google|samantha|daniel/i.test(v.name) ? 3 : 0) +
    (v.localService ? 1 : 0);
  return voices.sort((a, b) => score(b) - score(a))[0];
}

export type SpeechState = 'idle' | 'playing' | 'paused';

/** Narrate a list of sentence chunks (see toChunks) with play/pause, speed and seek. */
export function useNarration(chunks: string[]) {
  const text = useMemo(() => chunks.join('\u241e'), [chunks]);
  const [state, setState] = useState<SpeechState>('idle');
  const [index, setIndex] = useState(-1);
  const [rate, setRate] = useState(1);
  const token = useRef(0); // invalidates callbacks from cancelled runs

  const stop = useCallback(() => {
    token.current++;
    if (speechSupported) window.speechSynthesis.cancel();
    setState('idle');
    setIndex(-1);
  }, []);

  const speakFrom = useCallback(
    (start: number) => {
      if (!speechSupported) return;
      const run = ++token.current;
      window.speechSynthesis.cancel();
      const voice = pickVoice();
      const say = (i: number) => {
        if (run !== token.current) return;
        if (i >= chunks.length) {
          setState('idle');
          setIndex(-1);
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[i]);
        if (voice) u.voice = voice;
        u.lang = voice?.lang ?? 'en-CA';
        u.rate = rate;
        u.onstart = () => run === token.current && setIndex(i);
        u.onend = () => say(i + 1);
        u.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') say(i + 1);
        };
        window.speechSynthesis.speak(u);
      };
      setState('playing');
      setIndex(start);
      say(start);
    },
    [chunks, rate],
  );

  const toggle = useCallback(() => {
    if (!speechSupported) return;
    if (state === 'idle') speakFrom(0);
    else if (state === 'playing') {
      window.speechSynthesis.pause();
      setState('paused');
    } else {
      window.speechSynthesis.resume();
      setState('playing');
    }
  }, [state, speakFrom]);

  // Changing speed mid-story restarts from the current sentence (rate is read at speak time).
  const lastRate = useRef(rate);
  useEffect(() => {
    if (lastRate.current !== rate && state === 'playing' && index >= 0) speakFrom(index);
    lastRate.current = rate;
    // Only react to rate changes; state/index are read as current values.
  }, [rate]); // eslint-disable-line react-hooks/exhaustive-deps

  // New story or unmount → silence.
  useEffect(() => stop, [text, stop]);

  return { chunks, state, index, rate, setRate, toggle, stop, jumpTo: speakFrom };
}
