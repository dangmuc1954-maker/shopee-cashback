'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Lock, Phone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Vui lòng nhập đầy đủ số điện thoại và mật khẩu!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đăng nhập thành công!');
        if (data.user?.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        toast.error(data.message || 'Số điện thoại hoặc mật khẩu không chính xác!');
      }
    } catch (err) {
      toast.error('Không thể kết nối đến máy chủ, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl gradient-shopee text-white flex items-center justify-center mx-auto shadow-md">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Đăng Nhập Khách Hàng
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Truy cập ví tiền và theo dõi số dư tiền hoàn của bạn
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Số Điện Thoại:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại (ví dụ: 0987654321)"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-shopee-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Mật Khẩu:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-shopee-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl gradient-shopee text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Đăng Nhập Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-bold text-shopee-600 dark:text-shopee-400 hover:underline">
            Đăng ký nhận tiền hoàn ngay
          </Link>
        </div>

      </div>
    </div>
  );
}
