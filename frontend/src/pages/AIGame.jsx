import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import ChessBoard from '../components/ChessBoard';
import PlayerInfo from '../components/PlayerInfo';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { ArrowLeft, RotateCcw, Bot } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

export default function AIGame() {
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [gameEndDialog, setGameEndDialog] = useState(null);

  const gameId = searchParams.get('gameId');

  const createGame = useCallback(async () => {
    try {
      const response = await axios.post(`${API}/games/ai/create`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGame(response.data);
      // Update URL without reload
      window.history.replaceState(null, '', `/ai-game?gameId=${response.data.id}`);
    } catch (error) {
      toast.error('Không thể tạo ván cờ');
      navigate('/lobby');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const fetchGame = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API}/games/${id}`);
      setGame(response.data);
    } catch (error) {
      toast.error('Không thể tải ván cờ');
      navigate('/lobby');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (gameId) {
      fetchGame(gameId);
    } else {
      createGame();
    }
  }, [user, navigate, gameId, createGame, fetchGame]);

  const handleGameEnd = (status) => {
    const playerColor = game?.player_color;
    let title, message;
    
    if (status === 'draw') {
      title = 'Hòa Cờ';
      message = 'Ván cờ kết thúc với kết quả hòa.';
    } else if (
      (status === 'red_won' && playerColor === 'red') ||
      (status === 'black_won' && playerColor === 'black')
    ) {
      title = 'Chiến Thắng!';
      message = 'Chúc mừng bạn đã chiến thắng AI!';
    } else {
      title = 'Thất Bại';
      message = 'AI đã chiến thắng. Hãy thử lại!';
    }
    
    setGameEndDialog({ title, message, status });
  };

  const makeMove = async (fromPos, toPos) => {
    if (!game) return;
    
    setThinking(true);
    try {
      const response = await axios.post(`${API}/games/ai/${game.id}/move`, {
        game_id: game.id,
        from_pos: fromPos,
        to_pos: toPos
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGame(prev => ({
        ...prev,
        board: response.data.board,
        current_turn: response.data.current_turn,
        status: response.data.status,
        moves: [...(prev.moves || []), ...(response.data.moves || [])]
      }));

      if (response.data.status !== 'playing') {
        handleGameEnd(response.data.status);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Nước đi không hợp lệ';
      toast.error(message);
    } finally {
      setThinking(false);
    }
  };

  const newGame = async () => {
    setLoading(true);
    setGameEndDialog(null);
    await createGame();
  };

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-[#1a1614] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#a89f91]">Đang chuẩn bị ván cờ...</p>
        </div>
      </div>
    );
  }

  const playerColor = game.player_color;
  const aiColor = playerColor === 'red' ? 'black' : 'red';
  const isMyTurn = game.current_turn === playerColor;
  const gameEnded = game.status !== 'playing';

  return (
    <div className="min-h-screen bg-[#1a1614]">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/lobby')}
            className="mb-4 text-[#a89f91] hover:text-[#d4af37]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại sảnh
          </Button>

          {/* AI Info */}
          <div className="flex items-center justify-between mb-4">
            <Card className="bg-[#241e1b] border-[#4a3b32] p-4 flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                aiColor === 'red' 
                  ? 'bg-[#c92a2a]/20 border-2 border-[#c92a2a]' 
                  : 'bg-[#2d2520] border-2 border-[#4a3b32]'
              }`}>
                <Bot className={`w-6 h-6 ${aiColor === 'red' ? 'text-[#c92a2a]' : 'text-[#e6dcc3]'}`} />
              </div>
              <div>
                <h4 className="font-medium text-[#e6dcc3]">AI Cờ Tướng</h4>
                <p className="text-sm text-[#a89f91]">
                  {thinking ? 'Đang suy nghĩ...' : game.current_turn === aiColor ? 'Lượt của AI' : 'Chờ bạn đi'}
                </p>
              </div>
              {/* AI Color indicator */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-auto ${
                aiColor === 'red' ? 'bg-[#f5f0e6]' : 'bg-[#2d2520]'
              }`}>
                <span className={`font-['Ma_Shan_Zheng'] text-lg ${
                  aiColor === 'red' ? 'text-[#c92a2a]' : 'text-[#e6dcc3]'
                }`}>
                  {aiColor === 'red' ? '帥' : '將'}
                </span>
              </div>
            </Card>

            {thinking && (
              <div className="flex items-center gap-2 text-[#d4af37]">
                <div className="w-4 h-4 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
                AI đang suy nghĩ...
              </div>
            )}
          </div>

          {/* Chess Board */}
          <ChessBoard
            board={game.board}
            onMove={makeMove}
            currentTurn={game.current_turn}
            playerColor={playerColor}
            disabled={gameEnded || !isMyTurn || thinking}
            lastMove={game.moves?.[game.moves.length - 1]}
          />

          {/* Player Info */}
          <div className="mt-4">
            <PlayerInfo
              username={user?.username || 'Bạn'}
              elo={user?.elo || 1200}
              color={playerColor}
              isCurrentTurn={isMyTurn && !gameEnded}
            />
          </div>

          {/* New Game Button */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={newGame}
              className="btn-gold"
              data-testid="new-ai-game-btn"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Ván Mới
            </Button>
          </div>

          {/* Move History */}
          {game.moves && game.moves.length > 0 && (
            <Card className="mt-6 bg-[#241e1b] border-[#4a3b32] p-4">
              <h3 className="font-serif text-lg text-[#d4af37] mb-3">Lịch Sử Nước Đi</h3>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {game.moves.map((move, idx) => (
                  <div 
                    key={idx}
                    className={`text-sm px-3 py-1 rounded ${
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
              gameEndDialog?.title === 'Chiến Thắng!' 
                ? 'text-[#d4af37]' 
                : gameEndDialog?.status === 'draw' 
                  ? 'text-[#a89f91]' 
                  : 'text-[#c92a2a]'
            }`}>
              {gameEndDialog?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-[#a89f91] text-center py-4">{gameEndDialog?.message}</p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/lobby')}
              className="border-[#4a3b32] text-[#a89f91]"
            >
              Về Sảnh
            </Button>
            <Button onClick={newGame} className="btn-imperial">
              <RotateCcw className="w-4 h-4 mr-2" />
              Chơi Lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
