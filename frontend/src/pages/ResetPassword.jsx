import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

import { ArrowLeft, Lock, Eye, EyeOff, Save } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Thiếu token reset (link không hợp lệ).");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/reset-password`, {
        token,
        new_password: newPassword,
      });
      toast.success(res?.data?.detail || "Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.");
      navigate("/login");
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message || "Reset mật khẩu thất bại";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4">
      <Button
        variant="ghost"
        onClick={() => navigate("/login")}
        className="fixed top-4 left-4 z-20 text-[#e6dcc3] hover:text-[#d4af37] hover:bg-transparent"
        data-testid="back-btn"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Quay lại
      </Button>

      <Card className="w-full max-w-md card-glass animate-fade-in">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-serif text-3xl text-[#e6dcc3]">Đặt lại mật khẩu</CardTitle>
          <CardDescription className="text-[#a89f91] text-base">
            Nhập mật khẩu mới để hoàn tất
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!token ? (
            <div className="space-y-3 text-center">
              <p className="text-[#a89f91]">
                Link reset không hợp lệ hoặc thiếu token.
              </p>
              <Link to="/forgot-password" className="text-[#d4af37] hover:underline">
                Yêu cầu link reset mới
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#e6dcc3] text-base">
                  Mật khẩu mới
                </Label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5c4d45]" />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-11 pr-12 h-12 text-base bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3] placeholder:text-[#5c4d45] focus:border-[#d4af37]"
                    required
                    data-testid="reset-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c4d45] hover:text-[#d4af37]"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    data-testid="toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <p className="text-xs text-[#a89f91]">Tối thiểu 6 ký tự.</p>
              </div>

              <Button type="submit" disabled={loading} className="w-full btn-imperial h-12" data-testid="reset-submit">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    LƯU MẬT KHẨU
                  </span>
                )}
              </Button>

              <div className="text-center text-sm">
                <Link to="/login" className="text-[#d4af37] hover:underline">
                  Về trang đăng nhập
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
