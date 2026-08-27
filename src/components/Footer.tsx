import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Shield, Heart, Sparkles, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl gradient-shopee flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Shopee<span className="text-shopee-500">Cashback</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Nền tảng hoàn tiền mua sắm Shopee tự động số 1 Việt Nam. Tự động tích lũy tiền hoàn vào ví và rút trực tiếp về tài khoản ngân hàng của bạn.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Khám Phá
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-shopee-400 transition-colors">
                  Công Cụ Chuyển Đổi Link
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-shopee-400 transition-colors">
                  Ví Tiền & Đơn Hàng Của Tôi
                </Link>
              </li>
              <li>
                <Link href="/#cach-hoat-dong" className="hover:text-shopee-400 transition-colors">
                  Hướng Dẫn Mua Hàng Hoàn Tiền
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-shopee-400 transition-colors">
                  Câu Hỏi Thường Gặp (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Cam kết */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Cam Kết Uy Tín
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Hoàn tiền tự động & minh bạch</span>
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Rút tiền nhanh từ 50.000 VNĐ</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Bảo mật dữ liệu tuyệt đối</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ShopeeCashback. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for smart shoppers
          </p>
        </div>
      </div>
    </footer>
  );
}
