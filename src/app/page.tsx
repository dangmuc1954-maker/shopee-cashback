'use client';

import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [convertedData, setConvertedData] = useState<{
    originalUrl: string;
    affiliateUrl: string;
    subId: string;
    isLoggedIn: boolean;
    commissionRate: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Calculator State
  const [calcPrice, setCalcPrice] = useState(1000000);
  const [calcRate, setCalcRate] = useState(10); // % hoa hồng ngành hàng

  const handleConvert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) {
      toast.error('Vui lòng nhập đường link sản phẩm Shopee!');
      return;
    }

    setLoading(true);
    setConvertedData(null);
    try {
      const res = await fetch('/api/convert-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setConvertedData(data.data);
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

  // Tính toán hoa hồng demo
  const totalCommission = Math.round((calcPrice * calcRate) / 100);
  const userCashback = Math.round(totalCommission * 0.6);
  const adminProfit = Math.round(totalCommission * 0.4);

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
            <span>Chính sách Hoàn 60% Tiền Hoa Hồng Mua Sắm Shopee</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Mua Sắm Shopee Thông Minh <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-shopee-500 via-orange-500 to-amber-500">
              Nhận Lại 60% Hoa Hồng
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Dán link sản phẩm Shopee bất kỳ để tạo link hoàn tiền. Tự động tích lũy tiền mặt vào ví và rút về tài khoản ngân hàng khi đủ <strong>50.000 VNĐ</strong>!
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
                    <span className="text-xs font-semibold text-shopee-600 bg-shopee-50 dark:bg-shopee-950/40 px-2 py-0.5 rounded-md">
                      Hoàn 60% hoa hồng
                    </span>
                  </div>

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

                  {!convertedData.isLoggedIn && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
                      <span className="text-indigo-800 dark:text-indigo-300 font-medium">
                        Bạn chưa đăng nhập? Đăng ký ngay để lưu số dư hoàn tiền về tài khoản!
                      </span>
                      <Link
                        href="/register"
                        className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shrink-0 ml-2"
                      >
                        Đăng Ký
                      </Link>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* 2. CÔNG THỨC & BẢNG TÍNH HOA HỒNG */}
      <section id="bang-tinh" className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Bảng Tính Minh Bạch 60% Tiền Hoa Hồng
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Hệ thống tính tiền hoàn <strong>dựa trên số tiền hoa hồng thực tế</strong> mà Shopee chi trả cho từng sản phẩm của bạn. Shop trả bao nhiêu, bạn nhận lại đúng <strong>60%</strong> bấy nhiêu!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
          
          {/* Cột Trái: Nhập Hoa Hồng Thực Tế Của Sản Phẩm */}
          <div className="md:col-span-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Số Tiền Hoa Hồng Shopee Chi Trả Cho Sản Phẩm (VNĐ):
              </label>
              
              <div className="relative">
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={totalCommission}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    setCalcPrice(val);
                    setCalcRate(100);
                  }}
                  className="w-full pl-4 pr-16 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white text-lg focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  VNĐ
                </span>
              </div>

              {/* Mức chọn nhanh */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: '20.000 đ', val: 20000 },
                  { label: '50.000 đ', val: 50000 },
                  { label: '100.000 đ', val: 100000 },
                  { label: '200.000 đ', val: 200000 },
                  { label: '500.000 đ', val: 500000 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      setCalcPrice(item.val);
                      setCalcRate(100);
                    }}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${
                      totalCommission === item.val
                        ? 'border-shopee-500 bg-shopee-50 text-shopee-600 dark:bg-shopee-950/50 dark:text-shopee-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-800/40 text-xs text-orange-900 dark:text-orange-200 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-shopee-600 dark:text-shopee-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quy tắc hoàn tiền công bằng & chính xác 100%:</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                Mỗi sản phẩm trên Shopee có mức tiền hoa hồng khác nhau tùy theo chương trình của Người Bán. Khi đơn hàng hoàn tất, bạn sẽ nhận được đúng <strong>60% tổng số tiền hoa hồng thực nhận</strong> được chuyển thẳng vào ví để rút về tài khoản ngân hàng.
              </p>
            </div>
          </div>

          {/* Cột Phải: Phân Bổ Tiền Minh Bạch 60/40 */}
          <div className="md:col-span-6 bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kết Quả Phân Bổ Tiền Thật:
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Hoa hồng Shopee chi trả (100%):</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base">
                  {totalCommission.toLocaleString('vi-VN')} đ
                </span>
              </div>

              {/* Khách nhận 60% */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex justify-between items-center shadow-xs">
                <div>
                  <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                    💰 Tiền Bạn Nhận Về Ví (60%):
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                    Tích lũy rút tiền mặt về thẻ ngân hàng
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  +{Math.round(totalCommission * 0.6).toLocaleString('vi-VN')} đ
                </div>
              </div>

              {/* Admin nhận 40% */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Phí vận hành & duy trì hệ thống (40%):
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {Math.round(totalCommission * 0.4).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center pt-1">
              Hạn mức rút tiền tối thiểu: <strong>50.000 VNĐ</strong> qua VietQR 24/7.
            </div>
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
              Sau khi Shopee đối soát đơn hàng, 60% tiền hoa hồng tự động cộng vào ví của bạn. Đủ 50k là rút thẳng về ngân hàng!
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
            Giải đáp mọi thắc mắc về cơ chế hoàn tiền tiếp thị liên kết Shopee.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Hoàn tiền 60% ở đây là 60% tiền món hàng hay 60% hoa hồng?',
              a: 'Hoàn tiền 60% ở đây là 60% TIỀN HOA HỒNG mà Shopee chi trả cho tài khoản tiếp thị liên kết (Affiliate), KHÔNG PHẢI 60% giá trị của món hàng. Ví dụ đơn 1 triệu có hoa hồng Shopee 100k, bạn sẽ được hoàn 60k vào ví.',
            },
            {
              q: 'Bao nhiêu tiền thì tôi có thể rút về tài khoản ngân hàng?',
              a: 'Hạn mức rút tiền tối thiểu là 50.000 VNĐ. Bạn có thể rút về bất kỳ tài khoản ngân hàng nào tại Việt Nam (MBBank, Vietcombank, Techcombank, VPBank, MoMo,...).',
            },
            {
              q: 'Tôi có được áp mã giảm giá, voucher Shopee khi mua không?',
              a: 'Hoàn toàn được! Bạn vẫn áp mã giảm giá của Shop, mã miễn phí vận chuyển và mã giảm giá Shopee như bình thường mà vẫn được nhận trọn vẹn tiền hoàn.',
            },
            {
              q: 'Sau bao lâu thì tiền hoa hồng được cộng vào ví?',
              a: 'Sau khi bạn nhận hàng thành công và không phát sinh đổi trả/hủy đơn, Shopee sẽ đối soát định kỳ và hệ thống sẽ tự động cập nhật cộng tiền vào ví cho bạn.',
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

    </div>
  );
}
