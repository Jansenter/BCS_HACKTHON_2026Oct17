import { useState } from 'react';
import type { Artwork } from '../lib/data';
import { triviaFor } from '../lib/challenge';
import { useChallenges } from '../lib/storage';

/** Stretch feature: an observation prompt + one fact-based question from the registry record. */
export default function Challenge({ art, prompt, accent }: { art: Artwork; prompt?: string; accent: string }) {
  const trivia = triviaFor(art);
  const { answers, record } = useChallenges();
  const lookKey = `look-${art.id}`;
  const answered = trivia ? answers[trivia.key] : undefined;
  const [picked, setPicked] = useState<string | null>(null);

  if (!prompt && !trivia) return null;

  return (
    <section className="rounded-2xl border border-line bg-card p-4" aria-labelledby={`ch-${art.id}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full text-sm text-white" style={{ background: accent }} aria-hidden>
          ◎
        </span>
        <h3 id={`ch-${art.id}`} className="font-display text-lg font-semibold">
          Look closer
        </h3>
      </div>

      {prompt && (
        <div className="mb-4">
          <p className="text-[15px] leading-relaxed text-ink-2">{prompt}</p>
          <button
            onClick={() => record(lookKey, true)}
            disabled={answers[lookKey]}
            className="mt-3 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition hover:bg-paper-2 disabled:cursor-default disabled:border-transparent disabled:bg-good/10 disabled:text-good"
          >
            {answers[lookKey] ? '✓ Spotted it' : 'I spotted it'}
          </button>
        </div>
      )}

      {trivia && (
        <div className={prompt ? 'border-t border-line pt-4' : ''}>
          <p className="mb-3 text-[15px] font-semibold">{trivia.question}</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Answer options">
            {trivia.options.map((opt) => {
              const isAnswer = opt === trivia.answer;
              const done = answered !== undefined;
              const chosen = picked === opt;
              let style = 'border-line bg-paper hover:border-ink/40';
              if (done && isAnswer) style = 'border-good bg-good/10 text-good';
              else if (done && chosen) style = 'border-vermilion bg-vermilion/10 text-vermilion-dark';
              else if (done) style = 'border-line bg-paper opacity-60';
              return (
                <button
                  key={opt}
                  disabled={done}
                  onClick={() => {
                    setPicked(opt);
                    record(trivia.key, isAnswer);
                  }}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${style}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {answered !== undefined && (
            <p className="rise mt-3 text-sm text-ink-2" role="status">
              <strong className={answered ? 'text-good' : 'text-vermilion-dark'}>{answered ? 'Nice eye!' : 'Not quite.'}</strong>{' '}
              The answer is <strong>{trivia.answer}</strong>. <span className="text-ink-3">{trivia.source}</span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
