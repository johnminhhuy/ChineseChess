import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Trophy, Swords, TrendingUp, TrendingDown, Minus, Calendar, Edit2, Camera, Save } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Profile() {
  const { user, token, refreshUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    age: '',
    gender: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setProfileData({
      username: user.username || '',
      age: user.age || '',
      gender: user.gender || '',
      avatar_url: user.avatar_url || ''
    });
    fetchGames();
  }, [user, navigate]);

  const fetchGames = async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}/games?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGames(response.data);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/users/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refreshUser();
      toast.success(t('success'));
      setEditDialogOpen(false);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const winRate = user.games_played > 0 
    ? Math.round((user.wins / user.games_played) * 100) 
    : 0;

  const getGameResult = (game) => {
    if (game.status === 'draw') return 'draw';
    if (game.winner_id === user.id) return 'win';
    return 'loss';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Default avatars
  const defaultAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
  ];

  return (
    <div className="min-h-screen bg-[#1a1614]">
      {/* Background */}
      <div 
        className="fixed inset-0"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(26, 22, 20, 0.92) 0%, rgba(26, 22, 20, 0.98) 100%), url('https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      <Navbar />

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Profile Header */}
        <Card className="bg-[#241e1b]/90 border-[#4a3b32] mb-8 backdrop-blur">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar */}
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#c92a2a] to-[#9b1c1c] flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-['Ma_Shan_Zheng'] text-5xl text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setEditDialogOpen(true)}
                  className="absolute bottom-0 right-0 w-9 h-9 bg-[#d4af37] rounded-full flex items-center justify-center text-[#1a1614] hover:scale-110 transition-transform"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                  <h1 className="font-serif text-3xl text-[#e6dcc3]">{user.username}</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditDialogOpen(true)}
                    className="text-[#d4af37] hover:bg-[#d4af37]/10"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-[#a89f91] text-base mb-4">{user.email}</p>
                {user.age && <p className="text-[#a89f91] text-base">{t('age')}: {user.age} | {t('gender')}: {user.gender === 'male' ? t('male') : user.gender === 'female' ? t('female') : t('other')}</p>}
                
                {/* Stats */}
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4">
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-[#d4af37]">
                      <Trophy className="w-5 h-5" />
                      <span className="text-2xl font-bold">{user.elo}</span>
                    </div>
                    <p className="text-base text-[#a89f91]">ELO</p>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#e6dcc3]">{user.games_played}</span>
                    <p className="text-base text-[#a89f91]">{t('games')}</p>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-2xl font-bold text-green-500">{user.wins}</span>
                    <p className="text-base text-[#a89f91]">{t('wins')}</p>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#c92a2a]">{user.losses}</span>
                    <p className="text-base text-[#a89f91]">{t('losses')}</p>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#a89f91]">{user.draws}</span>
                    <p className="text-base text-[#a89f91]">{t('draws')}</p>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#d4af37]">{winRate}%</span>
                    <p className="text-base text-[#a89f91]">{t('winRate')}</p>
                  </div>
                </div>
              </div>

              {/* Coins */}
              <div className="text-center p-6 bg-[#1a1614] rounded-lg border border-[#4a3b32]">
                <span className="text-3xl font-bold text-[#d4af37]">{user.coins}</span>
                <p className="text-base text-[#a89f91]">{t('coins')}</p>
                <Button 
                  onClick={() => navigate('/shop')}
                  className="mt-3 btn-gold"
                >
                  {t('addCoins')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game History */}
        <Card className="bg-[#241e1b]/90 border-[#4a3b32] backdrop-blur">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-[#d4af37] flex items-center gap-2">
              <Swords className="w-6 h-6" />
              {t('gameHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin mx-auto" />
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-12">
                <Swords className="w-16 h-16 text-[#5c4d45] mx-auto mb-4" />
                <p className="text-[#a89f91] text-lg">{t('noGames')}</p>
                <Button 
                  onClick={() => navigate('/lobby')}
                  className="mt-4 btn-imperial"
                >
                  {t('startPlaying')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {games.map((game) => {
                  const result = getGameResult(game);
                  const isRed = game.red_player_id === user.id;
                  const opponent = isRed ? game.black_player_username : game.red_player_username;
                  
                  return (
                    <div 
                      key={game.id}
                      className={`p-4 rounded-lg border ${
                        result === 'win' 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : result === 'loss' 
                            ? 'bg-[#c92a2a]/10 border-[#c92a2a]/30' 
                            : 'bg-[#1a1614] border-[#4a3b32]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            result === 'win' ? 'bg-green-500/20' : result === 'loss' ? 'bg-[#c92a2a]/20' : 'bg-[#3a2e2a]'
                          }`}>
                            {result === 'win' && <TrendingUp className="w-6 h-6 text-green-500" />}
                            {result === 'loss' && <TrendingDown className="w-6 h-6 text-[#c92a2a]" />}
                            {result === 'draw' && <Minus className="w-6 h-6 text-[#a89f91]" />}
                          </div>

                          <div>
                            <p className="text-[#e6dcc3] font-medium text-lg">
                              vs {opponent || 'AI'}
                              {game.is_ai_game && <span className="text-[#a89f91] ml-2">(AI)</span>}
                            </p>
                            <div className="flex items-center gap-3 text-base text-[#a89f91]">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(game.created_at)}
                              </span>
                              <span className={`px-2 py-0.5 rounded ${
                                isRed ? 'bg-[#c92a2a]/20 text-[#c92a2a]' : 'bg-[#3a2e2a] text-[#e6dcc3]'
                              }`}>
                                {isRed ? t('red') : t('black')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-xl font-bold ${
                            result === 'win' ? 'text-green-500' : result === 'loss' ? 'text-[#c92a2a]' : 'text-[#a89f91]'
                          }`}>
                            {result === 'win' ? t('won') : result === 'loss' ? t('lost') : t('draw')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#241e1b] border-[#4a3b32] text-[#e6dcc3] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#d4af37]">{t('editProfile')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 mt-4">
            {/* Avatar Selection */}
            <div>
              <Label className="text-base text-[#e6dcc3] mb-3 block">{t('uploadAvatar')}</Label>
              <div className="grid grid-cols-6 gap-2">
                {defaultAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setProfileData({ ...profileData, avatar_url: url })}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                      profileData.avatar_url === url ? 'border-[#d4af37] scale-110' : 'border-[#4a3b32]'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label className="text-base text-[#e6dcc3]">{t('displayName')}</Label>
              <Input
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                className="h-12 text-base bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3]"
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label className="text-base text-[#e6dcc3]">{t('age')}</Label>
              <Input
                type="number"
                value={profileData.age}
                onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                className="h-12 text-base bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3]"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="text-base text-[#e6dcc3]">{t('gender')}</Label>
              <Select 
                value={profileData.gender} 
                onValueChange={(val) => setProfileData({ ...profileData, gender: val })}
              >
                <SelectTrigger className="h-12 text-base bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3]">
                  <SelectValue placeholder={t('gender')} />
                </SelectTrigger>
                <SelectContent className="bg-[#241e1b] border-[#4a3b32]">
                  <SelectItem value="male" className="text-[#e6dcc3]">{t('male')}</SelectItem>
                  <SelectItem value="female" className="text-[#e6dcc3]">{t('female')}</SelectItem>
                  <SelectItem value="other" className="text-[#e6dcc3]">{t('other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-[#4a3b32] text-[#a89f91]">
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveProfile} disabled={saving} className="btn-imperial">
              {saving ? t('loading') : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('saveProfile')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
