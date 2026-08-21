'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ShieldCheck, Lock, Phone, KeyRound, ArrowRight, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('0395957039');
  const [fullname, setFullname] = useState('Admin Tris');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCodeHint, setOtpCodeHint] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRequestOtp = async () => {
    if (!phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại quản trị!');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch('/api/admin/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        if (data.code) {
          setOtpCodeHint(data.code);
        }
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Lỗi gửi mã xác thực!');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password || !otp) {
      toast.error('Vui lòng nhập đầy đủ Số điện thoại, Mật khẩu và Mã OTP!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, otp, fullname }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        router.push('/admin');
        router.refresh();
      } else {
        toast.error(data.message || 'Lỗi kích hoạt quyền Admin!');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-indigo-200 dark:border-indigo-950 shadow-2xl relative overflow-hidden">
        
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-shopee-500" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Kích Hoạt Tài Khoản Admin
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bảo mật tối cao: Chỉ duy nhất SĐT <strong className="text-indigo-600 dark:text-indigo-400">0395957039</strong> mới có quyền duyệt tạo Admin!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegisterAdmin} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tên Quản Trị Viên:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Tên Admin"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Số Điện Thoại Được Ủy Quyền:
            </label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0395957039"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={sendingOtp}
                className="px-3.5 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 shrink-0 transition-colors disabled:opacity-50"
              >
                {sendingOtp ? 'Đang gửi...' : 'Gửi Mã OTP'}
              </button>
            </div>
          </div>

          {/* Hộp gợi ý OTP khi test */}
          {otpCodeHint && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span>Mã xác thực vừa cấp: <strong>{otpCodeHint}</strong></span>
              <button
                type="button"
                onClick={() => setOtp(otpCodeHint)}
                className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 text-[11px]"
              >
                Tự điền
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Mã Duyệt Xác Thực OTP (6 số):
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Nhập mã OTP 6 số"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono tracking-widest font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Mật Khẩu Quản Trị Viên:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu Admin"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Xác Thực & Kích Hoạt Admin</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Đã có tài khoản Admin?{' '}
          <Link href="/admin/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Đăng nhập Admin
          </Link>
        </div>

      </div>
    </div>
  );
}
