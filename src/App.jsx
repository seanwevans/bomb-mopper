import React, { useState, useEffect, useCallback } from 'react';
import Board from './components/Board.jsx';
import Controls from './components/Controls.jsx';

const cloneBoard = (b) => b.map((row) => row.map((cell) => ({ ...cell })));

const App = () => {
  // Game constants
  const BEGINNER = { rows: 9, cols: 9, mines: 10 };
  const INTERMEDIATE = { rows: 16, cols: 16, mines: 40 };
  const EXPERT = { rows: 16, cols: 30, mines: 99 };
  
  // Game state
  const [difficulty, setDifficulty] = useState(BEGINNER);
  const [board, setBoard] = useState([]);
  const [gameStatus, setGameStatus] = useState('ready'); // 'ready', 'playing', 'won', 'lost'
  const [flagCount, setFlagCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [time, setTime] = useState(0);
  const [faceState, setFaceState] = useState('smile'); // 'smile', 'surprise', 'dead', 'cool'
  const [mouseDown, setMouseDown] = useState(false);
  const [cheatMode, setCheatMode] = useState(false);

  const difficulties = [
    { ...BEGINNER, label: 'Beginner', name: 'BEGINNER' },
    { ...INTERMEDIATE, label: 'Intermediate', name: 'INTERMEDIATE' },
    { ...EXPERT, label: 'Expert', name: 'EXPERT' },
  ];

  // Initialize the board
  const initializeBoard = useCallback(() => {
    const { rows, cols } = difficulty;
    const newBoard = Array(rows).fill().map(() => 
      Array(cols).fill().map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    );
    setBoard(newBoard);
    setGameStatus('ready');
    setFlagCount(0);
    setStartTime(null);
    setTime(0);
    setFaceState('smile');
  }, [difficulty]);

  // Place mines on the board (after first click)
  const placeMines = (firstClickRow, firstClickCol) => {
    const { rows, cols, mines } = difficulty;
    const newBoard = cloneBoard(board);
    
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      // Don't place mine on first click or where a mine already exists
      if ((row === firstClickRow && col === firstClickCol) || newBoard[row][col].isMine) {
        continue;
      }
      
      newBoard[row][col].isMine = true;
      minesPlaced++;
    }
    
    // Calculate neighbor mines
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!newBoard[row][col].isMine) {
          let count = 0;
          for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
              if (newBoard[r][c].isMine) count++;
            }
          }
          newBoard[row][col].neighborMines = count;
        }
      }
    }
    
    setBoard(newBoard);
    return newBoard;
  };
  
  // Handle cell click
  const handleCellClick = (row, col) => {
    if (gameStatus === 'lost' || gameStatus === 'won' || board[row][col].isFlagged) {
      return;
    }
    
    // Start timer on first click
    if (gameStatus === 'ready') {
      setStartTime(Date.now());
      setGameStatus('playing');
      const newBoard = placeMines(row, col);
      revealCell(newBoard, row, col);
    } else {
      const newBoard = cloneBoard(board);
      
      // Game over if mine is clicked
      if (newBoard[row][col].isMine) {
        newBoard[row][col].isExploded = true;
        setBoard(newBoard);
        revealAllMines();
        setGameStatus('lost');
        setFaceState('dead');
        return;
      }
      
      revealCell(newBoard, row, col);
    }
  };
  
  // Handle right-click (flag)
  const handleRightClick = (e, row, col) => {
    e.preventDefault();
    
    if (gameStatus === 'lost' || gameStatus === 'won' || board[row][col].isRevealed) {
      return;
    }
    
    const newBoard = cloneBoard(board);
    
    // Cycle: unmarked -> flag -> question mark -> unmarked
    if (!newBoard[row][col].isFlagged && !newBoard[row][col].isQuestionMark) {
      // Set flag
      newBoard[row][col].isFlagged = true;
      setFlagCount(prevCount => prevCount + 1);
    } else if (newBoard[row][col].isFlagged) {
      // Change flag to question mark
      newBoard[row][col].isFlagged = false;
      newBoard[row][col].isQuestionMark = true;
      setFlagCount(prevCount => prevCount - 1);
    } else {
      // Remove question mark
      newBoard[row][col].isQuestionMark = false;
    }
    
    setBoard(newBoard);
    
    // Start game if it's the first action
    if (gameStatus === 'ready') {
      setStartTime(Date.now());
      setGameStatus('playing');
      placeMines(-1, -1); // -1, -1 means don't protect any cell
    }
  };
  
  // Handle chord (left+right click)
  const handleChordClick = (row, col) => {
    if (gameStatus !== 'playing' || !board[row][col].isRevealed) {
      return;
    }
    
    const { rows, cols } = difficulty;
    const cell = board[row][col];
    
    // Count flags around this cell
    let flagCount = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
        if (board[r][c].isFlagged) {
          flagCount++;
        }
      }
    }
    
    // If flagCount matches the number of mines, reveal all non-flagged neighbors
    if (flagCount === cell.neighborMines) {
      const newBoard = cloneBoard(board);
      let hitMine = false;
      
      for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
          // Skip if it's the center cell, already revealed, or flagged
          if ((r === row && c === col) || newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) {
            continue;
          }
          
          // Reveal the cell
          newBoard[r][c].isRevealed = true;
          
          // Check if mine was hit
          if (newBoard[r][c].isMine) {
            hitMine = true;
            newBoard[r][c].isExploded = true;
          } else if (newBoard[r][c].neighborMines === 0) {
            // For empty cells, recursively reveal neighbors
            revealCell(newBoard, r, c);
          }
        }
      }
      
      setBoard(newBoard);
      
      // Handle mine hit
      if (hitMine) {
        revealAllMines();
        setGameStatus('lost');
        setFaceState('dead');
      } else {
        // Check for win
        checkWinCondition(newBoard);
      }
    }
  };
  
  // Recursively reveal cells
  const revealCell = (newBoard, row, col) => {
    const { rows, cols } = difficulty;
    
    if (
      row < 0 || row >= rows || 
      col < 0 || col >= cols || 
      newBoard[row][col].isRevealed || 
      newBoard[row][col].isFlagged
    ) {
      return;
    }
    
    newBoard[row][col].isRevealed = true;
    
    // If it's an empty cell, reveal neighbors
    if (newBoard[row][col].neighborMines === 0) {
      for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
          revealCell(newBoard, r, c);
        }
      }
    }
    
    setBoard(newBoard);
    
    // Check for win
    checkWinCondition(newBoard);
  };
  
  // Reveal all mines when game is lost
  const revealAllMines = () => {
    const newBoard = cloneBoard(board);
    
    // Reveal all cells, showing mines and incorrect flags
    newBoard.forEach((row) => {
      row.forEach((cell) => {
        // Reveal every cell
        cell.isRevealed = true;
        
        // Mark incorrectly flagged cells
        if (cell.isFlagged && !cell.isMine) {
          cell.isIncorrectFlag = true;
        }
      });
    });
    
    setBoard(newBoard);
  };
  
  // Check if all non-mine cells are revealed
  const checkWinCondition = (currentBoard) => {
    const { rows, cols, mines } = difficulty;
    let revealedCount = 0;
    
    currentBoard.forEach(row => {
      row.forEach(cell => {
        if (cell.isRevealed) {
          revealedCount++;
        }
      });
    });
    
    if (revealedCount === rows * cols - mines) {
      setGameStatus('won');
      setFaceState('cool');
      
      // Flag all remaining mines
      const winBoard = cloneBoard(currentBoard);
      winBoard.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell.isMine && !cell.isFlagged) {
            winBoard[rowIndex][colIndex].isFlagged = true;
          }
        });
      });
      
      setBoard(winBoard);
      setFlagCount(mines);
    }
  };

  // Reset game
  const resetGame = () => {
    initializeBoard();
  };
  
  // Change difficulty
  const changeDifficulty = (diff) => {
    setDifficulty(diff);
  };
  
  // Timer effect
  useEffect(() => {
    let interval;
    
    if (startTime && gameStatus === 'playing') {
      interval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setTime(Math.min(elapsedSeconds, 999)); // Max 999 seconds
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [startTime, gameStatus]);
  
  // Initialize board on mount or difficulty change
  useEffect(() => {
    initializeBoard();
  }, [difficulty, initializeBoard]);

  // Handle mouse events
  const handleMouseDown = () => {
    if (gameStatus === 'playing' || gameStatus === 'ready') {
      setFaceState('surprise');
      setMouseDown(true);
    }
  };
  
  const handleMouseUp = () => {
    if (gameStatus === 'playing' || gameStatus === 'ready') {
      setFaceState('smile');
      setMouseDown(false);
    }
  };

  return (
    <div
      className="minesweeper"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setMouseDown(false)}
    >
      <Controls
        flagCount={flagCount}
        time={time}
        resetGame={resetGame}
        mouseDown={mouseDown}
        faceState={faceState}
        cheatMode={cheatMode}
        setCheatMode={setCheatMode}
        difficulty={difficulty}
        changeDifficulty={changeDifficulty}
        difficulties={difficulties}
      />
      <Board
        board={board}
        onCellClick={handleCellClick}
        onRightClick={handleRightClick}
        onChordClick={handleChordClick}
        cheatMode={cheatMode}
      />
    </div>
  );
};

export default App;