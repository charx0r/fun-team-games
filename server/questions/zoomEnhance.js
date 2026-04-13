// Round 2: Zoom & Enhance
// Start at high zoom on a detail, zoom out to scale 1 over 30s.

module.exports = [
  {
    id: 'ze-1',
    roundType: 'zoom',
    image: '/assets/landmarks/big-ben.svg',
    zoomOrigin: { x: '50%', y: '38%' },
    initialZoom: 8,
    correctAnswer: 'B',
    options: {
      A: 'Empire State Building',
      B: 'Big Ben',
      C: 'Leaning Tower of Pisa',
      D: 'CN Tower',
    },
  },
  {
    id: 'ze-2',
    roundType: 'zoom',
    image: '/assets/landmarks/leaning-tower.svg',
    zoomOrigin: { x: '55%', y: '55%' },
    initialZoom: 8,
    correctAnswer: 'C',
    options: {
      A: 'Space Needle',
      B: 'Tower of London',
      C: 'Leaning Tower of Pisa',
      D: 'Minaret of Jam',
    },
  },
  {
    id: 'ze-3',
    roundType: 'zoom',
    image: '/assets/landmarks/christ-redeemer.svg',
    zoomOrigin: { x: '50%', y: '30%' },
    initialZoom: 9,
    correctAnswer: 'A',
    options: {
      A: 'Christ the Redeemer',
      B: 'Angel of the North',
      C: 'Statue of Unity',
      D: 'Motherland Calls',
    },
  },
  {
    id: 'ze-4',
    roundType: 'zoom',
    image: '/assets/landmarks/golden-gate.svg',
    zoomOrigin: { x: '30%', y: '45%' },
    initialZoom: 8,
    correctAnswer: 'D',
    options: {
      A: 'Brooklyn Bridge',
      B: 'Tower Bridge',
      C: 'Sydney Harbour Bridge',
      D: 'Golden Gate Bridge',
    },
  },
];
