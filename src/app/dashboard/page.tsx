'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wallet, 
  ArrowDownCircle, 
  Clock, 
  CheckCircle2, 
  ShoppingBag, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Plus, 
  AlertCircle, 
  Building2, 
  CreditCard, 
  User as UserIcon,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { VIETNAM_BANKS } from '@/lib/banks';
import { UserSession, CashbackOrderItem, WithdrawalItem, ConvertedLinkItem } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [orders, setOrders] = useState<CashbackOrderItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [links, setLinks] = useState<ConvertedLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'withdrawals' | 'links'>('orders');

  // Modal Rút tiền
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | string>(50000);
  const [selectedBank, setSelectedBank] = useState('MB');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Check user
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (!userData.success || !userData.user) {
        router.push('/login');
        return;
      }
      setUser(userData.user);

      // 2. Load orders
      const ordersRes = await fetch('/api/user/orders');
      const ordersData = await ordersRes.json();
      if (ordersData.success) setOrders(ordersData.orders || []);

      // 3. Load withdrawals
      const withRes = await fetch('/api/user/withdraw');
      const withData = await withRes.json();
      if (withData.success) setWithdrawals(withData.withdrawals || []);

      // 4. Load links
      const linksRes = await fetch('/api/user/links');
      const linksData = await linksRes.json();
      if (linksData.success) setLinks(linksData.links || []);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu bảng điều khiển!');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);

    if (!amount || amount < 50000) {
      toast.error('Số tiền rút tối thiểu là 50.000 VNĐ!');
      return;
    }

    if (!user || user.balance < amount) {
      toast.error('Số dư khả dụng trong ví không đủ để rút!');
      return;
    }

    if (!bankAccountNo.trim() || !bankAccountName.trim()) {
      toast.error('Vui lòng điền đầy đủ số tài khoản và tên chủ tài khoản!');
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          bankName: selectedBank,
          bankAccountNo,
          bankAccountName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowWithdrawModal(false);
        loadDashboardData();
      } else {
        toast.error(data.message || 'Lỗi khi gửi yêu cầu rút tiền');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setWithdrawing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép liên kết!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-shopee-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-slate-500">Đang tải bảng điều khiển...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* 1. GREETING & QUICK ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Xin chào, {user.fullname || user.phone}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chào mừng bạn đến với trung tâm quản lý hoàn tiền Shopee Affiliate 60%.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-shopee text-white font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Link Hoàn Tiền Mới</span>
          </Link>
          <button
            onClick={loadDashboardData}
            title="Làm mới dữ liệu"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS (VÍ TIỀN) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Card 1: Số dư khả dụng */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Số Dư Khả Dụng (Rút Được)
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {user.balance.toLocaleString('vi-VN')} đ
            </div>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Yêu Cầu Rút Tiền</span>
          </button>
        </div>

        {/* Card 2: Chờ đối soát */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chờ Shopee Đối Soát
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {user.pendingBalance.toLocaleString('vi-VN')} đ
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Sẽ được cộng vào số dư sau khi Shopee hoàn tất duyệt đơn hàng không hoàn trả.
          </p>
        </div>

        {/* Card 3: Tổng tiền đã rút */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Tiền Đã Rút Thành Công
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {user.totalWithdrawn.toLocaleString('vi-VN')} đ
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Tổng số tiền hoa hồng 60% bạn đã nhận về tài khoản ngân hàng.
          </p>
        </div>

      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-shopee-500 text-shopee-600 dark:text-shopee-400 bg-shopee-50/30 dark:bg-shopee-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đơn Hàng Hoàn Tiền ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'withdrawals'
                ? 'border-shopee-500 text-shopee-600 dark:text-shopee-400 bg-shopee-50/30 dark:bg-shopee-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Lịch Sử Rút Tiền ({withdrawals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'links'
                ? 'border-shopee-500 text-shopee-600 dark:text-shopee-400 bg-shopee-50/30 dark:bg-shopee-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Link Đã Chuyển Đổi ({links.length})</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="p-6">
          
          {/* TAB 1: ĐƠN HÀNG */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Chưa có đơn hàng nào được ghi nhận
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Hãy tạo link Shopee Affiliate ở trang chủ và hoàn tất mua hàng để nhận 60% tiền hoàn nhé!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4 rounded-l-xl">Mã Đơn Shopee</th>
                        <th className="py-3 px-4">Sản Phẩm</th>
                        <th className="py-3 px-4 text-right">Tổng Đơn</th>
                        <th className="py-3 px-4 text-right">Hoa Hồng Shopee</th>
                        <th className="py-3 px-4 text-right">Tiền Bạn Nhận (60%)</th>
                        <th className="py-3 px-4 text-center rounded-r-xl">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {ord.orderSn}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                            {ord.itemName || 'Sản phẩm Shopee'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                            {ord.totalAmount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500">
                            {ord.shopeeCommission.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            +{ord.userCashback.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-center">
                            {ord.status === 'APPROVED' && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold">
                                Đã Cộng Ví
                              </span>
                            )}
                            {ord.status === 'PENDING' && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[11px] font-bold">
                                Chờ Đối Soát
                              </span>
                            )}
                            {ord.status === 'REJECTED' && (
                              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[11px] font-bold">
                                Đã Hủy
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LỊCH SỬ RÚT TIỀN */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              {withdrawals.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <ArrowDownCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Chưa có yêu cầu rút tiền nào
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Khi số dư khả dụng đạt từ 50.000 VNĐ, bạn có thể tạo lệnh rút tiền về tài khoản ngân hàng.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4 rounded-l-xl">Ngày Tạo</th>
                        <th className="py-3 px-4 text-right">Số Tiền Rút</th>
                        <th className="py-3 px-4">Ngân Hàng</th>
                        <th className="py-3 px-4">Số Tài Khoản</th>
                        <th className="py-3 px-4">Chủ Tài Khoản</th>
                        <th className="py-3 px-4 text-center rounded-r-xl">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(w.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                            {w.amount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            {w.bankName}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {w.bankAccountNo}
                          </td>
                          <td className="py-3 px-4 uppercase text-slate-700 dark:text-slate-300">
                            {w.bankAccountName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {w.status === 'PAID' && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold">
                                Đã Chuyển Tiền
                              </span>
                            )}
                            {w.status === 'PENDING' && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[11px] font-bold">
                                Đang Xử Lý
                              </span>
                            )}
                            {w.status === 'REJECTED' && (
                              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[11px] font-bold">
                                Bị Từ Chối
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LINK ĐÃ CHUYỂN ĐỔI */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              {links.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <LinkIcon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Chưa có link chuyển đổi nào
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4 rounded-l-xl">Mã Sub_ID</th>
                        <th className="py-3 px-4">Link Hoàn Tiền (Affiliate)</th>
                        <th className="py-3 px-4">Ngày Tạo</th>
                        <th className="py-3 px-4 text-center rounded-r-xl">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {links.map((lnk) => (
                        <tr key={lnk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-shopee-600">
                            {lnk.subId}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-[280px] truncate font-mono">
                            {lnk.affiliateUrl}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(lnk.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => copyToClipboard(lnk.affiliateUrl, lnk.id)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-shopee-400 text-xs font-bold inline-flex items-center gap-1"
                            >
                              {copiedId === lnk.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === lnk.id ? 'Đã Chép' : 'Sao Chép'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODAL RÚT TIỀN */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Rút Tiền Về Ngân Hàng
                  </h3>
                  <p className="text-xs text-slate-500">
                    Số dư khả dụng: <strong>{user.balance.toLocaleString('vi-VN')} đ</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              
              {/* Chọn Ngân Hàng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Ngân Hàng Nhận Tiền:
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.id} value={b.shortName}>
                      {b.shortName} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Số Tài Khoản */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Số Tài Khoản:
                </label>
                <input
                  type="text"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="Nhập số tài khoản ngân hàng"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                />
              </div>

              {/* Tên Chủ Tài Khoản */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tên Chủ Tài Khoản (Không dấu):
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: NGUYEN VAN A"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm uppercase focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                />
              </div>

              {/* Số Tiền Rút */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Số Tiền Muốn Rút (Tối thiểu 50.000 VNĐ):
                </label>
                <input
                  type="number"
                  min={50000}
                  step={10000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="50000"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                />

                {/* Preset buttons */}
                <div className="flex gap-2 mt-2">
                  {[50000, 100000, 200000, 500000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWithdrawAmount(preset)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    >
                      {preset / 1000}k
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(Math.floor(user.balance))}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    Tất cả
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={withdrawing}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {withdrawing ? 'Đang gửi...' : 'Xác Nhận Rút'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
