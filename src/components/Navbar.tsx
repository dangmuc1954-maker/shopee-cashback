'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ShoppingBag, 
  Wallet, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { UserSession } from '@/types';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, [pathname]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-shopee flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Shopee<span className="text-shopee-500">Cashback</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-shopee-100 text-shopee-600 dark:bg-shopee-900/40 dark:text-shopee-400">
                  Hoàn Tiền
                </span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Hoàn tiền mua sắm tự động
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-shopee-500 ${
                pathname === '/' ? 'text-shopee-500 font-semibold' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Chuyển Đổi Link
            </Link>
            <Link 
              href="/#cach-hoat-dong" 
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-shopee-500 transition-colors"
            >
              Cách Hoạt Động
            </Link>
            <Link 
              href="/#bang-tinh" 
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-shopee-500 transition-colors"
            >
              Bảng Tính Hoa Hồng
            </Link>
            <Link 
              href="/#faq" 
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-shopee-500 transition-colors"
            >
              Hỏi Đáp
            </Link>
          </nav>

          {/* Desktop Auth / User Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Balance Badge */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 hover:border-shopee-400 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-shopee-500 text-white flex items-center justify-center shadow-xs">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 leading-none">
                      Ví của bạn
                    </span>
                    <span className="text-xs font-bold text-shopee-600 dark:text-shopee-400 group-hover:text-shopee-500">
                      {user.balance.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </Link>

                {/* Dashboard Button */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{user.fullname || user.phone}</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-shopee-500 dark:hover:text-shopee-400 transition-colors"
                >
                  Đăng Nhập
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl gradient-shopee shadow-sm hover:opacity-95 hover:shadow-md transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Đăng Ký Nhận Tiền Hoàn</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-slate-800 border border-orange-200 text-xs font-bold text-shopee-600"
              >
                <Wallet className="w-3 h-3" />
                {user.balance.toLocaleString('vi-VN')}đ
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Chuyển Đổi Link
          </Link>
          <Link
            href="/#cach-hoat-dong"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cách Hoạt Động
          </Link>
          <Link
            href="/#bang-tinh"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Bảng Tính Tiền Hoàn
          </Link>

          {user ? (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-orange-50 dark:bg-slate-800 font-semibold text-shopee-600"
              >
                <span>Ví Của Tôi:</span>
                <span>{user.balance.toLocaleString('vi-VN')} VNĐ</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 text-rose-600 font-medium"
              >
                Đăng Xuất
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
              >
                Đăng Nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold rounded-xl text-white gradient-shopee"
              >
                Đăng Ký Nhận Tiền Hoàn
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
