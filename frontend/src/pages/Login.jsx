import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import {
  LogIn,
  Mail,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  UserSearch
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Đăng nhập thành công!');
      navigate('/lobby');
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Đăng nhập thất bại';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-20 text-[#e6dcc3] hover:text-[#d4af37] hover:bg-transparent"
        data-testid="back-btn"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {t('back')}
      </Button>

      {/* Login Card */}
      <Card className="w-full max-w-md card-glass animate-fade-in">
        <CardHeader className="text-center pb-2">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-14 h-14 rounded-full bg-[#c92a2a] flex items-center justify-center">
              <span className="font-['Ma_Shan_Zheng'] text-3xl text-white">將</span>
            </div>
          </Link>

          <CardTitle className="font-serif text-3xl text-[#e6dcc3]">
            {t('login')}
          </CardTitle>
          <CardDescription className="text-[#a89f91] text-base">
            {t('welcomeBack')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#e6dcc3] text-base">
                {t('email')}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5c4d45]" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="pl-11 h-12 text-base bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3] placeholder:text-[#5c4d45] focus:border-[#d4af37]"
                  required
                  data-testid="login-email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#e6dcc3] text-base">
                {t('password')}
              </Label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5c4d45]" />

                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="pl-11 pr-12 h-12 text-base bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3] placeholder:text-[#5c4d45] focus:border-[#d4af37]"
                  required
                  data-testid="login-password"
                />

                {/* Show/Hide Password */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c4d45] hover:text-[#d4af37]"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  data-testid="toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Forgot links */}
              <div className="flex items-center justify-between pt-2 text-sm">
                <Link
                  to="/forgot-username"
                  className="inline-flex items-center gap-2 text-[#d4af37] hover:underline"
                  data-testid="forgot-username"
                >
                  <UserSearch className="w-4 h-4" />
                  Quên username?
                </Link>

                <Link
                  to="/forgot-password"
                  className="inline-flex items-center gap-2 text-[#d4af37] hover:underline"
                  data-testid="forgot-password"
                >
                  <KeyRound className="w-4 h-4" />
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-imperial h-12"
              data-testid="login-submit"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  ĐĂNG NHẬP
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#a89f91] text-base">
              {t('noAccount')}{' '}
              <Link to="/register" className="text-[#d4af37] hover:underline font-medium">
                {t('registerNow')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
