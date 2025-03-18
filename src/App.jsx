import React, { useState, useEffect, useCallback } from 'react';

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
    const newBoard = JSON.parse(JSON.stringify(board));
    
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
      const newBoard = JSON.parse(JSON.stringify(board));
      
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
    
    const newBoard = JSON.parse(JSON.stringify(board));
    
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
      const newBoard = JSON.parse(JSON.stringify(board));
      let hitMine = false;
      let explodedRow = -1;
      let explodedCol = -1;
      
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
            explodedRow = r;
            explodedCol = c;
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
    const newBoard = JSON.parse(JSON.stringify(board));
    
    // Reveal all cells, showing mines and incorrect flags
    newBoard.forEach((row, r) => {
      row.forEach((cell, c) => {
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
      const winBoard = JSON.parse(JSON.stringify(currentBoard));
      winBoard.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell.isMine && !cell.isFlagged) {
            winBoard[r][c].isFlagged = true;
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

  // Get cell content
  const getCellContent = (cell) => {
    // Show mines when in cheat mode and cell is not revealed
    if (cheatMode && !cell.isRevealed && cell.isMine) {
      return <div className="mine cheat" style={{ opacity: 0.5 }}>💣</div>;
    }

    if (!cell.isRevealed) {
      if (cell.isFlagged) {
        return <div className="flag">🚩</div>;
      }
      if (cell.isQuestionMark) {
        return <div className="question-mark">❓</div>;
      }
      if (cell.isIncorrectFlag) {
        return <div className="wrong-flag">❌</div>;
      }
      return null;
    }
    
    if (cell.isMine) {
      if (cell.isExploded) {
        return <div className="mine exploded" style={{ color: 'red', backgroundColor: 'red', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>💥</div>;
      }
      return <div className="mine">💣</div>;
    }
    
    if (cell.neighborMines === 0) {
      return null;
    }
    
    // Color mapping for numbers
    const colors = ['blue', 'green', 'red', 'navy', 'brown', 'teal', 'black', 'gray'];
    const color = colors[cell.neighborMines - 1] || 'black';
    
    return (
      <div className="number" style={{ color }}>
        {cell.neighborMines}
      </div>
    );
  };

  return (
    <div 
      className="minesweeper"
      style={{
        fontFamily: "'MS Sans Serif', sans-serif",
        backgroundColor: '#c0c0c0',
        borderTop: '2px solid #ffffff',
        borderLeft: '2px solid #ffffff',
        borderRight: '2px solid #7b7b7b',
        borderBottom: '2px solid #7b7b7b',
        padding: '6px',
        display: 'inline-block',
        maxWidth: '100%',
        overflow: 'auto'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setMouseDown(false)}
    >
      <div className="controls" style={{
        display: 'flex',
        justifyContent: 'space-between',
        backgroundColor: '#c0c0c0',
        padding: '6px',
        marginBottom: '6px',
        borderTop: '2px solid #7b7b7b',
        borderLeft: '2px solid #7b7b7b',
        borderRight: '2px solid #ffffff',
        borderBottom: '2px solid #ffffff',
      }}>
        <div className="counter" style={{
          backgroundColor: 'black',
          color: 'red',
          padding: '3px',
          fontFamily: '"Digital-7", monospace',
          fontWeight: 'bold',
          fontSize: '20px',
          width: '54px',
          height: '32px',
          textAlign: 'center',
          borderTop: '1px solid #7b7b7b',
          borderLeft: '1px solid #7b7b7b',
          borderRight: '1px solid #ffffff',
          borderBottom: '1px solid #ffffff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'black',
            position: 'relative',
            fontFamily: 'monospace',
            letterSpacing: '2px'
          }}>
            {String(difficulty.mines - flagCount).padStart(3, '0').split('').map((digit, idx) => (
              <span key={idx} style={{
                display: 'inline-block',
                width: '13px',
                textShadow: '0 0 2px rgba(255,0,0,0.7)',
                fontWeight: 'bold'
              }}>
                {digit}
              </span>
            ))}
          </div>
        </div>
        
        <button 
          className="face"
          onClick={resetGame}
          style={{
            width: '26px',
            height: '26px',
            backgroundColor: '#c0c0c0',
            borderTop: mouseDown ? '1px solid #7b7b7b' : '1px solid #ffffff',
            borderLeft: mouseDown ? '1px solid #7b7b7b' : '1px solid #ffffff',
            borderRight: mouseDown ? '1px solid #ffffff' : '1px solid #7b7b7b',
            borderBottom: mouseDown ? '1px solid #ffffff' : '1px solid #7b7b7b',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          {faceState === 'smile' && '🙂'}
          {faceState === 'surprise' && '😮'}
          {faceState === 'dead' && '😵'}
          {faceState === 'cool' && '😎'}
        </button>
        
        <div className="counter" style={{
          backgroundColor: 'black',
          color: 'red',
          padding: '3px',
          fontFamily: '"Digital-7", monospace',
          fontWeight: 'bold',
          fontSize: '20px',
          width: '54px',
          height: '32px',
          textAlign: 'center',
          borderTop: '1px solid #7b7b7b',
          borderLeft: '1px solid #7b7b7b',
          borderRight: '1px solid #ffffff',
          borderBottom: '1px solid #ffffff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'black',
            position: 'relative',
            fontFamily: 'monospace',
            letterSpacing: '2px'
          }}>
            {String(time).padStart(3, '0').split('').map((digit, idx) => (
              <span key={idx} style={{
                display: 'inline-block',
                width: '13px',
                textShadow: '0 0 2px rgba(255,0,0,0.7)',
                fontWeight: 'bold'
              }}>
                {digit}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="difficulty" style={{
        display: 'flex',
        marginBottom: '6px',
        gap: '4px',
        justifyContent: 'center'
      }}>
        <button 
          onClick={() => changeDifficulty(BEGINNER)}
          style={{
            backgroundColor: '#c0c0c0',
            border: '1px solid',
            borderTopColor: '#ffffff',
            borderLeftColor: '#ffffff',
            borderRightColor: '#7b7b7b',
            borderBottomColor: '#7b7b7b',
            padding: '2px 8px',
            cursor: 'pointer',
            fontFamily: "'MS Sans Serif', sans-serif",
            fontSize: '12px',
            fontWeight: difficulty === BEGINNER ? 'bold' : 'normal'
          }}
        >
          Beginner
        </button>
        <button 
          onClick={() => changeDifficulty(INTERMEDIATE)}
          style={{
            backgroundColor: '#c0c0c0',
            border: '1px solid',
            borderTopColor: '#ffffff',
            borderLeftColor: '#ffffff',
            borderRightColor: '#7b7b7b',
            borderBottomColor: '#7b7b7b',
            padding: '2px 8px',
            cursor: 'pointer',
            fontFamily: "'MS Sans Serif', sans-serif",
            fontSize: '12px',
            fontWeight: difficulty === INTERMEDIATE ? 'bold' : 'normal'
          }}
        >
          Intermediate
        </button>
        <button 
          onClick={() => changeDifficulty(EXPERT)}
          style={{
            backgroundColor: '#c0c0c0',
            border: '1px solid',
            borderTopColor: '#ffffff',
            borderLeftColor: '#ffffff',
            borderRightColor: '#7b7b7b',
            borderBottomColor: '#7b7b7b',
            padding: '2px 8px',
            cursor: 'pointer',
            fontFamily: "'MS Sans Serif', sans-serif",
            fontSize: '12px',
            fontWeight: difficulty === EXPERT ? 'bold' : 'normal'
          }}
        >
          Expert
        </button>
      </div>
      
      <div className="cheat-controls" style={{
        display: 'flex',
        marginBottom: '6px',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setCheatMode(!cheatMode)}
          style={{
            backgroundColor: cheatMode ? '#ffaaaa' : '#c0c0c0',
            border: '1px solid',
            borderTopColor: '#ffffff',
            borderLeftColor: '#ffffff',
            borderRightColor: '#7b7b7b',
            borderBottomColor: '#7b7b7b',
            padding: '2px 8px',
            cursor: 'pointer',
            fontFamily: "'MS Sans Serif', sans-serif",
            fontSize: '12px',
            fontWeight: 'normal'
          }}
        >
          {cheatMode ? "Cheat Mode ON" : "Cheat Mode OFF"}
        </button>
      </div>
      
      <div className="board" style={{
        borderTop: '3px solid #7b7b7b',
        borderLeft: '3px solid #7b7b7b',
        borderRight: '3px solid #ffffff',
        borderBottom: '3px solid #ffffff',
        display: 'inline-block',
      }}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row" style={{ display: 'flex' }}>
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`cell ${cell.isRevealed ? 'revealed' : ''}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
                onMouseDown={(e) => {
                  // Detect both mouse buttons pressed (chord)
                  if (e.buttons === 3) { // Left (1) + Right (2) = 3
                    handleChordClick(rowIndex, colIndex);
                  }
                }}
                style={{
                  width: '25px',
                  height: '25px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  lineHeight: '25px',
                  userSelect: 'none',
                  cursor: 'pointer',
                  backgroundColor: cell.isRevealed ? '#c0c0c0' : '#c0c0c0',
                  border: cell.isRevealed 
                    ? '1px solid #7b7b7b' 
                    : '1px solid',
                  borderTopColor: cell.isRevealed ? '#7b7b7b' : '#ffffff',
                  borderLeftColor: cell.isRevealed ? '#7b7b7b' : '#ffffff',
                  borderRightColor: cell.isRevealed ? '#c0c0c0' : '#7b7b7b',
                  borderBottomColor: cell.isRevealed ? '#c0c0c0' : '#7b7b7b',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                {getCellContent(cell)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;