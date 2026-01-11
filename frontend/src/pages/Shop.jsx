import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { Coins, ShoppingBag, Sparkles, Check } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Shop() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPackages();
  }, [user, navigate]);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/shop/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId) => {
    setPurchasing(packageId);
    try {
      const response = await axios.post(`${API}/shop/checkout`, {
        package_id: packageId,
        origin_url: window.location.origin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Không thể tạo đơn hàng');
      setPurchasing(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#1a1614]">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl text-[#e6dcc3] mb-4">CỬA HÀNG</h1>
          <p className="text-[#a89f91]">Nạp xu vàng để sử dụng các tính năng cao cấp</p>
          
          {/* Current Balance */}
          <div className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[#241e1b] rounded-full border border-[#d4af37]">
            <Coins className="w-5 h-5 text-[#d4af37]" />
            <span className="text-[#e6dcc3]">Số dư:</span>
            <span className="text-xl font-bold text-[#d4af37]">{user.coins}</span>
            <span className="text-[#a89f91]">xu</span>
          </div>
        </div>

        {/* Packages Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#a89f91]">Đang tải gói nạp...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {packages.map((pkg, idx) => (
              <Card 
                key={pkg.id}
                className={`bg-[#241e1b] border-[#4a3b32] overflow-hidden transition-all hover:scale-105 ${
                  idx === packages.length - 1 ? 'ring-2 ring-[#d4af37]' : ''
                }`}
              >
                {/* Popular Badge */}
                {idx === packages.length - 1 && (
                  <div className="bg-gradient-to-r from-[#d4af37] to-[#b4941f] text-[#1a1614] text-center py-1 text-sm font-bold">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    PHỔ BIẾN NHẤT
                  </div>
                )}

                <CardContent className="p-6">
                  {/* Package Icon */}
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                    <Coins className="w-8 h-8 text-[#d4af37]" />
                  </div>

                  {/* Name */}
                  <h3 className="font-serif text-xl text-[#e6dcc3] text-center mb-2">
                    {pkg.name}
                  </h3>

                  {/* Coins */}
                  <p className="text-3xl font-bold text-[#d4af37] text-center mb-2">
                    {pkg.coins.toLocaleString()}
                    <span className="text-sm font-normal text-[#a89f91] ml-1">xu</span>
                  </p>

                  {/* Description */}
                  <p className="text-sm text-[#a89f91] text-center mb-6">
                    {pkg.description}
                  </p>

                  {/* Price */}
                  <div className="text-center mb-4">
                    <span className="text-2xl font-bold text-[#e6dcc3]">
                      ${pkg.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Purchase Button */}
                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasing === pkg.id}
                    className={`w-full ${
                      idx === packages.length - 1 ? 'btn-imperial' : 'btn-gold'
                    }`}
                    data-testid={`buy-${pkg.id}`}
                  >
                    {purchasing === pkg.id ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang xử lý...
                      </span>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        MUA NGAY
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Features */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl text-[#d4af37] text-center mb-8">
            Xu Vàng Dùng Để Làm Gì?
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Mở khóa avatar cao cấp',
              'Tham gia giải đấu đặc biệt',
              'Phân tích ván cờ nâng cao',
              'Hỗ trợ phát triển game'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-[#241e1b] rounded-lg border border-[#4a3b32]">
                <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#d4af37]" />
                </div>
                <span className="text-[#e6dcc3]">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Info */}
        <div className="mt-12 text-center text-[#a89f91] text-sm">
          <p>Thanh toán an toàn qua Stripe. Hỗ trợ Visa, Mastercard, và nhiều hình thức khác.</p>
        </div>
      </main>
    </div>
  );
}
