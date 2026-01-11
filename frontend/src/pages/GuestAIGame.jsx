import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import ChessBoard from '../components/ChessBoard';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, RotateCcw, Bot, Zap } from 'lucide-react';

// Initial board setup
function createInitialBoard() {
  const board = Array(10).fill(null).map(() => Array(9).fill(null));
  
  // Black pieces (top)
  board[0][0] = { type: 'chariot', color: 'black' };
  board[0][1] = { type: 'horse', color: 'black' };
  board[0][2] = { type: 'elephant', color: 'black' };
  board[0][3] = { type: 'advisor', color: 'black' };
  board[0][4] = { type: 'general', color: 'black' };
  board[0][5] = { type: 'advisor', color: 'black' };
  board[0][6] = { type: 'elephant', color: 'black' };
  board[0][7] = { type: 'horse', color: 'black' };
  board[0][8] = { type: 'chariot', color: 'black' };
  board[2][1] = { type: 'cannon', color: 'black' };
  board[2][7] = { type: 'cannon', color: 'black' };
  board[3][0] = { type: 'soldier', color: 'black' };
  board[3][2] = { type: 'soldier', color: 'black' };
  board[3][4] = { type: 'soldier', color: 'black' };
  board[3][6] = { type: 'soldier', color: 'black' };
  board[3][8] = { type: 'soldier', color: 'black' };
  
  // Red pieces (bottom)
  board[9][0] = { type: 'chariot', color: 'red' };
  board[9][1] = { type: 'horse', color: 'red' };
  board[9][2] = { type: 'elephant', color: 'red' };
  board[9][3] = { type: 'advisor', color: 'red' };
  board[9][4] = { type: 'general', color: 'red' };
  board[9][5] = { type: 'advisor', color: 'red' };
  board[9][6] = { type: 'elephant', color: 'red' };
  board[9][7] = { type: 'horse', color: 'red' };
  board[9][8] = { type: 'chariot', color: 'red' };
  board[7][1] = { type: 'cannon', color: 'red' };
  board[7][7] = { type: 'cannon', color: 'red' };
  board[6][0] = { type: 'soldier', color: 'red' };
  board[6][2] = { type: 'soldier', color: 'red' };
  board[6][4] = { type: 'soldier', color: 'red' };
  board[6][6] = { type: 'soldier', color: 'red' };
  board[6][8] = { type: 'soldier', color: 'red' };
  
  return board;
}

// Simple move validation
function isValidMove(board, from, to, color) {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  
  if (toRow < 0 || toRow > 9 || toCol < 0 || toCol > 8) return false;
  
  const piece = board[fromRow][fromCol];
  if (!piece || piece.color !== color) return false;
  
  const target = board[toRow][toCol];
  if (target && target.color === color) return false;
  
  // Basic movement rules (simplified)
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  
  switch (piece.type) {
    case 'general':
      if (rowDiff + colDiff !== 1) return false;
      if (color === 'red' && (toRow < 7 || toCol < 3 || toCol > 5)) return false;
      if (color === 'black' && (toRow > 2 || toCol < 3 || toCol > 5)) return false;
      return true;
      
    case 'advisor':
      if (rowDiff !== 1 || colDiff !== 1) return false;
      if (color === 'red' && (toRow < 7 || toCol < 3 || toCol > 5)) return false;
      if (color === 'black' && (toRow > 2 || toCol < 3 || toCol > 5)) return false;
      return true;
      
    case 'elephant':
      if (rowDiff !== 2 || colDiff !== 2) return false;
      if (color === 'red' && toRow < 5) return false;
      if (color === 'black' && toRow > 4) return false;
      const midRow = (fromRow + toRow) / 2;
      const midCol = (fromCol + toCol) / 2;
      if (board[midRow][midCol]) return false;
      return true;
      
    case 'horse':
      if (!((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2))) return false;
      if (rowDiff === 2) {
        const blockRow = fromRow + (toRow > fromRow ? 1 : -1);
        if (board[blockRow][fromCol]) return false;
      } else {
        const blockCol = fromCol + (toCol > fromCol ? 1 : -1);
        if (board[fromRow][blockCol]) return false;
      }
      return true;
      
    case 'chariot':
      if (fromRow !== toRow && fromCol !== toCol) return false;
      if (fromRow === toRow) {
        const start = Math.min(fromCol, toCol) + 1;
        const end = Math.max(fromCol, toCol);
        for (let c = start; c < end; c++) {
          if (board[fromRow][c]) return false;
        }
      } else {
        const start = Math.min(fromRow, toRow) + 1;
        const end = Math.max(fromRow, toRow);
        for (let r = start; r < end; r++) {
          if (board[r][fromCol]) return false;
        }
      }
      return true;
      
    case 'cannon':
      if (fromRow !== toRow && fromCol !== toCol) return false;
      let count = 0;
      if (fromRow === toRow) {
        const start = Math.min(fromCol, toCol) + 1;
        const end = Math.max(fromCol, toCol);
        for (let c = start; c < end; c++) {
          if (board[fromRow][c]) count++;
        }
      } else {
        const start = Math.min(fromRow, toRow) + 1;
        const end = Math.max(fromRow, toRow);
        for (let r = start; r < end; r++) {
          if (board[r][fromCol]) count++;
        }
      }
      if (target) return count === 1;
      return count === 0;
      
    case 'soldier':
      if (color === 'red') {
        if (fromRow > 4) {
          return toRow === fromRow - 1 && toCol === fromCol;
        } else {
          return (toRow === fromRow - 1 && toCol === fromCol) ||
                 (toRow === fromRow && Math.abs(toCol - fromCol) === 1);
        }
      } else {
        if (fromRow < 5) {
          return toRow === fromRow + 1 && toCol === fromCol;
        } else {
          return (toRow === fromRow + 1 && toCol === fromCol) ||
                 (toRow === fromRow && Math.abs(toCol - fromCol) === 1);
        }
      }
      
    default:
      return false;
  }
}

