import React from 'react';

const Controls = ({
  flagCount,
  time,
  resetGame,
  mouseDown,
  faceState,
  cheatMode,
  setCheatMode,
  difficulty,
  changeDifficulty,
  difficulties,
}) => {
  const faceBorders = mouseDown ? 'face face-down' : 'face face-up';
  const faceEmoji = {
    smile: '🙂',
    surprise: '😮',
    dead: '😵',
    cool: '😎',
  }[faceState];
  return (
    <>
      <div className="controls">
        <div className="counter">
          {String(difficulty.mines - flagCount).padStart(3, '0')}
        </div>
        <button className={faceBorders} onClick={resetGame}>
          {faceEmoji}
        </button>
        <div className="counter">
          {String(time).padStart(3, '0')}
        </div>
      </div>
      <div className="difficulty flex mb-1.5 gap-1 justify-center">
        {difficulties.map((diff) => (
          <button
            key={diff.name}
            onClick={() => changeDifficulty(diff)}
            className={
              'px-2 ' + (difficulty === diff ? 'font-bold' : 'font-normal')
            }
          >
            {diff.label}
          </button>
        ))}
      </div>
      <div className="cheat-controls flex mb-1.5 justify-center">
        <button
          onClick={() => setCheatMode(!cheatMode)}
          className={cheatMode ? 'bg-red-200' : ''}
        >
          {cheatMode ? 'Cheat Mode ON' : 'Cheat Mode OFF'}
        </button>
      </div>
    </>
  );
};

export default Controls;
