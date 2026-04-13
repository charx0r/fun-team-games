// Round 3: Map Jigsaw
// Country outline pre-split into 4-6 pieces; they drift toward correct positions.

module.exports = [
  {
    id: 'mj-1',
    roundType: 'jigsaw',
    country: 'italy',
    pieces: [
      { id: 'p0', pathData: 'M60 20 L120 10 L140 60 L110 80 L70 70 Z', correctX: 110, correctY: 40 },
      { id: 'p1', pathData: 'M70 70 L110 80 L130 120 L100 140 L80 110 Z', correctX: 110, correctY: 110 },
      { id: 'p2', pathData: 'M80 110 L100 140 L130 170 L110 200 L85 175 Z', correctX: 110, correctY: 160 },
      { id: 'p3', pathData: 'M85 175 L110 200 L160 210 L170 240 L140 255 L100 235 Z', correctX: 130, correctY: 220 },
      { id: 'p4', pathData: 'M140 255 L170 240 L220 245 L240 260 L210 275 L170 270 Z', correctX: 190, correctY: 260 },
      { id: 'p5', pathData: 'M20 270 L70 265 L100 275 L85 290 L40 288 Z', correctX: 60, correctY: 280 },
    ],
    viewBox: '0 0 280 320',
    shuffleSeed: 77,
    correctAnswer: 'C',
    options: {
      A: 'France',
      B: 'Germany',
      C: 'Italy',
      D: 'Spain',
    },
  },
  {
    id: 'mj-2',
    roundType: 'jigsaw',
    country: 'japan',
    pieces: [
      { id: 'p0', pathData: 'M40 30 L80 20 L100 60 L70 80 L45 70 Z', correctX: 70, correctY: 50 },
      { id: 'p1', pathData: 'M70 80 L130 90 L180 140 L150 170 L100 150 L70 120 Z', correctX: 130, correctY: 130 },
      { id: 'p2', pathData: 'M150 170 L210 180 L240 220 L210 250 L170 230 Z', correctX: 200, correctY: 215 },
      { id: 'p3', pathData: 'M20 240 L60 235 L90 270 L50 285 Z', correctX: 55, correctY: 265 },
    ],
    viewBox: '0 0 280 320',
    shuffleSeed: 133,
    correctAnswer: 'A',
    options: {
      A: 'Japan',
      B: 'Philippines',
      C: 'New Zealand',
      D: 'Indonesia',
    },
  },
  {
    id: 'mj-3',
    roundType: 'jigsaw',
    country: 'australia',
    pieces: [
      { id: 'p0', pathData: 'M30 100 L90 80 L130 90 L120 140 L60 150 L25 130 Z', correctX: 75, correctY: 115 },
      { id: 'p1', pathData: 'M130 90 L200 70 L240 90 L250 140 L200 145 L120 140 Z', correctX: 185, correctY: 110 },
      { id: 'p2', pathData: 'M25 130 L60 150 L90 200 L60 230 L30 210 Z', correctX: 55, correctY: 180 },
      { id: 'p3', pathData: 'M60 150 L120 140 L200 145 L210 200 L150 220 L90 200 Z', correctX: 135, correctY: 180 },
      { id: 'p4', pathData: 'M210 200 L250 140 L270 180 L260 230 L220 225 Z', correctX: 245, correctY: 190 },
    ],
    viewBox: '0 0 300 280',
    shuffleSeed: 201,
    correctAnswer: 'B',
    options: {
      A: 'Brazil',
      B: 'Australia',
      C: 'Argentina',
      D: 'Kazakhstan',
    },
  },
  {
    id: 'mj-4',
    roundType: 'jigsaw',
    country: 'chile',
    pieces: [
      { id: 'p0', pathData: 'M120 10 L145 10 L150 70 L125 75 Z', correctX: 135, correctY: 40 },
      { id: 'p1', pathData: 'M125 75 L150 70 L155 150 L128 155 Z', correctX: 140, correctY: 110 },
      { id: 'p2', pathData: 'M128 155 L155 150 L160 230 L132 235 Z', correctX: 145, correctY: 195 },
      { id: 'p3', pathData: 'M132 235 L160 230 L163 305 L134 310 Z', correctX: 148, correctY: 270 },
      { id: 'p4', pathData: 'M134 310 L163 305 L170 380 L137 385 Z', correctX: 152, correctY: 345 },
    ],
    viewBox: '0 0 280 400',
    shuffleSeed: 255,
    correctAnswer: 'D',
    options: {
      A: 'Norway',
      B: 'Peru',
      C: 'Vietnam',
      D: 'Chile',
    },
  },
];
