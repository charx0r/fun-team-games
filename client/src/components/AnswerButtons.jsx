import React from 'react';

export default function AnswerButtons({
  options,
  selected,
  correctAnswer,
  disabled,
  teamColor,
  onSelect,
}) {
  const letters = ['A', 'B', 'C', 'D'];
  return (
    <div className="answers">
      {letters.map(L => {
        const isSelected = selected === L;
        const isCorrect = correctAnswer && L === correctAnswer;
        const isWrongSelection = correctAnswer && isSelected && L !== correctAnswer;
        let cls = 'answer-btn';
        if (isSelected) cls += ' selected';
        if (isCorrect) cls += ' correct';
        if (isWrongSelection) cls += ' wrong';
        if (selected && !isSelected && !isCorrect) cls += ' faded';
        const style = {};
        if (isSelected && !correctAnswer && teamColor) {
          style.background = teamColor;
          style.borderColor = teamColor;
        }
        return (
          <button
            key={L}
            className={cls}
            style={style}
            disabled={disabled || !!selected}
            onClick={() => onSelect(L)}
          >
            <span className="answer-letter">{L}</span>
            <span className="answer-text">{options[L]}</span>
            {isSelected && !correctAnswer && <span className="lock">✓ Locked</span>}
          </button>
        );
      })}
    </div>
  );
}
