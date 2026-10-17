// Curated walking tours for the Downtown Vancouver MVP.
// Stop order is the walking order. Every `prompt` is an observation challenge written for
// the app; factual hints inside prompts come from the artwork's own registry record.

export interface TourStop {
  id: number; // registryid from the City of Vancouver Public Art Registry
  prompt: string; // "Look closer" observation challenge
  /** Artist credit not present in the open-data export, added and checked by the curator. */
  curatedArtist?: string;
}

export interface Tour {
  id: string;
  title: string;
  tagline: string;
  theme: string;
  minutes: number;
  accent: string; // hex
  accentSoft: string;
  stops: TourStop[];
}

export const TOURS: Tour[] = [
  {
    id: 'waterfront',
    title: 'Waterfront Wonders',
    tagline: 'Chrome, raindrops and pixel whales along Coal Harbour',
    theme: 'Contemporary sculpture & memory by the water',
    minutes: 60,
    accent: '#0E6E6A',
    accentSoft: '#D6EBE8',
    stops: [
      {
        id: 24,
        curatedArtist: 'Coeur de Lion MacCarthy',
        prompt:
          'Look at the angel’s raised hand. The registry notes it originally held a full wreath — what do you see there today?',
      },
      {
        id: 755,
        prompt:
          'Walk slowly past the chrome rings. Can you find a spot where three rings reflect three different things at once?',
      },
      {
        id: 438,
        curatedArtist: 'Inges Idee',
        prompt:
          'Stand where the tip of The Drop points. What is on the horizon across the water — and what colour is the sky next to it?',
      },
      {
        id: 521,
        prompt:
          'The orca is built from blocks, like pixels. Step back until it looks smooth. How far did you have to go?',
      },
      {
        id: 555,
        curatedArtist: 'Costas Varotsos',
        prompt:
          'Nike is the Greek goddess of victory. Walk all the way around her — from which side does she look most in motion?',
      },
      {
        id: 559,
        prompt:
          'The refreshed panel tells the story in English, Punjabi and Hindi, and uses both names of the ship. Find both names.',
      },
      {
        id: 404,
        prompt:
          'LightShed is a half-scale model of the boat sheds that once lined this shore. Picture it full size — what might have been stored inside?',
      },
      {
        id: 392,
        prompt:
          'Read the steel letters along the walk — they quote Earle Birney’s poem “November Walk Near False Creek Mouth.” Find a word about the sea.',
      },
    ],
  },
  {
    id: 'heritage',
    title: 'Heritage Heart',
    tagline: 'Lions, fountains and a century of civic memory',
    theme: 'Monuments, relief & the stories behind them',
    minutes: 50,
    accent: '#A4461B',
    accentSoft: '#F4E1D4',
    stops: [
      {
        id: 865,
        prompt:
          'Find the four red horns on top of the lighting pole. If it’s Friday at 5 p.m., stay and listen to the chime!',
      },
      {
        id: 44,
        prompt:
          'Each lion weighs 15 tons and is modelled on the lions of Trafalgar Square. Compare their size to the people on the stairs.',
      },
      {
        id: 45,
        prompt:
          'This fountain once had bronze drinking cups on chains — they were stolen soon after it opened. Where might they have hung?',
      },
      {
        id: 337,
        prompt:
          'Look up at the corners of the Gallery’s roof. Which boat do you spot first, and which way is it pointing?',
      },
      {
        id: 205,
        prompt:
          'Hunt the pool for a clock face, ruins, and the numbers five, six and seven — a countdown to the millennium.',
      },
      {
        id: 528,
        prompt:
          'Mind Crystal grew from the hexagonal planters found around the city. Can you spot another hexagon on this plaza?',
      },
      {
        id: 42,
        prompt:
          'This granite postman was moved to this corner in 2023. What is he carrying, and which way is he walking?',
      },
      {
        id: 863,
        prompt:
          'Gaslight is a pun — neon is literally light made from gas. Look up at the roofline: can you find the outline of a flame?',
      },
      {
        id: 61,
        prompt:
          'The Cenotaph has three sides to match the triangular park. Count the stone helmets on its corners.',
      },
    ],
  },
];

export const tourById = (id: string) => TOURS.find((t) => t.id === id);
