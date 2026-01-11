import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { Plus, Users, Clock, Trophy, Swords, Bot, RefreshCw, Target, Search, UserPlus } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Lobby() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newRoom, setNewRoom] = useState({
    name: '',
    time_control: 600,
    is_ranked: true
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchRooms();
    fetchUsers();
    
    // Poll for rooms and check if game started
    const interval = setInterval(() => {
      fetchRooms();
      checkMyRoom();
    }, 3000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API}/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if someone joined my room
  const checkMyRoom = async () => {
    try {
      const response = await axios.get(`${API}/rooms/my-active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.game_id) {
        // Someone joined! Navigate to game
        console.log(response.data);
        console.log(response.data.game_id, response.data.room.status);
        if (response.data.game_id != '' && response.data.room.status == "playing") {
          console.log("hi");
          console.log("Redirecting to");

          toast.success('Đối thủ đã vào phòng!');
          navigate(`/game/${response.data.game_id}`);
        }
      }
    } catch (error) {
      // No active room or error - ignore
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users/search?limit=50`);
      setAllUsers(response.data.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const searchUsers = async (query) => {
    try {
      const response = await axios.get(`${API}/users/search?q=${encodeURIComponent(query)}&limit=20`);
      setAllUsers(response.data.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 1) {
      searchUsers(query);
    } else {
      fetchUsers();
    }
  };

  const createRoom = async () => {
    if (!newRoom.name.trim()) {
      toast.error('Vui lòng nhập tên phòng');
      return;
    }

    try {
      await axios.post(`${API}/rooms`, newRoom, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Tạo phòng thành công! Đang chờ đối thủ...');
      setCreateDialogOpen(false);
      setNewRoom({ name: '', time_control: 600, is_ranked: true });
      fetchRooms();
    } catch (error) {
      toast.error('Không thể tạo phòng');
    }
  };

  const joinRoom = async (roomId) => {
    setJoiningRoom(roomId);
    try {
      const response = await axios.post(`${API}/rooms/${roomId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Đã vào phòng!');
      navigate(`/game/${response.data.game_id}`);
    } catch (error) {
      const message = error.response?.data?.detail || 'Không thể vào phòng';
      toast.error(message);
    } finally {
      setJoiningRoom(null);
    }
  };

  const playWithAI = async () => {
    try {
      const response = await axios.post(`${API}/games/ai/create`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/ai-game?gameId=${response.data.id}`);
    } catch (error) {
      toast.error('Không thể tạo ván cờ với máy');
    }
  };

  const challengePlayer = async (targetUser) => {
    try {
      const response = await axios.post(`${API}/rooms`, {
        name: `Thách đấu: ${user.username} vs ${targetUser.username}`,
        time_control: 600,
        is_ranked: true,
        challenged_user_id: targetUser.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Đã gửi thách đấu tới ${targetUser.username}!`);
      setChallengeDialogOpen(false);
      fetchRooms();
    } catch (error) {
      toast.error('Không thể gửi thách đấu');
    }
  };

  const sendFriendRequest = async (targetUserId) => {
    try {
      await axios.post(`${API}/friends/request`, { target_user_id: targetUserId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Đã gửi lời mời kết bạn!');
    } catch (error) {
      const message = error.response?.data?.detail || 'Không thể gửi lời mời';
      toast.error(message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} ${t('minutes')}`;
  };

  const filteredUsers = allUsers;

  if (!user) return null;

  return (
    <div className="min-h-screen page-bg">
      <Navbar />

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#e6dcc3] mb-2">{t('lobby')}</h1>
            <p className="text-[#a89f91] text-lg">{t('lobbyDesc')}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={playWithAI} className="btn-gold" data-testid="play-ai-btn">
              <Bot className="w-5 h-5 mr-2" />
              {t('vsAI')}
            </Button>

            {/* Challenge Player */}
            <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10" data-testid="challenge-btn">
                  <Target className="w-5 h-5 mr-2" />
                  {t('challenge')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#241e1b] border-[#4a3b32] text-[#e6dcc3] max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl text-[#d4af37]">{t('challengePlayer')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5c4d45]" />
                    <Input
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder={t('searchPlayer')}
                      className="pl-11 h-12 text-base bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3]"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredUsers.map((targetUser) => (
                      <div 
                        key={targetUser.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#1a1614] border border-[#4a3b32]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#3a2e2a] flex items-center justify-center">
                            <span className="font-['Ma_Shan_Zheng'] text-lg text-[#e6dcc3]">
                              {targetUser.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-[#e6dcc3] font-medium">{targetUser.username}</p>
                            <p className="text-sm text-[#d4af37]">{targetUser.elo} ELO</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => sendFriendRequest(targetUser.id)}
                            size="sm"
                            variant="ghost"
                            className="text-[#d4af37]"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={() => challengePlayer(targetUser)}
                            size="sm"
                            className="bg-[#c92a2a] hover:bg-[#a52020]"
                          >
                            <Swords className="w-4 h-4 mr-1" />
                            Thách đấu
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="text-center text-[#a89f91] py-4">Không tìm thấy người chơi</p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Room */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-imperial" data-testid="create-room-btn">
                  <Plus className="w-5 h-5 mr-2" />
                  {t('createRoom')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#241e1b] border-[#4a3b32] text-[#e6dcc3]">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl text-[#d4af37]">{t('createRoom')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 mt-4">
                  <div className="space-y-2">
                    <Label className="text-base text-[#e6dcc3]">{t('roomName')}</Label>
                    <Input
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                      placeholder="Ván cờ của tôi"
                      className="h-12 text-base bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3] placeholder:text-[#5c4d45]"
                      data-testid="room-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base text-[#e6dcc3]">{t('timeControl')}</Label>
                    <Select
                      value={String(newRoom.time_control)}
                      onValueChange={(val) => setNewRoom({ ...newRoom, time_control: parseInt(val) })}
                    >
                      <SelectTrigger className="h-12 text-base bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#241e1b] border-[#4a3b32]">
                        <SelectItem value="180" className="text-[#e6dcc3]">3 phút</SelectItem>
                        <SelectItem value="300" className="text-[#e6dcc3]">5 phút</SelectItem>
                        <SelectItem value="600" className="text-[#e6dcc3]">10 phút</SelectItem>
                        <SelectItem value="900" className="text-[#e6dcc3]">15 phút</SelectItem>
                        <SelectItem value="1800" className="text-[#e6dcc3]">30 phút</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="ranked"
                      checked={newRoom.is_ranked}
                      onChange={(e) => setNewRoom({ ...newRoom, is_ranked: e.target.checked })}
                      className="w-5 h-5 rounded border-[#4a3b32] bg-[#1a1614]"
                    />
                    <Label htmlFor="ranked" className="text-base text-[#e6dcc3]">{t('rankedGame')}</Label>
                  </div>

                  <Button onClick={createRoom} className="w-full btn-imperial h-12" data-testid="confirm-create-room">
                    {t('createRoom')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Refresh Button */}
        <Button
          variant="ghost"
          onClick={() => { fetchRooms(); fetchUsers(); }}
          className="mb-4 text-[#a89f91] hover:text-[#d4af37] text-base"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          {t('refresh')}
        </Button>

        {/* Rooms List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#a89f91] text-lg">{t('loading')}</p>
          </div>
        ) : rooms.length === 0 ? (
          <Card className="card-glass p-12 text-center">
            <Users className="w-16 h-16 text-[#5c4d45] mx-auto mb-4" />
            <h3 className="font-serif text-2xl text-[#e6dcc3] mb-2">{t('noRooms')}</h3>
            <p className="text-[#a89f91] text-lg mb-6">{t('beFirst')}</p>
            <Button onClick={() => setCreateDialogOpen(true)} className="btn-imperial">
              <Plus className="w-5 h-5 mr-2" />
              {t('createFirstRoom')}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <Card 
                key={room.id}
                className="card-glass p-6 hover:border-[#d4af37] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#c92a2a]/20 border-2 border-[#c92a2a] flex items-center justify-center">
                      <span className="font-['Ma_Shan_Zheng'] text-2xl text-[#c92a2a]">帥</span>
                    </div>

                    <div>
                      <h3 className="text-xl text-[#e6dcc3] font-medium">{room.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-base text-[#a89f91]">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {room.host_username}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-[#d4af37]" />
                          {room.host_elo}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(room.time_control)}
                        </span>
                        {room.is_ranked && (
                          <span className="px-2 py-0.5 bg-[#d4af37]/20 text-[#d4af37] rounded text-sm font-medium">
                            {t('ranked')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => joinRoom(room.id)}
                    disabled={joiningRoom === room.id || room.host_id === user.id}
                    className="btn-imperial"
                    data-testid={`join-room-${room.id}`}
                  >
                    {joiningRoom === room.id ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang vào...
                      </span>
                    ) : room.host_id === user.id ? (
                      'Đang chờ...'
                    ) : (
                      <>
                        <Swords className="w-5 h-5 mr-2" />
                        {t('joinRoom')}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