// Get all valid moves for AI
function getAllMoves(board, color) {
  const moves = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        for (let tr = 0; tr < 10; tr++) {
          for (let tc = 0; tc < 9; tc++) {
            if (isValidMove(board, [r, c], [tr, tc], color)) {
              moves.push({ from: [r, c], to: [tr, tc] });
            }
          }
        }
      }
    }
  }
  return moves;
}

// Simple AI move
function makeAIMove(board, difficulty) {
  const moves = getAllMoves(board, 'black');
  if (moves.length === 0) return null;
  
  // Capture priority based on difficulty
  const captureMoves = moves.filter(m => board[m.to[0]][m.to[1]]);
  
  if (difficulty === 'hard' && captureMoves.length > 0) {
    // Prioritize capturing valuable pieces
    const pieceValues = { general: 1000, chariot: 90, cannon: 45, horse: 40, elephant: 20, advisor: 20, soldier: 10 };
    captureMoves.sort((a, b) => {
      const valA = pieceValues[board[a.to[0]][a.to[1]]?.type] || 0;
      const valB = pieceValues[board[b.to[0]][b.to[1]]?.type] || 0;
      return valB - valA;
    });
    return captureMoves[0];
  }
  
  if (difficulty === 'medium' && captureMoves.length > 0 && Math.random() > 0.3) {
    return captureMoves[Math.floor(Math.random() * captureMoves.length)];
  }
  
  // Random move
  return moves[Math.floor(Math.random() * moves.length)];
}

