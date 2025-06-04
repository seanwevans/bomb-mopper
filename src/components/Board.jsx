import React from 'react';
import Cell from './Cell';

const Board = ({ board, onCellClick, onRightClick, onChordClick, cheatMode }) => (
  <div className="board">
    {board.map((row, r) => (
      <div key={r} className="flex">
        {row.map((cell, c) => (
          <Cell
            key={c}
            cell={cell}
            cheatMode={cheatMode}
            onClick={() => onCellClick(r, c)}
            onRightClick={(e) => onRightClick(e, r, c)}
            onChordClick={() => onChordClick(r, c)}
          />
        ))}
      </div>
    ))}
  </div>
);

export default Board;
