import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import ChessBoard from '../components/ChessBoard';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import axios from 'axios';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Initial board for replay
function createInitialBoard() {
  const board = Array(10).fill(null).map(() => Array(9).fill(null));
  
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

export default function WatchGame() {
  const { gameId } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [displayBoard, setDisplayBoard] = useState(createInitialBoard());
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  const fetchGame = async () => {
    try {
      const response = await axios.get(`${API}/games/${gameId}`);
      setGame(response.data);
      setDisplayBoard(response.data.board); // Show current state
      setCurrentMoveIndex(response.data.moves?.length || 0);
    } catch (error) {
      console.error('Failed to fetch game:', error);
    } finally {
      setLoading(false);
    }
  };

  // Replay logic
  useEffect(() => {
    if (!isPlaying || !game?.moves) return;
    
    const interval = setInterval(() => {
      setCurrentMoveIndex(prev => {
        if (prev >= game.moves.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, game?.moves]);

  // Update board based on current move index
  useEffect(() => {
    if (!game?.moves) return;
    
    let board = createInitialBoard();
    
    for (let i = 0; i <= currentMoveIndex && i < game.moves.length; i++) {
      const move = game.moves[i];
      if (move.from && move.to) {
        board[move.to[0]][move.to[1]] = board[move.from[0]][move.from[1]];
        board[move.from[0]][move.from[1]] = null;
      }
    }
    
    setDisplayBoard(board.map(row => [...row]));
  }, [currentMoveIndex, game?.moves]);

  const goToStart = () => {
    setCurrentMoveIndex(-1);
    setIsPlaying(false);
  };

  const goToEnd = () => {
    if (game?.moves) {
      setCurrentMoveIndex(game.moves.length - 1);
    }
    setIsPlaying(false);
  };

  const prevMove = () => {
    setCurrentMoveIndex(prev => Math.max(-1, prev - 1));
    setIsPlaying(false);
  };

  const nextMove = () => {
    if (game?.moves) {
      setCurrentMoveIndex(prev => Math.min(game.moves.length - 1, prev + 1));
    }
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#a89f91]">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <p className="text-[#a89f91]">Không tìm thấy ván cờ</p>
      </div>
    );
  }

  const getStatusText = () => {
    if (game.status === 'playing') return 'Đang diễn ra';
    if (game.status === 'red_won') return `${game.red_player_username} thắng`;
    if (game.status === 'black_won') return `${game.black_player_username} thắng`;
    if (game.status === 'draw') return 'Hòa';
    return game.status;
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar />

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-[#a89f91] hover:text-[#d4af37]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('back')}
          </Button>

          {/* Game Info */}
          <Card className="card-glass p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#c92a2a]/20 flex items-center justify-center">
                    <span className="font-['Ma_Shan_Zheng'] text-lg text-[#c92a2a]">帥</span>
                  </div>
                  <span className="text-[#e6dcc3] font-medium">{game.red_player_username}</span>
                </div>
                <span className="text-[#d4af37] font-bold">VS</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#e6dcc3] font-medium">{game.black_player_username}</span>
                  <div className="w-10 h-10 rounded-full bg-[#3a2e2a] flex items-center justify-center">
                    <span className="font-['Ma_Shan_Zheng'] text-lg text-[#e6dcc3]">將</span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded text-sm font-medium ${
                game.status === 'playing' ? 'bg-green-500/20 text-green-500' :
                game.status === 'red_won' ? 'bg-[#c92a2a]/20 text-[#c92a2a]' :
                game.status === 'black_won' ? 'bg-[#3a2e2a] text-[#e6dcc3]' :
                'bg-[#d4af37]/20 text-[#d4af37]'
              }`}>
                {getStatusText()}
              </div>
            </div>
          </Card>

          {/* Chess Board */}
          <div className="flex justify-center mb-6">
            <ChessBoard
              board={displayBoard}
              onMove={() => {}}
              currentTurn={game.current_turn}
              playerColor="red"
              disabled={true}
              viewOnly={true}
              lastMove={currentMoveIndex >= 0 && game.moves?.[currentMoveIndex] ? game.moves[currentMoveIndex] : null}
            />
          </div>

          {/* Replay Controls */}
          {game.moves && game.moves.length > 0 && (
            <Card className="card-glass p-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button variant="ghost" onClick={goToStart} className="text-[#d4af37]">
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button variant="ghost" onClick={prevMove} className="text-[#d4af37]">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="btn-imperial px-6"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" onClick={nextMove} className="text-[#d4af37]">
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <Button variant="ghost" onClick={goToEnd} className="text-[#d4af37]">
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[#a89f91] text-sm w-16">
                  {currentMoveIndex + 1} / {game.moves.length}
                </span>
                <Slider
                  value={[currentMoveIndex + 1]}
                  min={0}
                  max={game.moves.length}
                  step={1}
                  onValueChange={(val) => {
                    setCurrentMoveIndex(val[0] - 1);
                    setIsPlaying(false);
                  }}
                  className="flex-1"
                />
              </div>

              {/* Move List */}
              <div className="mt-4 max-h-32 overflow-y-auto">
                <div className="grid grid-cols-4 gap-2">
                  {game.moves.map((move, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentMoveIndex(idx)}
                      className={`text-sm px-2 py-1 rounded ${
                        idx === currentMoveIndex 
                          ? 'bg-[#d4af37] text-[#1a1614]' 
                          : move.piece?.color === 'red'
                            ? 'bg-[#c92a2a]/20 text-[#c92a2a]'
                            : 'bg-[#3a2e2a] text-[#e6dcc3]'
                      }`}
                    >
                      {idx + 1}. [{move.from?.[0]},{move.from?.[1]}]→[{move.to?.[0]},{move.to?.[1]}]
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
