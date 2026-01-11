import { Trophy, User } from 'lucide-react';

export default function PlayerInfo({ 
  username, 
  elo, 
  color, 
  isCurrentTurn,
  avatarUrl = null 
}) {
  return (
    <div 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
        isCurrentTurn 
          ? 'bg-[#d4af37]/10 border-[#d4af37] gold-glow' 
          : 'bg-[#241e1b] border-[#4a3b32]'
      }`}
      data-testid={`player-info-${color}`}
    >
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        color === 'red' 
          ? 'bg-[#c92a2a]/20 border-2 border-[#c92a2a]' 
          : 'bg-[#2d2520] border-2 border-[#4a3b32]'
      }`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={username} className="w-full h-full rounded-full object-cover" />
        ) : (
          <User className={`w-6 h-6 ${color === 'red' ? 'text-[#c92a2a]' : 'text-[#e6dcc3]'}`} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <h4 className="font-medium text-[#e6dcc3]">{username}</h4>
        <div className="flex items-center gap-1 text-sm">
          <Trophy className="w-3 h-3 text-[#d4af37]" />
          <span className="text-[#d4af37]">{elo}</span>
        </div>
      </div>

      {/* Color indicator */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        color === 'red' ? 'bg-[#f5f0e6]' : 'bg-[#2d2520]'
      }`}>
        <span className={`font-['Ma_Shan_Zheng'] text-lg ${
          color === 'red' ? 'text-[#c92a2a]' : 'text-[#e6dcc3]'
        }`}>
          {color === 'red' ? '帥' : '將'}
        </span>
      </div>
    </div>
  );
}
