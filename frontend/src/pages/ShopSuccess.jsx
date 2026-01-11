import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ShopSuccess() {
  const [searchParams] = useSearchParams();
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [attempts, setAttempts] = useState(0);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/shop');
      return;
    }

    pollPaymentStatus();
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('error');
      return;
    }

    try {
      const response = await axios.get(`${API}/shop/checkout/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_status === 'paid') {
        setStatus('success');
        // Refresh user data to update coins
        await refreshUser();
        return;
      } else if (response.data.status === 'expired') {
        setStatus('error');
        return;
      }

      // Continue polling
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, pollInterval);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1614]">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-[80vh]">
        <Card className="bg-[#241e1b] border-[#4a3b32] max-w-md w-full">
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
                </div>
                <h2 className="font-serif text-2xl text-[#e6dcc3] mb-4">Đang xử lý thanh toán...</h2>
                <p className="text-[#a89f91]">Vui lòng đợi trong giây lát</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="font-serif text-2xl text-[#e6dcc3] mb-4">Thanh toán thành công!</h2>
                <p className="text-[#a89f91] mb-8">
                  Xu vàng đã được cộng vào tài khoản của bạn.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/shop')}
                    variant="outline"
                    className="border-[#4a3b32] text-[#a89f91]"
                  >
                    Tiếp tục mua
                  </Button>
                  <Button
                    onClick={() => navigate('/lobby')}
                    className="btn-imperial"
                  >
                    Chơi ngay
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#c92a2a]/20 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-[#c92a2a]" />
                </div>
                <h2 className="font-serif text-2xl text-[#e6dcc3] mb-4">Có lỗi xảy ra</h2>
                <p className="text-[#a89f91] mb-8">
                  Không thể xác nhận thanh toán. Nếu tiền đã bị trừ, vui lòng liên hệ hỗ trợ.
                </p>
                <Button
                  onClick={() => navigate('/shop')}
                  className="btn-gold"
                >
                  Quay lại cửa hàng
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
