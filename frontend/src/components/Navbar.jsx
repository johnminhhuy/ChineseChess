import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Coins, Trophy, User, LogOut, Globe } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1614]/95 backdrop-blur border-b border-[#4a3b32]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
            <div className="w-10 h-10 rounded-full bg-[#c92a2a] flex items-center justify-center">
              <span className="font-['Ma_Shan_Zheng'] text-xl text-white">將</span>
            </div>
            <span className="font-serif text-xl text-[#d4af37] tracking-wider hidden sm:block">CỜ TƯỚNG</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/lobby" 
              className="text-[#e6dcc3] hover:text-[#d4af37] transition-colors text-base font-medium"
              data-testid="nav-play"
            >
              {t('playNow')}
            </Link>
            <Link 
              to="/leaderboard" 
              className="text-[#e6dcc3] hover:text-[#d4af37] transition-colors text-base font-medium"
              data-testid="nav-leaderboard"
            >
              {t('leaderboard')}
            </Link>
            <Link 
              to="/shop" 
              className="text-[#e6dcc3] hover:text-[#d4af37] transition-colors text-base font-medium"
              data-testid="nav-shop"
            >
              {t('shop')}
            </Link>
            <Link 
              to="/tournament" 
              className="text-[#e6dcc3] hover:text-[#d4af37] transition-colors text-base font-medium"
              data-testid="nav-tournament"
            >
              {t('tournament')}
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="lang-toggle flex items-center gap-1"
              data-testid="lang-toggle"
            >
              <Globe className="w-4 h-4" />
              <span>{language.toUpperCase()}</span>
            </button>

            {user ? (
              <>
                {/* Coins Display */}
                <div className="flex items-center gap-1 px-3 py-1.5 bg-[#241e1b] rounded-full border border-[#4a3b32]">
                  <Coins className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-[#d4af37] font-medium text-base" data-testid="user-coins">{user.coins}</span>
                </div>

                {/* ELO Display */}
                <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-[#241e1b] rounded-full border border-[#4a3b32]">
                  <Trophy className="w-4 h-4 text-[#c92a2a]" />
                  <span className="text-[#e6dcc3] font-medium text-base" data-testid="user-elo">{user.elo}</span>
                </div>

                {/* Profile Link */}
                <Link 
                  to="/profile"
                  className="flex items-center gap-2 text-[#e6dcc3] hover:text-[#d4af37] transition-colors"
                  data-testid="nav-profile"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline text-base">{user.username}</span>
                </Link>

                {/* Logout */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-[#a89f91] hover:text-[#c92a2a] hover:bg-transparent"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    className="text-[#e6dcc3] hover:text-[#d4af37] hover:bg-transparent text-base"
                    data-testid="login-btn"
                  >
                    {t('login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    className="bg-gradient-to-r from-[#c92a2a] to-[#9b1c1c] hover:scale-105 transition-transform border border-[#c92a2a] text-base"
                    data-testid="register-btn"
                  >
                    {t('register')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
