import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

import { ArrowLeft, Mail, Send } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

export default function ForgotUsername() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/forgot-username`, { email });
      toast.success(res?.data?.detail || "Nếu email tồn tại, hệ thống đã gửi username qua email.");
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message || "Gửi yêu cầu thất bại";
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
          <CardTitle className="font-serif text-3xl text-[#e6dcc3]">Quên username</CardTitle>
          <CardDescription className="text-[#a89f91] text-base">
            Nhập email để nhận lại username
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#e6dcc3] text-base">
                Email
              </Label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5c4d45]" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="pl-11 h-12 text-base bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3] placeholder:text-[#5c4d45] focus:border-[#d4af37]"
                  required
                  data-testid="forgot-email"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-imperial h-12" data-testid="forgot-submit">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang gửi...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  GỬI USERNAME
                </span>
              )}
            </Button>

            <div className="text-center text-sm">
              <Link to="/login" className="text-[#d4af37] hover:underline">
                Về trang đăng nhập
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
