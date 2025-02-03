import React, { useState } from 'react';

const TorusChess = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [validMoves, setValidMoves] = useState([]);
  const [gameStatus, setGameStatus] = useState('active');

  function initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Initialize pawns
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'pawn', color: 'black' };
      board[6][i] = { type: 'pawn', color: 'white' };
    }

    // Initialize other pieces
    const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let i = 0; i < 8; i++) {
      board[0][i] = { type: backRow[i], color: 'black' };
      board[7][i] = { type: backRow[i], color: 'white' };
    }

    return board;
  }

  function torusCoord(coord) {
    return ((coord % 8) + 8) % 8;
  }

  function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    if (!piece || piece.color !== currentPlayer) return false;

    // Convert to torus coordinates
    toRow = torusCoord(toRow);
    toCol = torusCoord(toCol);

    // Check if destination has friendly piece
    if (board[toRow][toCol]?.color === currentPlayer) return false;

    const rowDiff = Math.min(
      Math.abs(toRow - fromRow),
      Math.abs(toRow - fromRow + 8),
      Math.abs(toRow - fromRow - 8)
    );
    
    const colDiff = Math.min(
      Math.abs(toCol - fromCol),
      Math.abs(toCol - fromCol + 8),
      Math.abs(toCol - fromCol - 8)
    );

    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        
        // Normal move
        if (colDiff === 0 && torusCoord(fromRow + direction) === toRow && !board[toRow][toCol]) {
          return true;
        }
        // Initial double move
        if (colDiff === 0 && fromRow === startRow && 
            torusCoord(fromRow + 2 * direction) === toRow && 
            !board[toRow][toCol] && 
            !board[torusCoord(fromRow + direction)][fromCol]) {
          return true;
        }
        // Capture
        if (colDiff === 1 && torusCoord(fromRow + direction) === toRow && board[toRow][toCol]) {
          return true;
        }
        return false;

      case 'knight':
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

      case 'bishop':
        return rowDiff === colDiff;

      case 'rook':
        return rowDiff === 0 || colDiff === 0;

      case 'queen':
        return rowDiff === colDiff || rowDiff === 0 || colDiff === 0;

      case 'king':
        return rowDiff <= 1 && colDiff <= 1;

      default:
        return false;
    }
  }

  function calculateValidMoves(row, col) {
    const validMoves = [];
    // Check all possible moves on the torus
    for (let i = -7; i <= 7; i++) {
      for (let j = -7; j <= 7; j++) {
        if (isValidMove(row, col, row + i, col + j)) {
          validMoves.push([torusCoord(row + i), torusCoord(col + j)]);
        }
      }
    }
    return validMoves;
  }

  function handleSquareClick(row, col) {
    if (gameStatus === 'checkmate') return;

    if (selectedSquare) {
      const [fromRow, fromCol] = selectedSquare;
      
      if (isValidMove(fromRow, fromCol, row, col)) {
        const newBoard = board.map(row => [...row]);
        newBoard[torusCoord(row)][torusCoord(col)] = board[fromRow][fromCol];
        newBoard[fromRow][fromCol] = null;
        
        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
        setGameStatus('active');
      }
      
      setSelectedSquare(null);
      setValidMoves([]);
    } else if (board[row][col]?.color === currentPlayer) {
      setSelectedSquare([row, col]);
      setValidMoves(calculateValidMoves(row, col));
    }
  }

  const pieces = {
    'white': {
      'king': '♔',
      'queen': '♕',
      'rook': '♖',
      'bishop': '♗',
      'knight': '♘',
      'pawn': '♙'
    },
    'black': {
      'king': '♚',
      'queen': '♛',
      'rook': '♜',
      'bishop': '♝',
      'knight': '♞',
      'pawn': '♟'
    }
  };

  function isValidMoveSquare(row, col) {
    return validMoves.some(([r, c]) => r === row && c === col);
  }

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 text-lg font-bold">
        {gameStatus === 'checkmate' 
          ? `Game Over! ${currentPlayer === 'white' ? 'Black' : 'White'} wins!`
          : `Current Player: ${currentPlayer}`
        }
      </div>
      <div className="grid grid-cols-8 gap-0 border border-gray-400">
        {board.map((row, rowIndex) => (
          row.map((square, colIndex) => {
            const isSelected = selectedSquare && 
                             selectedSquare[0] === rowIndex && 
                             selectedSquare[1] === colIndex;
            
            const isValidMoveSquare = validMoves.some(
              ([row, col]) => row === rowIndex && col === colIndex
            );
            
            const isLight = (rowIndex + colIndex) % 2 === 0;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-12 h-12 flex items-center justify-center text-2xl
                  ${isLight ? 'bg-amber-200' : 'bg-amber-800'}
                  ${isSelected ? 'ring-2 ring-blue-500' : ''}
                  ${isValidMoveSquare ? 'ring-2 ring-green-500' : ''}
                  cursor-pointer
                  hover:opacity-80
                  relative
                `}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              >
                {square && pieces[square.color][square.type]}
                {isValidMoveSquare && !square && (
                  <div className="absolute w-3 h-3 rounded-full bg-green-500 opacity-50" />
                )}
                {isValidMoveSquare && square && (
                  <div className="absolute inset-0 ring-2 ring-red-500" />
                )}
              </div>
            );
          })
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Hint: The board wraps around both horizontally and vertically!
      </div>
    </div>
  );
};

export default TorusChess;
