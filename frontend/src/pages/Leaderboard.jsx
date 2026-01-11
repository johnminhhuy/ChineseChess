import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import axios from 'axios';
import { Trophy, Medal, Award } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Leaderboard() {
  const { t } = useLanguage();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/leaderboard?limit=50`);
      setPlayers(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-[#d4af37]" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-[#a0a0a0]" />;
    if (rank === 3) return <Award className="w-6 h-6 text-[#cd7f32]" />;
    return null;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-[#d4af37] text-[#1a1614]';
    if (rank === 2) return 'bg-[#a0a0a0] text-[#1a1614]';
    if (rank === 3) return 'bg-[#cd7f32] text-[#1a1614]';
    return 'bg-[#3a2e2a] text-[#e6dcc3]';
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar />

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-4xl sm:text-5xl text-[#e6dcc3] mb-4 whitespace-nowrap tracking-normal"
            style={{ fontFamily: '"Be Vietnam Pro", system-ui, sans-serif' }}
          >
            {t('leaderboardTitle')}
          </h1>

          <p
            className="text-[#a89f91] text-lg leading-relaxed tracking-normal whitespace-normal"
            style={{ fontFamily: '"Be Vietnam Pro", system-ui, sans-serif' }}
          >
            {t('topPlayersDesc')}
          </p>

        </div>

        {/* Top 3 Podium */}
        {players.length >= 3 && (
          <div className="flex justify-center items-end gap-4 mb-12">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-[#a0a0a0]/20 border-4 border-[#a0a0a0] flex items-center justify-center">
                <span className="font-['Ma_Shan_Zheng'] text-3xl text-[#a0a0a0]">
                  {players[1]?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-[#e6dcc3] font-medium text-lg">{players[1]?.username}</p>
              <p className="text-[#a0a0a0] font-bold text-xl">{players[1]?.elo}</p>
              <div className="mt-2 h-24 w-20 bg-[#a0a0a0]/20 rounded-t-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-[#a0a0a0]">2</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center -mt-8">
              <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-[#d4af37]/20 border-4 border-[#d4af37] flex items-center justify-center animate-pulse-gold">
                <span className="font-['Ma_Shan_Zheng'] text-4xl text-[#d4af37]">
                  {players[0]?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-[#e6dcc3] font-medium text-xl">{players[0]?.username}</p>
              <p className="text-[#d4af37] font-bold text-2xl">{players[0]?.elo}</p>
              <div className="mt-2 h-32 w-24 bg-[#d4af37]/20 rounded-t-lg flex items-center justify-center">
                <Trophy className="w-12 h-12 text-[#d4af37]" />
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-[#cd7f32]/20 border-4 border-[#cd7f32] flex items-center justify-center">
                <span className="font-['Ma_Shan_Zheng'] text-3xl text-[#cd7f32]">
                  {players[2]?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-[#e6dcc3] font-medium text-lg">{players[2]?.username}</p>
              <p className="text-[#cd7f32] font-bold text-xl">{players[2]?.elo}</p>
              <div className="mt-2 h-20 w-20 bg-[#cd7f32]/20 rounded-t-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-[#cd7f32]">3</span>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-[#d4af37]">{t('allPlayers')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#a89f91] text-lg">{t('loading')}</p>
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-[#5c4d45] mx-auto mb-4" />
                <p className="text-[#a89f91] text-lg">{t('noPlayersYet')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {players.map((player, idx) => (
                  <div 
                    key={player.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      idx < 3 
                        ? 'bg-[#1a1614]/50 border-[#d4af37]/30' 
                        : 'bg-[#1a1614]/50 border-[#4a3b32]/50'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${getRankStyle(idx + 1)}`}>
                      {getRankIcon(idx + 1) || idx + 1}
                    </div>

                    <div className="w-11 h-11 rounded-full bg-[#3a2e2a] flex items-center justify-center">
                      <span className="font-['Ma_Shan_Zheng'] text-xl text-[#e6dcc3]">
                        {player.username.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1">
                      <p className="text-[#e6dcc3] font-medium text-lg">{player.username}</p>
                      <div className="flex gap-4 text-base text-[#a89f91]">
                        <span>{player.games_played || 0} ván</span>
                        <span className="text-green-500">{player.wins || 0}W</span>
                        <span className="text-[#c92a2a]">{player.losses || 0}L</span>
                        <span>{player.draws || 0}D</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#d4af37]">{player.elo}</span>
                      <p className="text-sm text-[#a89f91]">ELO</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
