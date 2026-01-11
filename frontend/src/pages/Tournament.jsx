import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trophy, Calendar, Users, Coins, Clock } from 'lucide-react';

export default function Tournament() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Mock tournaments data
  const tournaments = [
    {
      id: '1',
      name: 'Giải Vô Địch Mùa Đông 2024',
      prize: 5000,
      participants: 128,
      maxParticipants: 256,
      startTime: '2024-12-20T10:00:00',
      entryFee: 100,
      status: 'upcoming'
    },
    {
      id: '2',
      name: 'Giải Đấu Hàng Tuần #48',
      prize: 1000,
      participants: 64,
      maxParticipants: 64,
      startTime: '2024-12-15T14:00:00',
      entryFee: 0,
      status: 'ongoing'
    },
    {
      id: '3',
      name: 'Giải Kỳ Thủ Mới',
      prize: 500,
      participants: 32,
      maxParticipants: 64,
      startTime: '2024-12-18T19:00:00',
      entryFee: 0,
      status: 'upcoming'
    }
  ];

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

  const handleJoin = (tournament) => {
    if (!user) {
      navigate('/login');
      return;
    }
    // TODO: Implement tournament join
    alert(`Tính năng tham gia giải đấu "${tournament.name}" đang được phát triển!`);
  };

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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl text-[#e6dcc3] mb-4">{t('tournamentTitle')}</h1>
          <p className="text-[#a89f91] text-lg">{t('tournamentDesc')}</p>
        </div>

        {/* Tournaments Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tournaments.map((tournament) => (
            <Card 
              key={tournament.id}
              className={`bg-[#241e1b]/90 border-[#4a3b32] overflow-hidden backdrop-blur transition-all hover:border-[#d4af37] ${
                tournament.status === 'ongoing' ? 'ring-2 ring-[#d4af37]' : ''
              }`}
            >
              {/* Status Badge */}
              {tournament.status === 'ongoing' && (
                <div className="bg-gradient-to-r from-[#d4af37] to-[#b4941f] text-[#1a1614] text-center py-2 text-base font-bold">
                  🔴 {t('ongoingTournaments')}
                </div>
              )}

              <CardContent className="p-6">
                {/* Tournament Name */}
                <h3 className="font-serif text-xl text-[#e6dcc3] mb-4">{tournament.name}</h3>

                {/* Stats */}
                <div className="space-y-3 mb-6">
                  {/* Prize */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#a89f91]">
                      <Trophy className="w-5 h-5 text-[#d4af37]" />
                      <span className="text-base">{t('prize')}</span>
                    </div>
                    <span className="text-[#d4af37] font-bold text-lg">{tournament.prize.toLocaleString()} xu</span>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#a89f91]">
                      <Users className="w-5 h-5" />
                      <span className="text-base">{t('participants')}</span>
                    </div>
                    <span className="text-[#e6dcc3] text-base">
                      {tournament.participants}/{tournament.maxParticipants}
                    </span>
                  </div>

                  {/* Start Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#a89f91]">
                      <Clock className="w-5 h-5" />
                      <span className="text-base">{t('startTime')}</span>
                    </div>
                    <span className="text-[#e6dcc3] text-base">{formatDate(tournament.startTime)}</span>
                  </div>

                  {/* Entry Fee */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#a89f91]">
                      <Coins className="w-5 h-5 text-[#d4af37]" />
                      <span className="text-base">{t('entryFee')}</span>
                    </div>
                    <span className={`text-base font-medium ${tournament.entryFee === 0 ? 'text-green-500' : 'text-[#e6dcc3]'}`}>
                      {tournament.entryFee === 0 ? t('free') : `${tournament.entryFee} xu`}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-2 bg-[#1a1614] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#c92a2a] to-[#d4af37] transition-all"
                      style={{ width: `${(tournament.participants / tournament.maxParticipants) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Join Button */}
                <Button
                  onClick={() => handleJoin(tournament)}
                  disabled={tournament.participants >= tournament.maxParticipants || tournament.status === 'ongoing'}
                  className={`w-full ${tournament.status === 'ongoing' ? 'btn-gold' : 'btn-imperial'}`}
                  data-testid={`join-tournament-${tournament.id}`}
                >
                  {tournament.status === 'ongoing' 
                    ? 'Đang diễn ra' 
                    : tournament.participants >= tournament.maxParticipants 
                      ? 'Đã đầy' 
                      : t('joinTournament')
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-12 text-center">
          <Card className="bg-[#241e1b]/90 border-[#4a3b32] p-8 max-w-2xl mx-auto">
            <p className="text-[#a89f91] text-lg">
              🏆 Hệ thống giải đấu đang được phát triển. Các giải đấu chính thức sẽ được tổ chức sớm!
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
