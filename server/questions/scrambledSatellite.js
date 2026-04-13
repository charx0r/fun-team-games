// Round 1: Scrambled Satellite
// SVG of a landmark split into 4x4 grid, shuffled, hints snap every 10s.

module.exports = [
  {
    id: 'ss-1',
    roundType: 'scrambled',
    image: '/assets/landmarks/eiffel-tower.svg',
    shuffleSeed: 42,
    correctAnswer: 'A',
    options: {
      A: 'Eiffel Tower',
      B: 'Big Ben',
      C: 'Colosseum',
      D: 'Taj Mahal',
    },
  },
  {
    id: 'ss-2',
    roundType: 'scrambled',
    image: '/assets/landmarks/statue-of-liberty.svg',
    shuffleSeed: 88,
    correctAnswer: 'C',
    options: {
      A: 'Christ the Redeemer',
      B: 'Lincoln Memorial',
      C: 'Statue of Liberty',
      D: 'Washington Monument',
    },
  },
  {
    id: 'ss-3',
    roundType: 'scrambled',
    image: '/assets/landmarks/sydney-opera-house.svg',
    shuffleSeed: 151,
    correctAnswer: 'B',
    options: {
      A: 'Burj Al Arab',
      B: 'Sydney Opera House',
      C: 'Guggenheim Bilbao',
      D: 'Marina Bay Sands',
    },
  },
  {
    id: 'ss-4',
    roundType: 'scrambled',
    image: '/assets/landmarks/great-wall.svg',
    shuffleSeed: 207,
    correctAnswer: 'D',
    options: {
      A: 'Hadrian\'s Wall',
      B: 'Machu Picchu',
      C: 'Angkor Wat',
      D: 'Great Wall of China',
    },
  },
];
