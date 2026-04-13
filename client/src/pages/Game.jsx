import React, { useEffect, useMemo, useState } from 'react';
import socket from '../socket.js';
import Timer from '../components/Timer.jsx';
import TeamBadge from '../components/TeamBadge.jsx';
import AnswerButtons from '../components/AnswerButtons.jsx';
import TeamScoreBar from '../components/TeamScoreBar.jsx';
import ScrambledGrid from '../components/ScrambledGrid.jsx';
import ZoomReveal from '../components/ZoomReveal.jsx';
import PixelReveal from '../components/PixelReveal.jsx';
import SpotDifference from '../components/SpotDifference.jsx';
import { sounds } from '../sounds.js';

export default function Game({ ctx, phase }) {
  const {
    roomCode,
    playerId,
    myTeam,
    teams,
    question,
    timer,
    reveal,
    teamScores,
  } = ctx;

  const [selected, setSelected] = useState(null);
  const [lastTick, setLastTick] = useState(null);
  const [popup, setPopup] = useState(null);

  // Reset selection on new question.
  useEffect(() => {
    setSelected(null);
    setPopup(null);
  }, [question?.questionId]);

  // Tick sounds in last 5s.
  useEffect(() => {
    if (phase !== 'game') return;
    if (timer > 0 && timer <= 5 && timer !== lastTick) {
      sounds.tick();
      setLastTick(timer);
    }
  }, [timer, phase]);

  // Reveal sound + popup when reveal arrives.
  useEffect(() => {
    if (phase !== 'reveal' || !reveal || !question) return;
    const result = reveal.playerResults[playerId];
    if (result) {
      if (result.correct) {
        sounds.correct();
        setPopup({ text: `Correct! +${result.pointsEarned}`, cls: 'pop-good' });
      } else {
        sounds.wrong();
        const correctText = question.options[reveal.correctAnswer];
        setPopup({ text: `Wrong! Answer: ${reveal.correctAnswer}) ${correctText}`, cls: 'pop-bad' });
      }
    }
  }, [phase, reveal]);

  function handleSelect(letter) {
    if (phase !== 'game' || selected || !question) return;
    setSelected(letter);
    socket.emit('submit-answer', {
      roomCode,
      questionId: question.questionId,
      answer: letter,
    });
  }

  const hintLevel = useMemo(() => {
    if (!question) return 0;
    const elapsed = question.duration - timer;
    if (phase === 'reveal') return 'reveal';
    if (elapsed >= 20) return 2;
    if (elapsed >= 10) return 1;
    return 0;
  }, [timer, question, phase]);

  if (!question) return null;

  return (
    <div className="screen game">
      <div
        className="top-bar"
        style={{
          borderTop: myTeam ? `4px solid ${myTeam.color}` : 'none',
        }}
      >
        <TeamBadge team={myTeam} />
        <div className="top-center">
          <div className="round-indicator">
            Round {question.roundNumber} — Q{question.questionNumber}
            {question.totalQuestions ? `/${question.totalQuestions}` : ''}
          </div>
          <div className="round-name">{question.roundName}</div>
        </div>
        <Timer remaining={timer} total={question.duration} />
      </div>

      <div className="puzzle-area">
        <div className="puzzle-stage">
          {question.roundType === 'scrambled' && (
            <ScrambledGrid
              image={question.visualData.image}
              seed={question.visualData.shuffleSeed}
              hintLevel={hintLevel}
            />
          )}
          {question.roundType === 'zoom' && (
            <ZoomReveal
              image={question.visualData.image}
              origin={question.visualData.zoomOrigin}
              initialZoom={question.visualData.initialZoom}
              duration={question.duration}
              reveal={phase === 'reveal'}
            />
          )}
          {question.roundType === 'whoAmI' && (
            <PixelReveal
              image={question.visualData.image}
              startResolution={question.visualData.startResolution}
              endResolution={question.visualData.endResolution}
              duration={question.duration}
              reveal={phase === 'reveal'}
            />
          )}
          {question.roundType === 'whatsWrong' && (
            <SpotDifference
              image={question.visualData.image}
              hintZone={question.visualData.hintZone}
              timer={timer}
              total={question.duration}
            />
          )}
        </div>
        {popup && <div className={`score-popup ${popup.cls}`}>{popup.text}</div>}
      </div>

      <div className="answer-area">
        <AnswerButtons
          options={question.options}
          selected={selected}
          correctAnswer={phase === 'reveal' ? reveal?.correctAnswer : null}
          disabled={phase !== 'game'}
          teamColor={myTeam?.color}
          onSelect={handleSelect}
        />
      </div>

      <TeamScoreBar teamScores={teamScores} teams={teams} />
    </div>
  );
}
