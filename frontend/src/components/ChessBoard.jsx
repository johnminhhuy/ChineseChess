import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Piece character mapping - traditional Chinese characters
const PIECE_CHARS = {
  general: { red: '帥', black: '將' },
  advisor: { red: '仕', black: '士' },
  elephant: { red: '相', black: '象' },
  horse: { red: '傌', black: '馬' },
  chariot: { red: '俥', black: '車' },
  cannon: { red: '炮', black: '砲' },
  soldier: { red: '兵', black: '卒' }
};

export default function ChessBoard({ 
  board, 
  onMove, 
  currentTurn, 
  playerColor,
  disabled = false,
  lastMove = null,
  viewOnly = false
}) {
  const { t } = useLanguage();
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  useEffect(() => {
    setSelectedPiece(null);
    setValidMoves([]);
  }, [currentTurn]);

  const handleCellClick = (row, col) => {
    
    console.log('CLICK', { disabled, viewOnly, currentTurn, playerColor });

    if (disabled || viewOnly) return;
    
    const piece = board[row][col];
    console.log("Piece", piece);
    if (!selectedPiece) {
      if (piece && piece.color === playerColor && currentTurn === playerColor) {
        setSelectedPiece({ row, col, piece });
        calculateValidMoves(row, col, piece);
      }
      return;
    }

    if (selectedPiece.row === row && selectedPiece.col === col) {
      setSelectedPiece(null);
      setValidMoves([]);
      return;
    }

    if (piece && piece.color === playerColor) {
      setSelectedPiece({ row, col, piece });
      calculateValidMoves(row, col, piece);
      return;
    }

    if (!isValidMove(row, col)) return;

    onMove(
      [selectedPiece.row, selectedPiece.col],
      [row, col]
    );
    setSelectedPiece(null);
    setValidMoves([]);
  };

  const calculateValidMoves = (row, col, piece) => {
    const moves = [];

    const inBounds = (r, c) => r >= 0 && r < 10 && c >= 0 && c < 9;

    const isEmptyOrEnemy = (r, c) => {
      const target = board[r][c];
      return !target || target.color !== piece.color;
    };

    const addMoveIfOk = (r, c) => {
      if (!inBounds(r, c)) return false;
      const target = board[r][c];
      if (!target) {
        moves.push([r, c]);
        return true; // can continue (for sliding pieces)
      }
      if (target.color !== piece.color) {
        moves.push([r, c]); // capture
      }
      return false; // stop when hit any piece
    };

    const addStepMove = (r, c) => {
      if (!inBounds(r, c)) return;
      if (isEmptyOrEnemy(r, c)) moves.push([r, c]);
    };

    const palaceOk = (r, c, color) => {
      // Palace is columns 3..5. Rows: black 0..2, red 7..9
      if (c < 3 || c > 5) return false;
      return color === 'red' ? (r >= 7 && r <= 9) : (r >= 0 && r <= 2);
    };

    // ===== Piece rules =====
    switch (piece.type) {
      case 'general': {
        // 1 step orthogonally, within palace
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr, dc] of dirs) {
          const r = row + dr, c = col + dc;
          if (palaceOk(r, c, piece.color)) addStepMove(r, c);
        }
        // NOTE: "flying general" rule is enforced on backend (or should be).
        break;
      }

      case 'advisor': {
        // 1 step diagonally, within palace
        const dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dr, dc] of dirs) {
          const r = row + dr, c = col + dc;
          if (palaceOk(r, c, piece.color)) addStepMove(r, c);
        }
        break;
      }

      case 'elephant': {
        // 2 diagonally, cannot cross river, blocked at midpoint
        const dirs = [[2,2],[2,-2],[-2,2],[-2,-2]];
        for (const [dr, dc] of dirs) {
          const r = row + dr, c = col + dc;
          const midR = row + dr / 2, midC = col + dc / 2;

          if (!inBounds(r, c)) continue;
          // river: red can't go to r < 5; black can't go to r > 4
          if (piece.color === 'red' && r < 5) continue;
          if (piece.color === 'black' && r > 4) continue;
          if (board[midR][midC]) continue;
          if (isEmptyOrEnemy(r, c)) moves.push([r, c]);
        }
        break;
      }

      case 'horse': {
        // L-shape, blocked by "horse leg"
        const candidates = [
          { dr: 2, dc: 1, br: 1, bc: 0 },
          { dr: 2, dc: -1, br: 1, bc: 0 },
          { dr: -2, dc: 1, br: -1, bc: 0 },
          { dr: -2, dc: -1, br: -1, bc: 0 },
          { dr: 1, dc: 2, br: 0, bc: 1 },
          { dr: -1, dc: 2, br: 0, bc: 1 },
          { dr: 1, dc: -2, br: 0, bc: -1 },
          { dr: -1, dc: -2, br: 0, bc: -1 },
        ];

        for (const { dr, dc, br, bc } of candidates) {
          const blockR = row + br, blockC = col + bc;
          const r = row + dr, c = col + dc;
          if (!inBounds(r, c)) continue;
          if (inBounds(blockR, blockC) && board[blockR][blockC]) continue;
          if (isEmptyOrEnemy(r, c)) moves.push([r, c]);
        }
        break;
      }

      case 'chariot': {
        // Slide orthogonally, cannot jump
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr, dc] of dirs) {
          let r = row + dr, c = col + dc;
          while (inBounds(r, c)) {
            const cont = addMoveIfOk(r, c);
            if (!cont) break;
            r += dr; c += dc;
          }
        }
        break;
      }

      case 'cannon': {
        // Move like chariot. Capture only if exactly 1 piece in between.
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr, dc] of dirs) {
          let r = row + dr, c = col + dc;
          let jumped = false;
          while (inBounds(r, c)) {
            const target = board[r][c];
            if (!jumped) {
              if (!target) {
                moves.push([r, c]); // normal move
              } else {
                jumped = true; // found the screen
              }
            } else {
              if (target) {
                if (target.color !== piece.color) moves.push([r, c]); // capture
                break; // stop after first piece beyond the screen
              }
            }
            r += dr; c += dc;
          }
        }
        break;
      }

      case 'soldier': {
        // Forward 1. After crossing river can move sideways 1.
        const forward = piece.color === 'red' ? -1 : 1;
        const rF = row + forward, cF = col;
        if (inBounds(rF, cF) && isEmptyOrEnemy(rF, cF)) moves.push([rF, cF]);

        const crossed = piece.color === 'red' ? row < 5 : row > 4;
        if (crossed) {
          const left = col - 1, right = col + 1;
          if (inBounds(row, left) && isEmptyOrEnemy(row, left)) moves.push([row, left]);
          if (inBounds(row, right) && isEmptyOrEnemy(row, right)) moves.push([row, right]);
        }
        break;
      }

      default:
        break;
    }

    setValidMoves(moves);
  };

  const isValidMove = (row, col) => {
    return validMoves.some(([r, c]) => r === row && c === col);
  };

  const isLastMove = (row, col) => {
    if (!lastMove) return false;
    return (lastMove.from[0] === row && lastMove.from[1] === col) ||
           (lastMove.to[0] === row && lastMove.to[1] === col);
  };

  const canCapture = (row, col) => {
    if (!isValidMove(row, col)) return false;
    return board[row][col] && board[row][col].color !== playerColor;
  };

  const renderPiece = (piece, row, col) => {
    if (!piece) return null;
    
    const char = PIECE_CHARS[piece.type]?.[piece.color] || '?';
    const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
    
    return (
      <div
        className={`chess-piece ${piece.color} ${isSelected ? 'selected' : ''}`}
        data-testid={`piece-${row}-${col}`}
      >
        {char}
      </div>
    );
  };

  // Calculate board dimensions
  const cellSize = 3.2; // rem
  const boardWidth = 9 * cellSize;
  const boardHeight = 10 * cellSize;

  const isFlipped = playerColor === 'black';

  const toGamePos = (viewRow, viewCol) => (
    isFlipped ? [9 - viewRow, 8 - viewCol] : [viewRow, viewCol]
  );


  return (
    <div className="relative flex flex-col items-center">
      {/* Board Container with 3D effect */}
      <div className="board-3d p-5">
        {/* Grid with SVG lines */}
        <div className="relative" style={{ width: `${boardWidth}rem`, height: `${boardHeight}rem` }}>
          {/* SVG for board lines */}
          <svg 
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            viewBox={`0 0 ${9 * 32} ${10 * 32}`}
            preserveAspectRatio="none"
          >
            {/* Horizontal lines */}
            {Array.from({ length: 10 }, (_, i) => (
              <line
                key={`h-${i}`}
                x1="16" y1={i * 32 + 16}
                x2={8 * 32 + 16} y2={i * 32 + 16}
                stroke="#5c3d1e"
                strokeWidth="2"
              />
            ))}
            
            {/* Vertical lines - top half */}
            {Array.from({ length: 9 }, (_, i) => (
              <line
                key={`vt-${i}`}
                x1={i * 32 + 16} y1="16"
                x2={i * 32 + 16} y2={4 * 32 + 16}
                stroke="#5c3d1e"
                strokeWidth="2"
              />
            ))}
            
            {/* Vertical lines - bottom half */}
            {Array.from({ length: 9 }, (_, i) => (
              <line
                key={`vb-${i}`}
                x1={i * 32 + 16} y1={5 * 32 + 16}
                x2={i * 32 + 16} y2={9 * 32 + 16}
                stroke="#5c3d1e"
                strokeWidth="2"
              />
            ))}
            
            {/* Left and right edge lines through river */}
            <line x1="16" y1={4 * 32 + 16} x2="16" y2={5 * 32 + 16} stroke="#5c3d1e" strokeWidth="2" />
            <line x1={8 * 32 + 16} y1={4 * 32 + 16} x2={8 * 32 + 16} y2={5 * 32 + 16} stroke="#5c3d1e" strokeWidth="2" />
            
            {/* Palace diagonals - Black side (top) */}
            <line x1={3 * 32 + 16} y1="16" x2={5 * 32 + 16} y2={2 * 32 + 16} stroke="#5c3d1e" strokeWidth="1.5" />
            <line x1={5 * 32 + 16} y1="16" x2={3 * 32 + 16} y2={2 * 32 + 16} stroke="#5c3d1e" strokeWidth="1.5" />
            
            {/* Palace diagonals - Red side (bottom) */}
            <line x1={3 * 32 + 16} y1={7 * 32 + 16} x2={5 * 32 + 16} y2={9 * 32 + 16} stroke="#5c3d1e" strokeWidth="1.5" />
            <line x1={5 * 32 + 16} y1={7 * 32 + 16} x2={3 * 32 + 16} y2={9 * 32 + 16} stroke="#5c3d1e" strokeWidth="1.5" />
          </svg>

          {/* River text */}
          <div 
            className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10"
            style={{ top: `${4.5 * cellSize - 0.5}rem`, height: `${cellSize}rem` }}
          >
            <span className="font-['Ma_Shan_Zheng'] text-2xl text-[#5c3d1e]/70 tracking-[2rem] drop-shadow">
              {isFlipped ? '漢界 楚河' : '楚河 漢界'}
            </span>

          </div>

          {/* Board cells */}
          <div className="relative">
            {Array.from({ length: 10 }, (_, viewRow) => (
              <div key={viewRow} className="flex">
                {Array.from({ length: 9 }, (_, viewCol) => {
                  const [rowIdx, colIdx] = toGamePos(viewRow, viewCol);
                  const cell = board[rowIdx][colIdx];

                  return (
                    <div
                      key={`${viewRow}-${viewCol}`}
                      className={`board-cell ${
                        isValidMove(rowIdx, colIdx) && !canCapture(rowIdx, colIdx) ? 'valid-move' : ''
                      } ${
                        canCapture(rowIdx, colIdx) ? 'can-capture' : ''
                      } ${
                        isLastMove(rowIdx, colIdx) ? 'last-move' : ''
                      }`}
                      onClick={() => handleCellClick(rowIdx, colIdx)}
                      data-testid={`cell-${rowIdx}-${colIdx}`}
                    >
                      {renderPiece(cell, rowIdx, colIdx)}
                    </div>
                  );
                })}
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* Turn indicator */}
      {!viewOnly && (
        <div className="mt-4 text-center">
          <span className={`font-serif text-xl ${currentTurn === 'red' ? 'text-[#c92a2a]' : 'text-[#e6dcc3]'}`}>
            {currentTurn === playerColor ? t('yourTurn') : t('waitOpponent')}
          </span>
        </div>
      )}
    </div>
  );
}
