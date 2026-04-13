// Round 4: What's Wrong?
// Modified landmark with a subtle error; hint pulses around 20s mark.

module.exports = [
  {
    id: 'ww-1',
    roundType: 'whatsWrong',
    image: '/assets/landmarks/modified-tower-bridge.svg',
    hintZone: { x: '30%', y: '30%', radius: 90 },
    correctAnswer: 'C',
    options: {
      A: 'The bridge is missing a cable',
      B: 'There are extra windows',
      C: 'The towers have different heights',
      D: 'The river is flowing backwards',
    },
  },
  {
    id: 'ww-2',
    roundType: 'whatsWrong',
    image: '/assets/landmarks/modified-pyramids.svg',
    hintZone: { x: '80%', y: '55%', radius: 80 },
    correctAnswer: 'A',
    options: {
      A: 'There are 4 pyramids instead of 3',
      B: 'The sphinx is missing',
      C: 'The pyramids are upside down',
      D: 'They are in the wrong colors',
    },
  },
  {
    id: 'ww-3',
    roundType: 'whatsWrong',
    image: '/assets/landmarks/modified-taj-mahal.svg',
    hintZone: { x: '22%', y: '55%', radius: 70 },
    correctAnswer: 'B',
    options: {
      A: 'The dome is the wrong shape',
      B: 'A minaret is missing',
      C: 'The reflecting pool is the wrong color',
      D: 'The archway is too small',
    },
  },
  {
    id: 'ww-4',
    roundType: 'whatsWrong',
    image: '/assets/landmarks/modified-rushmore.svg',
    hintZone: { x: '85%', y: '55%', radius: 70 },
    correctAnswer: 'D',
    options: {
      A: 'The mountain is the wrong color',
      B: 'The sky has no clouds',
      C: 'A face is missing',
      D: 'There are 5 faces instead of 4',
    },
  },
];