export default function GuestAIGame() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [board, setBoard] = useState(createInitialBoard());
  const [currentTurn, setCurrentTurn] = useState('red');
  const [gameStatus, setGameStatus] = useState('playing');
  const [moves, setMoves] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameEndDialog, setGameEndDialog] = useState(null);
  
  const playerColor = 'red';

  const handleMove = async (fromPos, toPos) => {
    if (gameStatus !== 'playing' || currentTurn !== playerColor) return;
    
    if (!isValidMove(board, fromPos, toPos, playerColor)) {
      toast.error('Nước đi không hợp lệ');
      return;
    }
    
    const newBoard = board.map(row => [...row]);
    const captured = newBoard[toPos[0]][toPos[1]];
    newBoard[toPos[0]][toPos[1]] = newBoard[fromPos[0]][fromPos[1]];
    newBoard[fromPos[0]][fromPos[1]] = null;
    
    setBoard(newBoard);
    setMoves(prev => [...prev, { from: fromPos, to: toPos, piece: newBoard[toPos[0]][toPos[1]], captured }]);
    
    // Check if captured general
    if (captured?.type === 'general') {
      setGameStatus('red_won');
      setGameEndDialog({ title: t('victory'), message: t('congratsWin') });
      return;
    }
    
    setCurrentTurn('black');
    
    // AI move
    setThinking(true);
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
    
    const aiMove = makeAIMove(newBoard, difficulty);
    if (aiMove) {
      const aiBoard = newBoard.map(row => [...row]);
      const aiCaptured = aiBoard[aiMove.to[0]][aiMove.to[1]];
      aiBoard[aiMove.to[0]][aiMove.to[1]] = aiBoard[aiMove.from[0]][aiMove.from[1]];
      aiBoard[aiMove.from[0]][aiMove.from[1]] = null;
      
      setBoard(aiBoard);
      setMoves(prev => [...prev, { from: aiMove.from, to: aiMove.to, piece: aiBoard[aiMove.to[0]][aiMove.to[1]], captured: aiCaptured }]);
      
      if (aiCaptured?.type === 'general') {
        setGameStatus('black_won');
        setGameEndDialog({ title: t('defeat'), message: t('youLost') });
        setThinking(false);
        return;
      }
    }
    
    setCurrentTurn('red');
    setThinking(false);
  };

  const newGame = () => {
    setBoard(createInitialBoard());
    setCurrentTurn('red');
    setGameStatus('playing');
    setMoves([]);
    setGameEndDialog(null);
  };

  return (
    <div className="min-h-screen bg-[#1a1614]">
      {/* Background */}
      <div 
        className="fixed inset-0"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(26, 22, 20, 0.9) 0%, rgba(26, 22, 20, 0.98) 100%), url('https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      <Navbar />

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-[#a89f91] hover:text-[#d4af37] text-base"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('back')}
          </Button>

          {/* AI Info + Difficulty */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <Card className="flex-1 bg-[#241e1b]/90 border-[#4a3b32] p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#2d2520] border-2 border-[#4a3b32] flex items-center justify-center">
                <Bot className="w-6 h-6 text-[#e6dcc3]" />
              </div>
              <div>
                <h4 className="font-medium text-[#e6dcc3] text-lg">{t('aiChess')}</h4>
                <p className="text-base text-[#a89f91]">
                  {thinking ? t('aiThinking') : currentTurn === 'black' ? t('aiTurn') : t('waitYou')}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#2d2520] flex items-center justify-center ml-auto">
                <span className="font-['Ma_Shan_Zheng'] text-lg text-[#e6dcc3]">將</span>
              </div>
            </Card>

            {/* Difficulty Selector */}
            <Card className="bg-[#241e1b]/90 border-[#4a3b32] p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#d4af37]" />
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="w-32 bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#241e1b] border-[#4a3b32]">
                    <SelectItem value="easy" className="text-[#e6dcc3]">{t('easy')}</SelectItem>
                    <SelectItem value="medium" className="text-[#e6dcc3]">{t('medium')}</SelectItem>
                    <SelectItem value="hard" className="text-[#e6dcc3]">{t('hard')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </div>

          {thinking && (
            <div className="flex items-center justify-center gap-2 text-[#d4af37] mb-4">
              <div className="w-5 h-5 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
              <span className="text-base">{t('aiThinking')}</span>
            </div>
          )}

          {/* Chess Board */}
          <ChessBoard
            board={board}
            onMove={handleMove}
            currentTurn={currentTurn}
            playerColor={playerColor}
            disabled={gameStatus !== 'playing' || currentTurn !== playerColor || thinking}
            lastMove={moves[moves.length - 1]}
          />

          {/* Player Info */}
          <Card className="mt-4 bg-[#241e1b]/90 border-[#4a3b32] p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#c92a2a]/20 border-2 border-[#c92a2a] flex items-center justify-center">
              <span className="font-['Ma_Shan_Zheng'] text-lg text-[#c92a2a]">帥</span>
            </div>
            <div>
              <h4 className="font-medium text-[#e6dcc3] text-lg">Khách</h4>
              <p className="text-base text-[#a89f91]">{t('playAsGuest')}</p>
            </div>
          </Card>

          {/* New Game Button */}
          <div className="flex justify-center mt-6">
            <Button onClick={newGame} className="btn-gold" data-testid="new-game-btn">
              <RotateCcw className="w-5 h-5 mr-2" />
              {t('newGame')}
            </Button>
          </div>

          {/* Move History */}
          {moves.length > 0 && (
            <Card className="mt-6 bg-[#241e1b]/90 border-[#4a3b32] p-4">
              <h3 className="font-serif text-lg text-[#d4af37] mb-3">{t('moveHistory')}</h3>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {moves.map((move, idx) => (
                  <div 
                    key={idx}
                    className={`text-base px-3 py-1.5 rounded ${
                      move.piece?.color === 'red' 
                        ? 'bg-[#c92a2a]/10 text-[#c92a2a]' 
                        : 'bg-[#3a2e2a] text-[#e6dcc3]'
                    }`}
                  >
                    {idx + 1}. [{move.from[0]},{move.from[1]}] → [{move.to[0]},{move.to[1]}]
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Game End Dialog */}
      <Dialog open={!!gameEndDialog} onOpenChange={() => setGameEndDialog(null)}>
        <DialogContent className="bg-[#241e1b] border-[#4a3b32] text-[#e6dcc3]">
          <DialogHeader>
            <DialogTitle className={`font-serif text-2xl ${
              gameEndDialog?.title === t('victory') ? 'text-[#d4af37]' : 'text-[#c92a2a]'
            }`}>
              {gameEndDialog?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-[#a89f91] text-center py-4 text-base">{gameEndDialog?.message}</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => navigate('/')} className="border-[#4a3b32] text-[#a89f91]">
              {t('back')}
            </Button>
            <Button onClick={newGame} className="btn-imperial">
              <RotateCcw className="w-5 h-5 mr-2" />
              {t('newGame')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
