const scrambledSatellite = require('./scrambledSatellite');
const zoomEnhance = require('./zoomEnhance');
const mapJigsaw = require('./mapJigsaw');
const whatsWrong = require('./whatsWrong');

const ROUNDS = [
  {
    number: 1,
    name: 'Scrambled Satellite',
    type: 'scrambled',
    description:
      'A famous landmark has been scrambled into a grid. Figure out what it is!',
    questions: scrambledSatellite,
  },
  {
    number: 2,
    name: 'Zoom & Enhance',
    type: 'zoom',
    description:
      'We\'re zoomed way in on a famous place. It slowly zooms out. Name it!',
    questions: zoomEnhance,
  },
  {
    number: 3,
    name: 'Map Jigsaw',
    type: 'jigsaw',
    description:
      'A country\'s outline has been cut up and scattered. What country is it?',
    questions: mapJigsaw,
  },
  {
    number: 4,
    name: "What's Wrong?",
    type: 'whatsWrong',
    description:
      'Something is off about this famous landmark. Spot the edit!',
    questions: whatsWrong,
  },
];

// Build the public-facing visualData for a question. Never includes correctAnswer.
function publicVisualData(q) {
  switch (q.roundType) {
    case 'scrambled':
      return { image: q.image, shuffleSeed: q.shuffleSeed };
    case 'zoom':
      return {
        image: q.image,
        zoomOrigin: q.zoomOrigin,
        initialZoom: q.initialZoom,
      };
    case 'jigsaw':
      return {
        pieces: q.pieces,
        viewBox: q.viewBox,
        shuffleSeed: q.shuffleSeed,
        country: q.country,
      };
    case 'whatsWrong':
      return { image: q.image, hintZone: q.hintZone };
    default:
      return {};
  }
}

module.exports = { ROUNDS, publicVisualData };
