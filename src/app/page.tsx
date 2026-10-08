'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  Sparkles, 
  ShoppingBag, 
  Wallet, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  Percent,
  Layers,
  Zap,
  Info,
  Lock,
  UserPlus,
  LogIn,
  Send,
  X,
  Play,
  Video,
  Maximize2,
  Clock,
  ShieldCheck,
  Phone,
  User as UserIcon
} from 'lucide-react';
import { toast } from 'sonner';

// Helper lấy link embed video linh hoạt (YouTube, Google Drive, direct MP4)
function getEmbedVideoUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  try {
    if (trimmed.includes('youtube.com/watch')) {
      const u = new URL(trimmed);
      const videoId = u.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : trimmed;
    }
    if (trimmed.includes('youtu.be/')) {
      const videoId = trimmed.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : trimmed;
    }
    if (trimmed.includes('youtube.com/shorts/')) {
      const videoId = trimmed.split('youtube.com/shorts/')[1]?.split('?')[0]?.split('/')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : trimmed;
    }
    if (trimmed.includes('drive.google.com/file/d/')) {
      const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      return match ? `https://drive.google.com/file/d/${match[1]}/preview` : trimmed;
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [convertedData, setConvertedData] = useState<{
    originalUrl: string;
    affiliateUrl: string;
    directUrl?: string;
    subId: string;
    isLoggedIn: boolean;
    commissionRate: number;
    productPreview?: {
      title: string;
      imageUrl: string;
      brand?: string;
      isOfficialShop?: boolean;
      shopId?: string;
      itemId?: string;
      categoryName?: string;
      categoryIcon?: string;
      shopeeCommissionRate?: number;
      estimatedPrice?: number;
      shopeeCommissionAmount?: number;
    } | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Trạng thái Form Đăng Nhập / Đăng Ký Nhanh Ngay Trong Modal (0ms Delay)
  const [modalTab, setModalTab] = useState<'register' | 'login'>('register');
  const [modalPhone, setModalPhone] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalFullname, setModalFullname] = useState('');
  const [modalAuthLoading, setModalAuthLoading] = useState(false);

  // Converted Product Estimator State
  const [previewProductPrice, setPreviewProductPrice] = useState(250000);
  const [previewCommRate, setPreviewCommRate] = useState(10);

  // Bộ lọc ô tích "Đã mua hàng" để gửi thông tin về Admin
  const [isPurchasedConfirmed, setIsPurchasedConfirmed] = useState(false);
  const [orderCodeInput, setOrderCodeInput] = useState('');
  const [reportingOrder, setReportingOrder] = useState(false);
  const [isOrderReported, setIsOrderReported] = useState(false);

  // Link video hướng dẫn sử dụng (YouTube / MP4 / Drive / TikTok)
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState<string>('/video-huong-dan-web.mp4');
  const [activeChapter, setActiveChapter] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSeekVideo = (seconds: number, index: number) => {
    setActiveChapter(index);
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  // Kiểm tra trạng thái đăng nhập khi vào trang chủ & khôi phục link chưa chuyển đổi
  useEffect(() => {
    // 1. Phục hồi NGAY LẬP TỨC từ LocalStorage (0ms Delay - Không bao giờ lag/delay)
    try {
      const cached = localStorage.getItem('shopee_user_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.phone) {
          setCurrentUser(parsed);
        }
      }
    } catch {}

    // 2. Đồng bộ ngầm với máy chủ để cập nhật số dư mới nhất
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('shopee_user_session', JSON.stringify(data.user));
          // Khôi phục link nếu khách vừa đăng nhập / đăng ký xong
          const pendingUrl = localStorage.getItem('pending_shopee_url');
          if (pendingUrl) {
            setInputUrl(pendingUrl);
            localStorage.removeItem('pending_shopee_url');
            toast.info('Đã khôi phục link sản phẩm Shopee của bạn!');
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleConvert = async (e?: React.FormEvent, overrideUser?: any) => {
    if (e) e.preventDefault();
    const urlToConvert = inputUrl.trim();
    if (!urlToConvert) {
      toast.error('Vui lòng nhập đường link sản phẩm Shopee!');
      return;
    }

    let activeUser = overrideUser || currentUser;
    if (!activeUser && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('shopee_user_session');
        if (cached) {
          activeUser = JSON.parse(cached);
          if (activeUser) setCurrentUser(activeUser);
        }
      } catch {}
    }

    // CHẶN KHÁCH VÃNG LAI: Bắt buộc đăng ký / đăng nhập để nhận hoàn tiền
    if (!activeUser) {
      localStorage.setItem('pending_shopee_url', urlToConvert);
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setConvertedData(null);
    try {
      const res = await fetch('/api/convert-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToConvert }),
      });
      const data = await res.json();

      if (data.requireAuth) {
        localStorage.setItem('pending_shopee_url', urlToConvert);
        setShowAuthModal(true);
        return;
      }

      if (data.success && data.data) {
        setConvertedData({
          ...data.data,
          isLoggedIn: true,
        });
        setIsPurchasedConfirmed(false);
        setOrderCodeInput('');
        setIsOrderReported(false);
        
        // Tự động cập nhật mức giá và tỷ lệ hoa hồng Shopee dựa trên sản phẩm thật
        if (data.data.productPreview?.estimatedPrice) {
          setPreviewProductPrice(data.data.productPreview.estimatedPrice);
        }
        if (data.data.productPreview?.shopeeCommissionRate) {
          setPreviewCommRate(data.data.productPreview.shopeeCommissionRate);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('trigger-money-rain'));
        }
        toast.success('Chuyển đổi link Shopee Affiliate thành công!');
      } else {
        toast.error(data.message || 'Lỗi chuyển đổi link');
      }
    } catch (err) {
      toast.error('Không thể kết nối máy chủ, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Đăng Nhập / Đăng Ký Siêu Tốc Ngay Trong Modal (0ms Delay)
  const handleModalAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = modalPhone.trim().replace(/[^0-9]/g, '');
    const normalizedPhone = cleanPhone.startsWith('84') && cleanPhone.length === 11 ? '0' + cleanPhone.slice(2) : cleanPhone;
    
    if (!normalizedPhone || !modalPassword) {
      toast.error('Vui lòng nhập số điện thoại và mật khẩu!');
      return;
    }

    if (modalTab === 'register' && modalPassword.length < 6) {
      toast.error('Mật khẩu tối thiểu 6 ký tự!');
      return;
    }

    setModalAuthLoading(true);
    try {
      const endpoint = modalTab === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = modalTab === 'register' 
        ? { phone: normalizedPhone, password: modalPassword, fullname: modalFullname.trim() }
        : { phone: normalizedPhone, password: modalPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success && data.user) {
        const fullUser = {
          ...data.user,
          balance: data.user.balance ?? 0,
          pendingBalance: data.user.pendingBalance ?? 0,
          totalWithdrawn: data.user.totalWithdrawn ?? 0,
        };
        setCurrentUser(fullUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('shopee_user_session', JSON.stringify(fullUser));
          window.dispatchEvent(new CustomEvent('auth-change', { detail: fullUser }));
        }
        setShowAuthModal(false);
        toast.success(modalTab === 'register' ? 'Đăng ký thành công! Đã tự động kích hoạt tài khoản.' : 'Đăng nhập thành công!');
        
        // Tự động chuyển đổi link ngay lập tức cho khách!
        setTimeout(() => {
          handleConvert(undefined, fullUser);
        }, 100);
      } else {
        toast.error(data.message || (modalTab === 'register' ? 'Đăng ký thất bại!' : 'Đăng nhập thất bại!'));
      }
    } catch (err) {
      toast.error('Không thể kết nối máy chủ, vui lòng thử lại!');
    } finally {
      setModalAuthLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        toast.info('Đã dán link từ clipboard!');
      }
    } catch (err) {
      toast.error('Vui lòng cho phép truy cập clipboard hoặc dán thủ công!');
    }
  };

  const trackClick = (subId?: string) => {
    const id = subId || convertedData?.subId;
    if (id) {
      fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subId: id }),
      }).catch(() => {});
    }
  };

  const handleCopyLink = () => {
    if (!convertedData?.affiliateUrl) return;
    navigator.clipboard.writeText(convertedData.affiliateUrl);
    setCopied(true);
    trackClick(convertedData.subId);
    toast.success('Đã sao chép link hoàn tiền vào bộ nhớ tạm!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Khách hàng bấm gửi thông tin đã mua hàng trên Shopee
  const handleReportOrder = async () => {
    if (!convertedData) return;
    setReportingOrder(true);
    try {
      const res = await fetch('/api/user/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subId: convertedData.subId,
          orderSn: orderCodeInput.trim() || undefined,
          itemName: convertedData.productPreview?.title || 'Sản phẩm Shopee',
          imageUrl: convertedData.productPreview?.imageUrl || undefined,
          productUrl: convertedData.originalUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Đã ghi nhận đơn hàng thành công!');
        setIsOrderReported(true);
      } else {
        toast.error(data.message || 'Lỗi gửi thông tin đơn hàng');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setReportingOrder(false);
    }
  };

  // Tính toán chính xác số tiền hoàn tiền cho khách = Hoa hồng sàn Shopee chi trả × % hoàn tiền (chuẩn 60%)
  const userPercent = convertedData?.commissionRate || 60;
  const totalShopeeCommAmount = convertedData?.productPreview?.shopeeCommissionAmount || Math.round(previewProductPrice * (previewCommRate / 100));
  const userCashbackAmount = Math.round(totalShopeeCommAmount * (userPercent / 100));

  return (
    <div className="space-y-24 pb-20">
      
      {/* 1. HERO & TOOL CHUYỂN ĐỔI */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        {/* Background gradient blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-orange-400/15 dark:bg-orange-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 text-shopee-600 dark:text-shopee-400 text-xs font-bold shadow-xs animate-bounce-short">
            <Sparkles className="w-4 h-4 text-shopee-500" />
            <span>Hệ Thống Hoàn Tiền Mua Sắm Shopee Tự Động</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Mua Sắm Shopee Thông Minh <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-shopee-500 via-orange-500 to-amber-500">
              Nhận Lại Tiền Hoàn Tự Động
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Dán link sản phẩm Shopee bất kỳ để tạo link hoàn tiền. Tự động tích lũy tiền mặt vào ví và rút về tài khoản ngân hàng khi đủ <strong>20.000 VNĐ</strong>!
          </p>

          {/* TOOL BOX */}
          <div className="pt-4 text-left">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 transition-all">
              
              <form onSubmit={handleConvert} className="space-y-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Dán Link Sản Phẩm Shopee Cần Mua:
                </label>
                
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="Ví dụ: https://shopee.vn/product/... hoặc https://s.shopee.vn/..."
                      className="w-full pl-4 pr-20 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-shopee-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-shopee-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-shopee-300 transition-colors"
                    >
                      Dán Link
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3.5 rounded-xl gradient-shopee text-white font-bold text-sm shadow-md hover:shadow-lg hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Lấy Link Hoàn Tiền</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* KẾT QUẢ SAU KHI CHUYỂN ĐỔI */}
              {convertedData && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Link hoàn tiền Shopee đã sẵn sàng! (Mã Sub_ID: {convertedData.subId})
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      Tự Động Tích Lũy Vào Ví
                    </span>
                  </div>

                  {/* THÔNG TIN SẢN PHẨM & DỰ TOÁN HOÀN TIỀN MINH BẠCH */}
                  {convertedData.productPreview && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-4">
                      {/* Product Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                        {convertedData.productPreview.imageUrl ? (
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-white border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
                            <img
                              src={convertedData.productPreview.imageUrl}
                              alt={convertedData.productPreview.title}
                              className="w-full h-full object-cover"
                            />
                            {convertedData.productPreview.isOfficialShop && (
                              <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                Shopee Mall
                              </span>
                            )}
                          </div>
                        ) : null}

                        <div className="flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-md">
                              <span>{convertedData.productPreview.categoryIcon || '🛍️'}</span>
                              <span>{convertedData.productPreview.categoryName || 'Shopee Phổ Thông'}</span>
                            </span>
                            {convertedData.productPreview.isOfficialShop && (
                              <span className="bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                Chính Hãng Shopee Mall
                              </span>
                            )}
                          </div>
                          
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                            {convertedData.productPreview.title}
                          </h4>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input link + Actions */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all select-all font-medium">
                      {convertedData.affiliateUrl}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleCopyLink}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-shopee-400 transition-colors shadow-2xs"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Đã Sao Chép' : 'Sao Chép'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowQrModal(true);
                          trackClick(convertedData.subId);
                        }}
                        title="Quét mã mở App Shopee"
                        className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-shopee-400 transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      <a
                        href={convertedData.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackClick(convertedData.subId)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg gradient-shopee text-white shadow-xs hover:opacity-95 transition-all"
                      >
                        <span>Mở Shopee Mua Ngay</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* BỘ LỌC Ô TÍCH XÁC NHẬN ĐÃ MUA HÀNG TRÊN SHOPEE */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50/70 via-amber-50/60 to-orange-50/70 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80 border border-orange-200 dark:border-orange-800/60 space-y-3.5">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="purchasedConfirmCheckbox"
                        checked={isPurchasedConfirmed}
                        onChange={(e) => setIsPurchasedConfirmed(e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded border-orange-300 text-shopee-500 focus:ring-shopee-500 cursor-pointer accent-orange-500 shrink-0"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="purchasedConfirmCheckbox"
                          className="font-bold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer select-none flex flex-wrap items-center gap-2"
                        >
                          <span>Tôi đã đặt mua sản phẩm này trên Shopee</span>
                          {isOrderReported && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                              ✓ Đã Ghi Nhận Thành Công
                            </span>
                          )}
                        </label>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          Chỉ tích vào ô này sau khi bạn đã mở Shopee và hoàn tất thanh toán đặt hàng để gửi thông tin sản phẩm về Admin rà soát đối soát hoàn tiền vào ví.
                        </p>
                      </div>
                    </div>

                    {isPurchasedConfirmed && (
                      <div className="pt-3 border-t border-orange-200/80 dark:border-orange-800/50 space-y-3 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <input
                            type="text"
                            value={orderCodeInput}
                            onChange={(e) => setOrderCodeInput(e.target.value)}
                            placeholder="Nhập Mã Đơn Hàng Shopee (Không bắt buộc, VD: 241007XYZ trong mục Đơn Mua)"
                            disabled={isOrderReported}
                            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-shopee-500 outline-none shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={handleReportOrder}
                            disabled={reportingOrder || isOrderReported}
                            className="px-5 py-2.5 rounded-xl gradient-shopee text-white font-bold text-xs sm:text-sm shadow-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0"
                          >
                            {reportingOrder ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Đang Gửi...</span>
                              </>
                            ) : isOrderReported ? (
                              <>
                                <Check className="w-4 h-4 text-white" />
                                <span>Đã Gửi Admin</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Gửi Thông Tin Đã Mua</span>
                              </>
                            )}
                          </button>
                        </div>

                        {isOrderReported ? (
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="font-bold">Đã tiếp nhận thông tin đơn hàng thành công!</p>
                              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                Dữ liệu gồm hình ảnh, tên sản phẩm và mã Sub_ID: <strong>{convertedData.subId}</strong> đã được chuyển thẳng tới mục Quản trị. Admin sẽ so sánh đối soát hoa hồng từ Shopee và cộng tiền vào ví của bạn.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            💡 Mẹo: Bạn có thể mở App Shopee &gt; vào <strong>Tôi &gt; Đơn Mua</strong> &gt; sao chép Mã đơn hàng dán vào đây để Admin đối soát nhanh nhất! (Nếu không nhập, hệ thống sẽ đối soát tự động theo mã Sub_ID của link).
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tips Mua Hàng Chuẩn Không Bị Mất Đơn */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800/80 dark:to-slate-800/40 p-4 rounded-2xl border border-amber-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>4 Nguyên Tắc Vàng Để Shopee Ghi Nhận Hoa Hồng 100%:</span>
                    </div>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                      <li><strong>Giỏ hàng phải trống:</strong> Xóa sản phẩm khỏi giỏ trước khi bấm link để Shopee không ghi nhận đơn cũ.</li>
                      <li><strong>Mở trực tiếp trên App Shopee:</strong> Bấm nút "Mở Shopee Mua Ngay" hoặc quét mã QR để mở thẳng trong ứng dụng Shopee.</li>
                      <li><strong>Không dùng tài khoản tạo link để mua:</strong> Shopee chặn chính sách "tự mua hàng", hãy dùng tài khoản Shopee người thân để mua.</li>
                      <li><strong>Thanh toán trong 24h:</strong> Thêm vào giỏ và đặt hàng ngay sau khi mở link để giữ phiên theo dõi (Cookie).</li>
                    </ul>
                  </div>

                  {currentUser ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          Đã tự động liên kết tài khoản: <strong>{currentUser.fullname || currentUser.phone}</strong> (Hoa hồng 60% sẽ tự động cộng vào ví sau khi nhận hàng)
                        </span>
                      </div>
                      <Link
                        href="/dashboard"
                        className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shrink-0 ml-2"
                      >
                        Xem Ví
                      </Link>
                    </div>
                  ) : !convertedData.isLoggedIn && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
                      <span className="text-indigo-800 dark:text-indigo-300 font-medium">
                        Bạn chưa đăng nhập? Đăng ký ngay để lưu số dư hoàn tiền về tài khoản!
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setModalTab('register');
                          setShowAuthModal(true);
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shrink-0 ml-2 cursor-pointer"
                      >
                        Đăng Ký
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* 2. VIDEO HƯỚNG DẪN SỬ DỤNG - KHUNG KHỔ GỐC CHUẨN XÁC 100% */}
      <section id="video-huong-dan" className="max-w-4xl mx-auto px-4 sm:px-6 relative">
        {/* Glow ambient background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-rose-500/15 rounded-3xl blur-3xl -z-10 pointer-events-none" />

        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-orange-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Header section */}
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-300/40 dark:border-orange-500/30 text-shopee-600 dark:text-shopee-400 text-xs font-extrabold uppercase tracking-wider shadow-xs">
              <Video className="w-4 h-4 text-shopee-500" />
              <span>Video Hướng Dẫn Thực Hành (1 Phút)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Xem Video Cách Nhận Hoàn Tiền Từng Bước
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Video quay thao tác thực tế: Copy link Shopee ➔ Dán chuyển đổi ➔ Mua hàng và tiền hoàn tự động cộng vào ví!
            </p>
          </div>

          {/* Native Aspect Ratio Video Player Container - KHUNG KHỔ GỐC CHUẨN XÁC 100%, KHÔNG BO TRÒN CẮT MẤT GÓC */}
          <div className="max-w-[560px] mx-auto">
            {/* Khung video vuông góc chuẩn 100% video gốc, tuyệt đối không bo góc làm mất nội dung */}
            <div className="relative shadow-2xl border-2 border-slate-800 dark:border-slate-700 bg-black">
              {tutorialVideoUrl ? (
                tutorialVideoUrl.endsWith('.mp4') || tutorialVideoUrl.endsWith('.webm') || tutorialVideoUrl.startsWith('/') ? (
                  <video
                    ref={videoRef}
                    src={tutorialVideoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    poster="/video-poster.jpg"
                    className="w-full h-auto block bg-black"
                    style={{ aspectRatio: '2160 / 3056' }}
                  >
                    Trình duyệt của bạn không hỗ trợ phát thẻ video.
                  </video>
                ) : (
                  <iframe
                    src={getEmbedVideoUrl(tutorialVideoUrl)}
                    title="Video hướng dẫn hoàn tiền Shopee"
                    className="w-full aspect-video border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )
              ) : (
                <div className="aspect-[2160/3056] w-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
                  <Play className="w-12 h-12 text-shopee-500 mb-3" />
                  <p className="text-sm font-bold">Chưa có video hướng dẫn</p>
                </div>
              )}
            </div>

            {/* Video Badges & Nút Phóng Toàn Màn Hình */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 px-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Chuẩn Khung Khổ Gốc (Giữ 100% 4 Góc)
              </span>
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Thời lượng: 01:02
                </span>
                <span className="font-semibold text-shopee-500">Rút từ 20K</span>
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.requestFullscreen) {
                        videoRef.current.requestFullscreen();
                      } else if ((videoRef.current as any).webkitRequestFullscreen) {
                        (videoRef.current as any).webkitRequestFullscreen();
                      }
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors"
                  title="Xem toàn màn hình"
                >
                  <Maximize2 className="w-3 h-3 text-shopee-500" /> Phóng To
                </button>
              </div>
            </div>
          </div>

          {/* Timeline 4 Bước Tóm Tắt (Bấm vào để nhảy đến đoạn video tương ứng) */}
          <div className="mt-8 max-w-3xl mx-auto bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-shopee-500" />
                Các Bước Thao Tác (Bấm Để Xem Từng Đoạn):
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {[
                {
                  seconds: 0,
                  time: '00:00 - 00:18',
                  title: '1. Giao Diện & Số Dư Ví',
                  desc: 'Xem ví tiền hoàn, trạng thái chờ đối soát và lịch sử rút tiền',
                  color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900',
                },
                {
                  seconds: 18,
                  time: '00:18 - 00:36',
                  title: '2. Sao Chép Link Shopee',
                  desc: 'Mở app Shopee > Vào sản phẩm cần mua > Bấm nút Chia sẻ và Sao chép link',
                  color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
                },
                {
                  seconds: 36,
                  time: '00:36 - 00:50',
                  title: '3. Dán Link Chuyển Đổi',
                  desc: 'Dán link vào ô công cụ trên web > Bấm "Lấy Link Hoàn Tiền"',
                  color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900',
                },
                {
                  seconds: 52,
                  time: '00:52 - 01:02',
                  title: '4. Mua Hàng & Rút Tiền',
                  desc: 'Bấm Mở Shopee Mua Ngay > Hoàn tất đơn hàng > Tiền về ví rút từ 20K',
                  color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
                },
              ].map((chap, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSeekVideo(chap.seconds, idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeChapter === idx
                      ? 'ring-2 ring-shopee-500 shadow-sm ' + chap.color
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-900 dark:text-white">{chap.title}</span>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{chap.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                    {chap.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons Below Video */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-6">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (inputEl) inputEl.focus();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl gradient-shopee text-white font-bold text-sm shadow-md hover:shadow-lg hover:opacity-95 active:scale-98 transition-all"
            >
              <span>Thực Hành Dán Link Ngay Bây Giờ</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#cach-hoat-dong"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all"
            >
              <span>Xem Quy Trình 3 Bước Chi Tiết</span>
            </a>
          </div>

        </div>
      </section>

      {/* 3. CÁCH HOẠT ĐỘNG (3 BƯỚC ĐƠN GIẢN) */}
      <section id="cach-hoat-dong" className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Quy Trình 3 Bước Nhận Tiền
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Không cần thay đổi thói quen mua sắm, chỉ cần 1 bước chuyển đổi link đơn giản.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950 text-shopee-500 flex items-center justify-center font-black text-xl mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Dán Link Shopee
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tìm sản phẩm bạn muốn mua trên App hoặc Web Shopee. Copy link và dán vào công cụ chuyển đổi trên trang web.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-500 flex items-center justify-center font-black text-xl mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Mua Hàng Như Thường
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Bấm vào link mới hoặc quét mã QR để mở Shopee và đặt hàng. Áp mã giảm giá, voucher freeship thoải mái!
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center font-black text-xl mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Nhận Tiền & Rút Về STK
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Sau khi bạn nhận hàng thành công, tiền hoàn sẽ tự động được cộng vào ví của bạn. Đủ 20k là rút thẳng về ngân hàng!
            </p>
          </div>

        </div>
      </section>

      {/* 4. FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Giải đáp mọi thắc mắc về cơ chế hoàn tiền mua sắm Shopee.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Tiền hoàn được tính và ghi nhận như thế nào?',
              a: 'Khi bạn mua sắm qua link tạo từ web, hệ thống sẽ tự động ghi nhận đơn hàng và trích thưởng tiền hoàn trực tiếp vào ví dựa trên mức chiết khấu của từng sản phẩm trên Shopee.',
            },
            {
              q: 'Bao nhiêu tiền thì tôi có thể rút về tài khoản ngân hàng?',
              a: 'Hạn mức rút tiền tối thiểu là 20.000 VNĐ. Bạn có thể rút về bất kỳ tài khoản ngân hàng nào tại Việt Nam (MBBank, Vietcombank, Techcombank, VPBank, MoMo,...).',
            },
            {
              q: 'Tôi có được áp mã giảm giá, voucher Shopee khi mua không?',
              a: 'Hoàn toàn được! Bạn vẫn áp mã giảm giá của Shop, mã miễn phí vận chuyển và mã giảm giá Shopee như bình thường mà vẫn được nhận trọn vẹn tiền hoàn.',
            },
            {
              q: 'Sau bao lâu thì tiền được cộng vào ví?',
              a: 'Sau khi bạn nhận hàng thành công và không phát sinh đổi trả/hủy đơn, hệ thống sẽ tự động đối soát và cộng tiền vào ví cho bạn.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-shopee-500 shrink-0 mt-0.5" />
                <span>{item.q}</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL QR CODE MUA HÀNG TRÊN PHONE */}
      {showQrModal && convertedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Quét Mã Mua Trên App Shopee
            </h3>
            
            <div className="p-4 bg-white rounded-2xl inline-block border border-slate-200 shadow-xs">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  convertedData.affiliateUrl
                )}`}
                alt="QR Code Mua Hàng Shopee"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dùng camera điện thoại hoặc tính năng quét mã trên Zalo/Shopee để mở link và mua hàng ngay.
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL YÊU CẦU ĐĂNG KÝ / ĐĂNG NHẬP NHANH (0ms Delay - Không cần chuyển trang) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-5">
            {/* Nút đóng modal */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-1.5 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-shopee-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-md shadow-orange-500/25">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {modalTab === 'register' ? 'Đăng Ký Nhận Hoàn Tiền' : 'Đăng Nhập Khách Hàng'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                {modalTab === 'register'
                  ? 'Tạo tài khoản miễn phí chỉ 10 giây để lưu tiền hoàn vào ví của bạn'
                  : 'Đăng nhập để tự động lưu tiền hoàn vào ví cá nhân'}
              </p>
            </div>

            {/* Switch Tab Đăng Ký / Đăng Nhập */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setModalTab('register')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  modalTab === 'register'
                    ? 'bg-white dark:bg-slate-900 text-shopee-600 dark:text-shopee-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Đăng Ký (30 Giây)
              </button>
              <button
                type="button"
                onClick={() => setModalTab('login')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  modalTab === 'login'
                    ? 'bg-white dark:bg-slate-900 text-shopee-600 dark:text-shopee-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tôi Đã Có Tài Khoản
              </button>
            </div>

            {/* Form thao tác trực tiếp */}
            <form onSubmit={handleModalAuth} className="space-y-3">
              {modalTab === 'register' && (
                <div>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={modalFullname}
                      onChange={(e) => setModalFullname(e.target.value)}
                      placeholder="Họ và tên của bạn (Tùy chọn)"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    placeholder="Số điện thoại nhận tiền (Ví dụ: 0987654321)"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    placeholder="Mật khẩu của bạn"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={modalAuthLoading}
                className="w-full py-3 rounded-xl gradient-shopee text-white font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {modalAuthLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {modalTab === 'register' ? 'Đăng Ký & Nhận Link Hoàn Tiền Ngay' : 'Đăng Nhập & Tạo Link Ngay'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quyền lợi thành viên tóm tắt */}
            <div className="bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 rounded-xl p-3 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Hoàn <strong>40% - 60%</strong> hoa hồng Shopee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Rút tiền mặt 24/7 về STK từ <strong>20.000 VNĐ</strong></span>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
              * Sau khi bấm, link sản phẩm bạn vừa dán sẽ tự động chuyển đổi ngay tức thì.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
