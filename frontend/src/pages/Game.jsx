import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import ChessBoard from '../components/ChessBoard';
import GameTimer from '../components/GameTimer';
import GameChat from '../components/GameChat';
import PlayerInfo from '../components/PlayerInfo';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Flag, Handshake, BarChart3, ArrowLeft, Copy } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

export default function Game() {
  const { gameId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);
  const [drawRequester, setDrawRequester] = useState(null);
  const [gameEndDialog, setGameEndDialog] = useState(null);

  const fetchGame = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/games/${gameId}`);
      setGame(response.data);
    } catch (error) {
      toast.error('Không thể tải ván cờ');
      navigate('/lobby');
    } finally {
      setLoading(false);
    }
  }, [gameId, navigate]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/games/${gameId}/chat`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [gameId]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchGame();
    fetchMessages();
  }, [user, navigate, fetchGame, fetchMessages]);

  // WebSocket connection
  useEffect(() => {
    if (!game || !user || !WS_URL) return;

    const websocket = new WebSocket(`${WS_URL}/ws/${gameId}/${user.id}`);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      // backend đôi khi gửi text "pong" để trả lời ping
      if (event.data === 'pong') return;

      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        // không phải JSON -> bỏ qua để khỏi crash
        return;
      }

      // nếu backend gửi pong dạng JSON
      if (data?.type === 'pong') return;

      switch (data.type) {
        case 'move':
          setGame(prev => ({
            ...prev,
            board: data.board,
            current_turn: data.current_turn,
            status: data.status,
            winner_id: data.winner_id
          }));
          if (data.status !== 'playing') {
            handleGameEnd(data.status, data.winner_id);
          }
          break;

        case 'chat':
          setMessages(prev => [...prev, data.message]);
          break;

        case 'draw_request':
          if (data.from_user_id !== user.id) {
            setDrawRequester(data.from_username);
            setDrawDialogOpen(true);
          }
          break;

        case 'game_end':
          handleGameEnd(data.status, data.winner_id, data.reason);
          break;

        default:
          break;
      }
    };


    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    // Keep connection alive
    const pingInterval = setInterval(() => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send('ping');
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      websocket.close();
    };
  }, [game?.id, user?.id]);

  const handleGameEnd = (status, winnerId, reason = '') => {
    let title, message;
    
    if (status === 'draw') {
      title = 'Hòa Cờ';
      message = 'Ván cờ kết thúc với kết quả hòa.';
    } else {
      const isWinner = winnerId === user?.id;
      title = isWinner ? 'Chiến Thắng!' : 'Thất Bại';
      message = isWinner ? 'Chúc mừng bạn đã chiến thắng!' : 'Bạn đã thua ván này.';
      
      if (reason === 'surrender') {
        message += ' (Đối thủ đầu hàng)';
      }
    }
    
    
    setGameEndDialog({ title, message, status });
  };

  const makeMove = async (fromPos, toPos) => {
    try {
      const response = await axios.post(`${API}/games/${gameId}/move`, {
        game_id: gameId,
        from_pos: fromPos,
        to_pos: toPos
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGame(prev => ({
        ...prev,
        board: response.data.board,
        current_turn: response.data.current_turn,
        status: response.data.status
      }));

      if (response.data.status !== 'playing') {
        handleGameEnd(response.data.status, user.id);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Nước đi không hợp lệ';
      toast.error(message);
    }
  };

  const surrender = async () => {
    if (!window.confirm('Bạn có chắc muốn đầu hàng?')) return;
    
    try {
      const response = await axios.post(`${API}/games/${gameId}/surrender`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      handleGameEnd(response.data.status, response.data.winner_id, 'surrender');
    } catch (error) {
      toast.error('Không thể đầu hàng');
    }
  };

  const requestDraw = async () => {
    try {
      await axios.post(`${API}/games/${gameId}/draw-request`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Đã gửi yêu cầu hòa');
    } catch (error) {
      toast.error('Không thể gửi yêu cầu hòa');
    }
  };

  const acceptDraw = async () => {
    try {
      await axios.post(`${API}/games/${gameId}/draw-accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrawDialogOpen(false);
    } catch (error) {
      toast.error('Không thể chấp nhận hòa');
    }
  };

  const sendMessage = async (message) => {
    try {
      await axios.post(`${API}/games/${gameId}/chat`, {
        game_id: gameId,
        message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      toast.error('Không thể gửi tin nhắn');
    }
  };

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-[#1a1614] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#a89f91]">Đang tải ván cờ...</p>
        </div>
      </div>
    );
  }

  const playerColor = game.red_player_id === user?.id ? 'red' : 'black';
  const opponentColor = playerColor === 'red' ? 'black' : 'red';
  const isMyTurn = game.current_turn === playerColor;
  const gameEnded = game.status !== 'playing';

  const redPlayer = {
    username: game.red_player_username,
    elo: 1200 // Would need to fetch from users
  };

  const blackPlayer = {
    username: game.black_player_username,
    elo: 1200
  };

  const currentPlayer = playerColor === 'red' ? redPlayer : blackPlayer;
  const opponent = playerColor === 'red' ? blackPlayer : redPlayer;

  console.log('GAME STATE', {
    current_turn: game.current_turn,
    red_player_id: game.red_player_id,
    black_player_id: game.black_player_id,
    my_id: user?.id,
    playerColor
  });


  return (
    <div className="min-h-screen bg-[#1a1614]">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="grid lg:grid-cols-[1fr_350px] gap-8">
          {/* Game Area */}
          <div>
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => navigate('/lobby')}
              className="mb-4 text-[#a89f91] hover:text-[#d4af37]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại sảnh
            </Button>

            {/* Opponent Info + Timer */}
            <div className="flex items-center justify-between mb-4">
              <PlayerInfo
                username={opponent.username}
                elo={opponent.elo}
                color={opponentColor}
                isCurrentTurn={game.current_turn === opponentColor}
              />
              <GameTimer
                time={opponentColor === 'red' ? game.red_time : game.black_time}
                isActive={!gameEnded && game.current_turn === opponentColor}
                color={opponentColor}
              />
            </div>

            {/* Chess Board */}
            <ChessBoard
              board={game.board}
              onMove={makeMove}
              currentTurn={game.current_turn}
              playerColor={playerColor}
              disabled={gameEnded || !isMyTurn}
              lastMove={game.moves?.[game.moves.length - 1]}
            />

            {/* Player Info + Timer */}
            <div className="flex items-center justify-between mt-4">
              <PlayerInfo
                username={currentPlayer.username}
                elo={currentPlayer.elo}
                color={playerColor}
                isCurrentTurn={game.current_turn === playerColor}
              />
              <GameTimer
                time={playerColor === 'red' ? game.red_time : game.black_time}
                isActive={!gameEnded && game.current_turn === playerColor}
                color={playerColor}
              />
            </div>

            {/* Game Controls */}
            {!gameEnded && (
              <div className="flex gap-3 mt-6 justify-center">
                <Button
                  onClick={surrender}
                  variant="outline"
                  className="border-[#c92a2a] text-[#c92a2a] hover:bg-[#c92a2a] hover:text-white"
                  data-testid="surrender-btn"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Đầu Hàng
                </Button>
                <Button
                  onClick={requestDraw}
                  variant="outline"
                  className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black"
                  data-testid="draw-btn"
                >
                  <Handshake className="w-4 h-4 mr-2" />
                  Cầu Hòa
                </Button>
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className="h-[600px]">
            <GameChat
              messages={messages}
              onSendMessage={sendMessage}
              currentUserId={user?.id}
            />
          </div>
          
        </div>
      </main>

      {/* Draw Request Dialog */}
      <Dialog open={drawDialogOpen} onOpenChange={setDrawDialogOpen}>
        <DialogContent className="bg-[#241e1b] border-[#4a3b32] text-[#e6dcc3]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#d4af37]">Yêu Cầu Hòa</DialogTitle>
          </DialogHeader>
          <p className="text-[#a89f91]">
            <strong className="text-[#e6dcc3]">{drawRequester}</strong> muốn xin hòa. Bạn có đồng ý không?
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDrawDialogOpen(false)}
              className="border-[#4a3b32] text-[#a89f91]"
            >
              Từ chối
            </Button>
            <Button onClick={acceptDraw} className="btn-imperial">
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Game End Dialog */}
      <Dialog open={!!gameEndDialog} onOpenChange={() => setGameEndDialog(null)}>
        <DialogContent className="bg-[#241e1b] border-[#4a3b32] text-[#e6dcc3]">
          <DialogHeader>
            <DialogTitle className={`font-serif text-2xl ${
              gameEndDialog?.status?.includes('won') && gameEndDialog?.title === 'Chiến Thắng!' 
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
            <Button onClick={() => setGameEndDialog(null)} className="btn-imperial">
              Xem Lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
