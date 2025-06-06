import React from 'react';

const numberColors = [
  'number-1',
  'number-2',
  'number-3',
  'number-4',
  'number-5',
  'number-6',
  'number-7',
  'number-8',
];

const Cell = ({ cell, onClick, onRightClick, onChordClick, cheatMode }) => {
  const handleMouseDown = (e) => {
    if (e.buttons === 3) onChordClick();
  };
  const cellClass = `cell-base ${
    cell.isRevealed ? 'cell-revealed' : 'cell-unrevealed'
  }`;

  let content = null;

  if (cheatMode && !cell.isRevealed && cell.isMine) {
    content = <div className="mine cheat">💣</div>;
  } else if (!cell.isRevealed) {
    if (cell.isFlagged) content = <div className="flag">🚩</div>;
    else if (cell.isQuestionMark) content = <div className="question-mark">❓</div>;
    else if (cell.isIncorrectFlag) content = <div className="wrong-flag">❌</div>;
  } else if (cell.isMine) {
    content = (
      <div className={`mine${cell.isExploded ? ' exploded' : ''}`}>{
        cell.isExploded ? '💥' : '💣'
      }</div>
    );
  } else if (cell.neighborMines > 0) {
    const colorClass = numberColors[cell.neighborMines - 1] || '';
    content = <div className={`number ${colorClass}`}>{cell.neighborMines}</div>;
  }

  return (
    <div
      data-testid="cell"
      className={cellClass}
      onClick={onClick}
      onContextMenu={onRightClick}
      onMouseDown={handleMouseDown}
    >
      {content}
    </div>
  );
};

export default Cell;
