// Round 3: Who Am I?
// A pixelated celebrity photo de-pixelates over 30 seconds.
// Distractors chosen to share visual features (hair, skin tone, build)
// so multiple options look plausible at low resolution.

module.exports = [
  {
    id: 'wa-1',
    roundType: 'whoAmI',
    image: '/assets/celebrities/einstein.jpg',
    startResolution: 6,
    endResolution: 500,
    correctAnswer: 'B',
    options: {
      A: 'Mark Twain',
      B: 'Albert Einstein',
      C: 'Richard Branson',
      D: 'Boris Johnson',
    },
  },
  {
    id: 'wa-2',
    roundType: 'whoAmI',
    image: '/assets/celebrities/the-rock.jpg',
    startResolution: 6,
    endResolution: 500,
    correctAnswer: 'C',
    options: {
      A: 'Vin Diesel',
      B: 'Jason Statham',
      C: 'Dwayne Johnson',
      D: 'Mike Tyson',
    },
  },
  {
    id: 'wa-3',
    roundType: 'whoAmI',
    image: '/assets/celebrities/attenborough.jpg',
    startResolution: 6,
    endResolution: 500,
    correctAnswer: 'A',
    options: {
      A: 'David Attenborough',
      B: 'Patrick Stewart',
      C: 'Ian McKellen',
      D: 'Michael Caine',
    },
  },
  {
    id: 'wa-4',
    roundType: 'whoAmI',
    image: '/assets/celebrities/beyonce.jpg',
    startResolution: 6,
    endResolution: 500,
    correctAnswer: 'D',
    options: {
      A: 'Rihanna',
      B: 'Zendaya',
      C: 'Alicia Keys',
      D: 'Beyoncé',
    },
  },
];
