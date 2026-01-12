import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { Trophy, Swords, Users, ShoppingBag, ChevronRight, Gamepad2, Eye, Play } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Landing() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [ongoingGames, setOngoingGames] = useState([]);
  const [onlineCount] = useState(Math.floor(Math.random() * 500) + 200);

  useEffect(() => {
    fetchLeaderboard();
    fetchOngoingGames();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/leaderboard?limit=5`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const fetchOngoingGames = async () => {
    try {
      const response = await axios.get(`${API}/games/ongoing?limit=5`);
      setOngoingGames(response.data);
    } catch (error) {
      console.error('Failed to fetch ongoing games:', error);
    }
  };

  const handlePlayNow = () => {
    if (user) {
      navigate('/lobby');
    } else {
      navigate('/login');
    }
  };

  const handleGuestPlay = () => {
    navigate('/guest-game');
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 pt-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#e6dcc3] mb-4 leading-tight drop-shadow-lg">
              {t('heroTitle')}
            </h1>
            <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl mb-8">
              <span className="text-[#d4af37]">SO TÀI </span>
              <span className="text-[#c92a2a]">CỜ TƯỚNG </span>
              <span className="text-[#d4af37]">ĐỈNH CAO!</span>
            </h2>
            
            <p className="text-[#c8bfb0] text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('heroDesc')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button
                onClick={handlePlayNow}
                className="btn-imperial"
                data-testid="hero-play-btn"
              >
                <Swords className="w-5 h-5 mr-2" />
                {t('playNowBtn')}
              </Button>
              <Link to="/register">
                <Button
                  className="btn-gold"
                  data-testid="hero-register-btn"
                >
                  {t('registerBtn')}
                </Button>
              </Link>
            </div>

            {/* Guest Play Button */}
            <Button
              onClick={handleGuestPlay}
              variant="ghost"
              className="text-[#d4af37] hover:text-[#e6dcc3] hover:bg-[#d4af37]/10 text-base"
              data-testid="guest-play-btn"
            >
              <Gamepad2 className="w-5 h-5 mr-2" />
              {t('playAsGuest')}
            </Button>

            {/* Stats */}
            <div className="flex justify-center gap-8 mt-8 text-[#c8bfb0]">
              <div className="flex items-center gap-2">
                <div className="online-dot" />
                <span className="text-base"><strong className="text-[#e6dcc3] text-lg">{onlineCount}</strong> {t('onlinePlayers')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Ad Banner 1 */}
        <section className="container mx-auto px-4 py-4">
          <div className="ad-banner p-4 text-center" data-testid="ad-banner-1">
            <p className="text-[#a89f91] text-sm">📢 Quảng cáo - Liên hệ đặt banner: cotuong247.com@gmail.com</p>
          </div>
        </section>

        {/* Features & Leaderboard Grid */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
              {/* Play vs Player */}
              <Card 
                className="card-glass p-6 hover:border-[#d4af37] transition-all duration-300 group cursor-pointer relative overflow-hidden" 
                onClick={() => navigate('/lobby')}
              >
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-[#c92a2a]/20 flex items-center justify-center">
                    <Swords className="w-7 h-7 text-[#c92a2a]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#e6dcc3] mb-2">{t('vsPlayer')}</h3>
                    <p className="text-[#a89f91] text-base">{t('vsPlayerDesc')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6" />
              </Card>

              {/* Play vs AI */}
              <Card 
                className="card-glass p-6 hover:border-[#d4af37] transition-all duration-300 group cursor-pointer relative overflow-hidden" 
                onClick={() => user ? navigate('/ai-game') : navigate('/guest-game')}
              >
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-[#d4af37]/20 flex items-center justify-center">
                    <span className="font-['Ma_Shan_Zheng'] text-3xl text-[#d4af37]">機</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#e6dcc3] mb-2">{t('vsAI')}</h3>
                    <p className="text-[#a89f91] text-base">{t('vsAIDesc')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6" />
              </Card>

              {/* Leaderboard Card */}
              <Card 
                className="card-glass p-6 hover:border-[#d4af37] transition-all duration-300 group cursor-pointer" 
                onClick={() => navigate('/leaderboard')}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-[#d4af37]/20 flex items-center justify-center">
                    <Trophy className="w-7 h-7 text-[#d4af37]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#e6dcc3] mb-2">{t('leaderboard')}</h3>
                    <p className="text-[#a89f91] text-base">{t('topPlayersDesc')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6" />
              </Card>

              {/* Shop Card */}
              <Card 
                className="card-glass p-6 hover:border-[#d4af37] transition-all duration-300 group cursor-pointer" 
                onClick={() => navigate('/shop')}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-[#c92a2a]/20 flex items-center justify-center">
                    <ShoppingBag className="w-7 h-7 text-[#c92a2a]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#e6dcc3] mb-2">{t('shop')}</h3>
                    <p className="text-[#a89f91] text-base">{t('shopDesc')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6" />
              </Card>
            </div>

            {/* Leaderboard Panel */}
            <Card className="card-glass overflow-hidden">
              <div className="px-6 py-4 border-b border-[#4a3b32] flex items-center justify-between">
                <h3 className="font-serif text-xl text-[#d4af37]">{t('topPlayers')}</h3>
                <Trophy className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div className="p-4">
                {leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((player, idx) => (
                      <div 
                        key={player.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1614]/50 border border-[#4a3b32]/50"
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-base ${
                          idx === 0 ? 'bg-[#d4af37] text-[#1a1614]' :
                          idx === 1 ? 'bg-[#a0a0a0] text-[#1a1614]' :
                          idx === 2 ? 'bg-[#cd7f32] text-[#1a1614]' :
                          'bg-[#3a2e2a] text-[#e6dcc3]'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-[#e6dcc3] font-medium text-base">{player.username}</p>
                        </div>
                        <div className="text-[#d4af37] font-bold text-lg">{player.elo}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[#a89f91] py-8 text-base">{t('noRankData')}</p>
                )}
                
                <Link to="/leaderboard">
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 text-[#d4af37] hover:text-[#d4af37] hover:bg-[#d4af37]/10 text-base"
                  >
                    {t('viewAll')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>

        {/* Ongoing Games Section */}
        <section className="container mx-auto px-4 py-8">
          <Card className="card-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-[#4a3b32] flex items-center justify-between">
              <h3 className="font-serif text-xl text-[#d4af37] flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Các ván cờ đang diễn ra
              </h3>
              <Link to="/watch">
                <Button variant="ghost" className="text-[#d4af37] text-sm">
                  Xem tất cả
                </Button>
              </Link>
            </div>
            <div className="p-4">
              {ongoingGames.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ongoingGames.map((game) => (
                    <div 
                      key={game.id}
                      className="p-4 rounded-lg bg-[#1a1614]/50 border border-[#4a3b32]/50 hover:border-[#d4af37] transition-colors cursor-pointer"
                      onClick={() => navigate(`/watch/${game.id}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#c92a2a]/20 flex items-center justify-center">
                            <span className="font-['Ma_Shan_Zheng'] text-sm text-[#c92a2a]">帥</span>
                          </div>
                          <span className="text-[#e6dcc3] text-sm">{game.red_player_username}</span>
                        </div>
                        <span className="text-[#d4af37] text-xs">VS</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#e6dcc3] text-sm">{game.black_player_username}</span>
                          <div className="w-8 h-8 rounded-full bg-[#3a2e2a] flex items-center justify-center">
                            <span className="font-['Ma_Shan_Zheng'] text-sm text-[#e6dcc3]">將</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded ${
                          game.current_turn === 'red' ? 'bg-[#c92a2a]/20 text-[#c92a2a]' : 'bg-[#3a2e2a] text-[#e6dcc3]'
                        }`}>
                          Lượt: {game.current_turn === 'red' ? 'Đỏ' : 'Đen'}
                        </span>
                        <Button size="sm" variant="ghost" className="text-[#d4af37] text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          Xem
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#a89f91] py-8">Chưa có ván cờ nào đang diễn ra</p>
              )}
            </div>
          </Card>
        </section>

        {/* Ad Banner 2 */}
        <section className="container mx-auto px-4 py-4">
          <div className="ad-banner p-4 text-center" data-testid="ad-banner-2">
            <p className="text-[#a89f91] text-sm">📢 Đặt quảng cáo của bạn tại đây - Liên hệ: cotuong247.com@gmail.com</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#4a3b32]/50 mt-12">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-[#a89f91] text-base">
              <p>© 2026 Cờ Tướng Online - Nền tảng đấu cờ tướng trực tuyến hàng đầu Việt Nam</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
