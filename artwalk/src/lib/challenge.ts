import { ARTWORKS, type Artwork } from './data';

export interface Trivia {
  key: string;
  question: string;
  options: string[];
  answer: string;
  source: string;
}

function rng(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const shortMaterial = (m: string) => {
  const first = m.split(/[,;]| and /i)[0].trim();
  return first.charAt(0).toUpperCase() + first.slice(1);
};

const MATERIAL_POOL = [
  ...new Map(
    ARTWORKS.map((a) => a.material)
      .filter((m): m is string => !!m && m.length < 60)
      .map(shortMaterial)
      .filter((m) => m.length < 28)
      .map((m) => [m.toLowerCase(), m] as const),
  ).values(),
];

/** Fact-based questions generated straight from the registry record — no invented facts. */
export function triviaFor(art: Artwork): Trivia | null {
  const rand = rng(art.id);

  if (art.material) {
    const answer = shortMaterial(art.material);
    if (answer.length < 28) {
      const distractors = shuffle(
        MATERIAL_POOL.filter((m) => {
          const x = m.toLowerCase(), y = answer.toLowerCase();
          return !x.includes(y) && !y.includes(x);
        }),
        rand,
      ).slice(0, 3);
      return {
        key: `material-${art.id}`,
        question: 'Look closely — what is the main material of this work?',
        options: shuffle([answer, ...distractors], rand),
        answer,
        source: `Registry material: “${art.material}”`,
      };
    }
  }

  if (art.year) {
    const offsets = shuffle([-41, -27, -14, -8, 9, 16, 33, 52], rand).filter((o) => art.year! + o <= 2026);
    const options = [art.year, ...offsets.slice(0, 3).map((o) => art.year! + o)].map(String);
    return {
      key: `year-${art.id}`,
      question: 'When do you think this work was installed here?',
      options: shuffle(options, rand),
      answer: String(art.year),
      source: `Registry year of installation: ${art.year}`,
    };
  }
  return null;
}
