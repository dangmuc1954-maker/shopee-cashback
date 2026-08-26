'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  TrendingUp, 
  Wallet, 
  Users, 
  ArrowDownCircle, 
  Upload, 
  FileSpreadsheet, 
  ShoppingBag, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  QrCode, 
  ExternalLink,
  Edit2,
  Save,
  Check,
  Download,
  Plus,
  Trash2,
  Link as LinkIcon,
  Filter,
  Eye,
  AlertCircle,
  Copy,
  LayoutDashboard,
  Clock,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { generateVietQrUrl } from '@/lib/vietqr';
import { CashbackOrderItem, WithdrawalItem, UserSession, ConvertedLinkItem } from '@/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<UserSession | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'links' | 'withdrawals' | 'users' | 'import' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Data lists
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [orders, setOrders] = useState<CashbackOrderItem[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [linksList, setLinksList] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    shopeeAffId: '17352020564',
    shopeeAppId: '',
    shopeeAppSecret: '',
    commissionUserPercent: 60,
    commissionAdminPercent: 40,
    minWithdrawAmount: 50000,
    announcement: '',
  });

  // Excel Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // VietQR Modal for paying
  const [payingWithdrawal, setPayingWithdrawal] = useState<WithdrawalItem | null>(null);
  const [processingPayout, setProcessingPayout] = useState(false);

  // Reject Withdrawal Modal
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<WithdrawalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Thông tin tài khoản ngân hàng không chính xác');

  // Search & Filter queries
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [linkSearch, setLinkSearch] = useState('');
  const [linkTypeFilter, setLinkTypeFilter] = useState('ALL');

  // Add Manual Order Modal
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [manualOrder, setManualOrder] = useState({
    orderSn: '',
    subId: '',
    itemName: '',
    totalAmount: 500000,
    shopeeCommission: 50000,
    status: 'APPROVED',
  });
  const [addingOrder, setAddingOrder] = useState(false);

  // Editing User Balance Modal
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newBalance, setNewBalance] = useState('');

  // Backup / Restore state
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [syncingShopee, setSyncingShopee] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Auto-refresh interval (every 15s if enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      loadAllAdminData(false);
    }, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const loadAllAdminData = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    try {
      // Check admin auth
      const meRes = await fetch('/api/admin/me');
      const meData = await meRes.json();
      if (!meData.success || !meData.admin) {
        router.push('/admin/login');
        return;
      }
      setAdminUser(meData.admin);

      // Load Stats
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Load Withdrawals
      const withRes = await fetch('/api/admin/withdrawals');
      const withData = await withRes.json();
      if (withData.success) setWithdrawals(withData.withdrawals || []);

      // Load Orders
      const ordRes = await fetch('/api/admin/orders');
      const ordData = await ordRes.json();
      if (ordData.success) setOrders(ordData.orders || []);

      // Load Users
      const usrRes = await fetch('/api/admin/users');
      const usrData = await usrRes.json();
      if (usrData.success) setUsersList(usrData.users || []);

      // Load Links
      const lnkRes = await fetch('/api/admin/links');
      const lnkData = await lnkRes.json();
      if (lnkData.success) setLinksList(lnkData.links || []);

      // Load Settings
      const setRes = await fetch('/api/admin/settings');
      const setData = await setRes.json();
      if (setData.success && setData.settings) setSettings(setData.settings);
    } catch (err) {
      console.error(err);
      if (showLoadingState) toast.error('Lỗi khi tải dữ liệu trang quản trị!');
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  // 1. Handle Import Excel
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Vui lòng chọn file Excel báo cáo Shopee!');
      return;
    }

    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch('/api/admin/import-report', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setImportResult(data.data);
        setImportFile(null);
        loadAllAdminData();
      } else {
        toast.error(data.message || 'Lỗi khi xử lý file Excel');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setImporting(false);
    }
  };

  // Download Sample Excel Template
  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        'Mã đơn hàng': '240821ABCDE1234',
        'Mã phụ': linksList[0]?.subId || 'GUEST_demo123',
        'Tên sản phẩm': 'Tai Nghe Không Dây Bluetooth TWS Cao Cấp',
        'Tổng giá trị': 450000,
        'Hoa hồng thực nhận': 45000,
        'Trạng thái': 'Đã hoàn thành',
      },
      {
        'Mã đơn hàng': '240821XYZ987654',
        'Mã phụ': linksList[1]?.subId || 'GUEST_demo456',
        'Tên sản phẩm': 'Áo Thun Nam Cotton Thoáng Khí Cao Cấp',
        'Tổng giá trị': 250000,
        'Hoa hồng thực nhận': 30000,
        'Trạng thái': 'Đã hoàn thành',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bao_Cao_Shopee');
    XLSX.writeFile(wb, 'Mau_Bao_Cao_Shopee_Affiliate.xlsx');
    toast.success('Đã tải xuống file Excel mẫu Shopee!');
  };

  // 2. Handle Payout / Approve Withdrawal
  const handleConfirmPayout = async (withdrawalId: string, status: 'PAID' | 'REJECTED', note?: string) => {
    setProcessingPayout(true);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          status,
          adminNote: note || (status === 'PAID' ? 'Đã quét VietQR chuyển khoản thành công' : 'Từ chối yêu cầu rút tiền'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setPayingWithdrawal(null);
        setRejectingWithdrawal(null);
        loadAllAdminData();
      } else {
        toast.error(data.message || 'Lỗi xử lý yêu cầu rút tiền');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setProcessingPayout(false);
    }
  };

  // 3. Handle Add Manual Order
  const handleAddManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrder.orderSn.trim()) {
      toast.error('Vui lòng nhập mã đơn hàng Shopee!');
      return;
    }

    setAddingOrder(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualOrder),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Thêm đơn hàng thành công! Đã chia hoa hồng 60% cho khách.');
        setShowAddOrderModal(false);
        setManualOrder({
          orderSn: '',
          subId: '',
          itemName: '',
          totalAmount: 500000,
          shopeeCommission: 50000,
          status: 'APPROVED',
        });
        loadAllAdminData();
      } else {
        toast.error(data.message || 'Lỗi thêm đơn');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setAddingOrder(false);
    }
  };

  // Handle Sync Orders from Shopee Open API
  const handleSyncShopee = async () => {
    setSyncingShopee(true);
    try {
      const res = await fetch('/api/admin/sync-shopee', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        loadAllAdminData();
      } else {
        toast.error(data.message || 'Lỗi đồng bộ');
        if (!settings.shopeeAppId || !settings.shopeeAppSecret) {
          setActiveTab('settings');
        }
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setSyncingShopee(false);
    }
  };

  // Quick Open Add Order from a SubID
  const handleQuickAddOrderFromSubId = (subId: string, originalUrl?: string) => {
    setManualOrder({
      orderSn: 'SP' + Math.random().toString().slice(2, 10),
      subId: subId,
      itemName: originalUrl ? 'Sản phẩm ' + originalUrl.slice(0, 30) + '...' : 'Đơn hàng Shopee',
      totalAmount: 500000,
      shopeeCommission: 50000,
      status: 'APPROVED',
    });
    setShowAddOrderModal(true);
  };

  // 4. Handle Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        loadAllAdminData();
      } else {
        toast.error(data.message || 'Lỗi cập nhật');
      }
    } catch (err) {
      toast.error('Lỗi kết nối');
    }
  };

  // 5. Handle Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa đơn hàng!');
        loadAllAdminData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Lỗi kết nối');
    }
  };

  // 6. Handle Delete Link
  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Bạn có chắc muốn xóa link chuyển đổi này?')) return;
    try {
      const res = await fetch(`/api/admin/links?id=${linkId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa link thành công!');
        loadAllAdminData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Lỗi kết nối');
    }
  };

  // 7. Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã lưu cấu hình hệ thống thành công!');
        setSettings(data.settings);
      } else {
        toast.error(data.message || 'Lỗi lưu cấu hình');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    }
  };

  // 8. Handle Edit User Balance
  const handleUpdateUserBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          balance: Number(newBalance),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã cập nhật số dư cho người dùng!');
        setEditingUser(null);
        loadAllAdminData();
      } else {
        toast.error(data.message || 'Lỗi cập nhật');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    }
  };

  // 9. Handle Export Backup JSON
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup');
      const data = await res.json();
      if (data.success) {
        const jsonStr = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ShopeeCashback_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Đã tải xuống file sao lưu hệ thống!');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Lỗi xuất dữ liệu sao lưu');
    }
  };

  // 10. Handle Restore Backup JSON
  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Bạn có chắc muốn khôi phục dữ liệu từ file sao lưu này? Dữ liệu hiện tại sẽ được cập nhật.')) {
      e.target.value = '';
      return;
    }

    setRestoringBackup(true);
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: jsonData }),
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success('Khôi phục dữ liệu thành công!');
        loadAllAdminData();
      } else {
        toast.error(resData.message || 'Lỗi khôi phục');
      }
    } catch (err) {
      toast.error('File sao lưu không hợp lệ!');
    } finally {
      setRestoringBackup(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-shopee-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Đang tải trung tâm quản trị Shopee Cashback...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. ADMIN TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-shopee-600 to-amber-500 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Quản Trị Shopee Cashback
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-300">
                Live
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Admin: <strong>{adminUser?.fullname || adminUser?.phone}</strong> (SĐT Quản Trị: <strong>0395957039</strong>) • ID Shopee: <strong className="font-mono text-shopee-600">{settings.shopeeAffId}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Thêm Đơn Nhanh */}
          <button
            onClick={() => setShowAddOrderModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-shopee-500 hover:bg-shopee-600 text-white text-xs font-bold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Đơn Nhanh</span>
          </button>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => {
              setAutoRefresh(!autoRefresh);
              toast.info(!autoRefresh ? 'Đã bật tự động làm mới mỗi 15s' : 'Đã tắt tự động làm mới');
            }}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
              autoRefresh 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400' 
                : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:text-slate-300'
            }`}
            title="Tự động cập nhật dữ liệu liên tục"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Auto: {autoRefresh ? 'BẬT (15s)' : 'TẮT'}</span>
          </button>

          {/* Làm Mới */}
          <button
            onClick={() => {
              loadAllAdminData();
              toast.success('Đã làm mới dữ liệu mới nhất!');
            }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            title="Làm mới ngay"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Đăng Xuất */}
          <button
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' });
              router.push('/admin/login');
            }}
            className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            Đăng Xuất
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: Tổng Doanh Thu Mua Hàng */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tổng Giá Trị Mua Hàng
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {(stats.totalOrderAmount || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Từ {stats.totalOrdersCount} đơn hàng ghi nhận
            </div>
          </div>

          {/* Card 2: Tổng Hoa Hồng Shopee (100%) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Hoa Hồng Shopee (100%)
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {(stats.totalShopeeCommission || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Doanh thu đối tác Shopee
            </div>
          </div>

          {/* Card 3: Tiền Đã Hoàn Cho Khách (60%) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Hoàn Cho Khách ({settings.commissionUserPercent}%)
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {(stats.totalUserCashback || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              Tích lũy vào ví khách
            </div>
          </div>

          {/* Card 4: Lợi Nhuận Của Bạn (40%) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Lợi Nhuận Của Bạn ({settings.commissionAdminPercent}%)
            </div>
            <div className="text-xl sm:text-2xl font-black text-shopee-500">
              {(stats.totalAdminProfit || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-shopee-500 font-semibold">
              Lợi nhuận ròng thực nhận
            </div>
          </div>

        </div>
      )}

      {/* 3. TABS NAVIGATION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'border-shopee-500 text-shopee-600 dark:text-shopee-400 bg-shopee-50/40 dark:bg-shopee-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>⚡ Tổng Quan &amp; Theo Dõi Nhanh</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'orders'
                ? 'border-shopee-500 text-shopee-600 dark:text-shopee-400 bg-shopee-50/40 dark:bg-shopee-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>📦 Quản Lý Đơn Hàng ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`flex items-center gap-2 px-5 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'links'
                ? 'border-shopee-500 text-shopee-600 dark:text-shopee-400 bg-shopee-50/40 dark:bg-shopee-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>🔗 Link Đã Tạo ({linksList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 px-5 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'withdrawals'
                ? 'border-shopee-500 text-shopee-600 dark:text-shopee-400 bg-shopee-50/40 dark:bg-shopee-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>
              💳 Duyệt Rút Tiền ({withdrawals.filter((w) => w.status === 'PENDING').length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'border-shopee-500 text-shopee-600 dark:text-shopee-400 bg-shopee-50/40 dark:bg-shopee-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Khách Hàng ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-5 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'import'
                ? 'border-shopee-500 text-shopee-600 dark:text-shopee-400 bg-shopee-50/40 dark:bg-shopee-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📥 Đối Soát Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'border-shopee-500 text-shopee-600 dark:text-shopee-400 bg-shopee-50/40 dark:bg-shopee-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>⚙️ Cài Đặt &amp; Sao Lưu</span>
          </button>

        </div>

        {/* TAB CONTENTS */}
        <div className="p-6">
          
          {/* ========================================================================= */}
          {/* TAB 0: TỔNG QUAN & THEO DÕI NHANH (MẶC ĐỊNH) */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* Quick Actions Panel */}
              <div className="bg-linear-to-r from-shopee-50 to-amber-50 dark:from-slate-800 dark:to-slate-800/60 p-5 rounded-2xl border border-shopee-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>⚡ Thao Tác Quản Trị Nhanh</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Thêm đơn hàng tức thì hoặc tải file Excel từ Shopee Affiliate để đối soát tự động.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleSyncShopee}
                    disabled={syncingShopee}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingShopee ? 'animate-spin' : ''}`} />
                    <span>{syncingShopee ? 'Đang đồng bộ...' : '⚡ Đồng Bộ Đơn Shopee (API)'}</span>
                  </button>

                  <button
                    onClick={() => setShowAddOrderModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-shopee-500 hover:bg-shopee-600 text-white text-xs font-bold shadow-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm Đơn Hàng Nhanh</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('import')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Đối Soát File Excel</span>
                  </button>

                  <button
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold transition-colors"
                  >
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span>Sao Lưu Dữ Liệu</span>
                  </button>
                </div>
              </div>

              {/* 2 Cột: Link Mới Nhất & Đơn Hàng Mới Nhất */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. TOP 5 LINK VỪA TẠO */}
                <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-shopee-500" />
                      <span>Link Vừa Tạo Gần Nhất</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('links')}
                      className="text-xs font-bold text-shopee-600 hover:text-shopee-700 flex items-center gap-0.5"
                    >
                      <span>Xem tất cả ({linksList.length})</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {linksList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic">
                      Chưa có link nào được tạo trên hệ thống.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {linksList.slice(0, 5).map((l) => (
                        <div key={l.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-shopee-600 bg-shopee-50 dark:bg-shopee-950/40 px-2 py-0.5 rounded-md">
                                {l.subId}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(l.createdAt).toLocaleTimeString('vi-VN')} {new Date(l.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[280px] font-mono">
                              {l.originalUrl}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Người tạo: <strong>{l.user ? (l.user.fullname || l.user.phone) : 'Khách vãng lai'}</strong> • Clicks: <strong>{l.clicks || 0}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(l.subId);
                                toast.success(`Đã sao chép mã Sub_ID: ${l.subId}`);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs"
                              title="Sao chép Sub_ID"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleQuickAddOrderFromSubId(l.subId, l.originalUrl)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200"
                              title="Tạo đơn hàng đối soát cho Sub_ID này"
                            >
                              + Đơn
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. TOP 5 ĐƠN HÀNG GẦN NHẤT */}
                <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      <span>Đơn Hàng Gần Nhất</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-shopee-600 hover:text-shopee-700 flex items-center gap-0.5"
                    >
                      <span>Xem tất cả ({orders.length})</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic">
                      Chưa có đơn hàng nào. Hãy bấm <strong>+ Thêm Đơn Hàng Nhanh</strong> hoặc nhập file Excel!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {orders.slice(0, 5).map((o) => (
                        <div key={o.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                {o.orderSn}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                o.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : o.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {o.status === 'APPROVED' ? 'Đã duyệt' : o.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[280px]">
                              {o.itemName || 'Sản phẩm Shopee'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Sub_ID: <strong className="font-mono text-shopee-600">{o.subId}</strong> • Khách: <strong>{o.user ? (o.user.fullname || o.user.phone) : 'Khách vãng lai'}</strong>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-black text-emerald-600">
                              +{(o.userCashback || 0).toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Hoa hồng: {(o.shopeeCommission || 0).toLocaleString('vi-VN')} đ
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: QUẢN LÝ ĐƠN HÀNG */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Danh Sách Toàn Bộ Đơn Hàng ({orders.length})
                  </h3>
                  <button
                    onClick={() => setShowAddOrderModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-shopee-500 hover:bg-shopee-600 text-white text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Đơn Nhanh</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status filter */}
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-bold"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="APPROVED">Đã duyệt (Cộng tiền)</option>
                    <option value="PENDING">Chờ đối soát</option>
                    <option value="REJECTED">Từ chối</option>
                  </select>

                  {/* Search */}
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Tìm mã đơn, Sub_ID..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Mã Đơn Shopee</th>
                      <th className="py-3 px-4">Sub_ID</th>
                      <th className="py-3 px-4">Khách Hàng</th>
                      <th className="py-3 px-4">Sản Phẩm</th>
                      <th className="py-3 px-4 text-right">Hoa Hồng Shopee</th>
                      <th className="py-3 px-4 text-right">Hoàn Cho Khách ({settings.commissionUserPercent}%)</th>
                      <th className="py-3 px-4 text-right">Lợi Nhuận Bạn ({settings.commissionAdminPercent}%)</th>
                      <th className="py-3 px-4 text-center">Trạng Thái</th>
                      <th className="py-3 px-4 text-center rounded-r-xl">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {orders
                      .filter((o) => {
                        if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) return false;
                        if (!orderSearch) return true;
                        const q = orderSearch.toLowerCase();
                        return (
                          o.orderSn.toLowerCase().includes(q) ||
                          o.subId.toLowerCase().includes(q) ||
                          (o.itemName && o.itemName.toLowerCase().includes(q))
                        );
                      })
                      .map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {o.orderSn}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-shopee-600">
                            {o.subId}
                          </td>
                          <td className="py-3 px-4">
                            {o.user ? (
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {o.user.fullname || o.user.phone}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa khớp khách</span>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-[180px] truncate text-slate-600 dark:text-slate-300" title={o.itemName || ''}>
                            {o.itemName || 'Sản phẩm Shopee'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                            {(o.shopeeCommission || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600">
                            {(o.userCashback || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-shopee-500">
                            {(o.adminProfit || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              o.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : o.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              {o.status === 'APPROVED' ? 'Đã duyệt' : o.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {o.status !== 'APPROVED' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, 'APPROVED')}
                                  className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold"
                                  title="Duyệt đơn & cộng tiền vào ví"
                                >
                                  Duyệt
                                </button>
                              )}
                              {o.status !== 'REJECTED' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, 'REJECTED')}
                                  className="px-2 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold"
                                  title="Từ chối đơn"
                                >
                                  Hủy
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteOrder(o.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                                title="Xóa đơn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: QUẢN LÝ LINK ĐÃ TẠO */}
          {/* ========================================================================= */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Toàn Bộ Link Đã Tạo Trên Web ({linksList.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tất cả link được người dùng hoặc khách tạo đều lưu mã Sub_ID tại đây.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={linkTypeFilter}
                    onChange={(e) => setLinkTypeFilter(e.target.value)}
                    className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-bold"
                  >
                    <option value="ALL">Tất cả link</option>
                    <option value="USER">Link của thành viên</option>
                    <option value="GUEST">Link của khách vãng lai</option>
                  </select>

                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={linkSearch}
                      onChange={(e) => setLinkSearch(e.target.value)}
                      placeholder="Tìm theo Sub_ID, URL..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Mã Sub_ID</th>
                      <th className="py-3 px-4">Người Tạo</th>
                      <th className="py-3 px-4">Link Sản Phẩm Gốc</th>
                      <th className="py-3 px-4">Link Tiếp Thị Affiliate</th>
                      <th className="py-3 px-4 text-center">Lượt Click</th>
                      <th className="py-3 px-4">Ngày Tạo</th>
                      <th className="py-3 px-4 text-center rounded-r-xl">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {linksList
                      .filter((l) => {
                        if (linkTypeFilter === 'USER' && !l.userId) return false;
                        if (linkTypeFilter === 'GUEST' && l.userId) return false;
                        if (!linkSearch) return true;
                        const q = linkSearch.toLowerCase();
                        return (
                          l.subId.toLowerCase().includes(q) ||
                          l.originalUrl.toLowerCase().includes(q) ||
                          (l.user?.phone && l.user.phone.includes(q))
                        );
                      })
                      .map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-shopee-600 bg-shopee-50 dark:bg-shopee-950/40 px-2 py-1 rounded-md">
                              {l.subId}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {l.user ? (
                              <span className="font-bold text-indigo-600">
                                {l.user.fullname || l.user.phone}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Khách vãng lai</span>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-[200px] truncate text-slate-500 font-mono" title={l.originalUrl}>
                            {l.originalUrl}
                          </td>
                          <td className="py-3 px-4 max-w-[200px] truncate text-indigo-600 font-mono" title={l.affiliateUrl}>
                            {l.affiliateUrl}
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
                              {l.clicks || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                            {new Date(l.createdAt).toLocaleTimeString('vi-VN')} {new Date(l.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(l.subId);
                                  toast.success(`Đã chép mã Sub_ID: ${l.subId}`);
                                }}
                                className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                                title="Sao chép Sub_ID"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleQuickAddOrderFromSubId(l.subId, l.originalUrl)}
                                className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px]"
                                title="Tạo đơn hàng cho link này"
                              >
                                + Đơn
                              </button>
                              <button
                                onClick={() => handleDeleteLink(l.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                                title="Xóa link"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DUYỆT RÚT TIỀN VIETQR */}
          {/* ========================================================================= */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Danh Sách Yêu Cầu Rút Tiền ({withdrawals.length})
                </h3>
              </div>

              {withdrawals.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs italic">
                  Chưa có yêu cầu rút tiền nào từ khách hàng.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                      <tr>
                        <th className="py-3 px-4 rounded-l-xl">Khách Hàng</th>
                        <th className="py-3 px-4">Số Điện Thoại</th>
                        <th className="py-3 px-4 text-right">Số Tiền Rút</th>
                        <th className="py-3 px-4">Ngân Hàng</th>
                        <th className="py-3 px-4">Số Tài Khoản</th>
                        <th className="py-3 px-4">Chủ Tài Khoản</th>
                        <th className="py-3 px-4 text-center">Trạng Thái</th>
                        <th className="py-3 px-4 text-center rounded-r-xl">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {w.user?.fullname || w.user?.phone}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                            {w.user?.phone}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">
                            {w.amount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                            {w.bankName}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {w.bankAccountNo}
                          </td>
                          <td className="py-3 px-4 font-bold uppercase text-slate-800 dark:text-slate-200">
                            {w.bankAccountName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              w.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-700'
                                : w.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              {w.status === 'PAID' ? 'Đã chi trả' : w.status === 'PENDING' ? 'Chờ thanh toán' : 'Từ chối'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {w.status === 'PENDING' && (
                              <button
                                onClick={() => setPayingWithdrawal(w)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Quét VietQR Trả Tiền</span>
                              </button>
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

          {/* ========================================================================= */}
          {/* TAB 4: QUẢN LÝ KHÁCH HÀNG */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Danh Sách Khách Hàng Đã Đăng Ký ({usersList.length})
                </h3>
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Tìm theo SĐT, tên..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Khách Hàng</th>
                      <th className="py-3 px-4">Số Điện Thoại</th>
                      <th className="py-3 px-4 text-right">Số Dư Khả Dụng</th>
                      <th className="py-3 px-4 text-right">Chờ Đối Soát</th>
                      <th className="py-3 px-4 text-right">Đã Rút</th>
                      <th className="py-3 px-4 text-center">Hoạt Động</th>
                      <th className="py-3 px-4 text-center rounded-r-xl">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {usersList
                      .filter(
                        (u) =>
                          u.phone.includes(userSearch) ||
                          (u.fullname && u.fullname.toLowerCase().includes(userSearch.toLowerCase()))
                      )
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {u.fullname || 'Chưa đặt tên'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">{u.phone}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">
                            {u.balance.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-right text-amber-600 font-bold">
                            {u.pendingBalance.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500">
                            {u.totalWithdrawn.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                              {u._count?.links || 0} links / {u._count?.orders || 0} đơn
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setNewBalance(String(u.balance));
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Sửa Ví Tiền</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ĐỐI SOÁT EXCEL */}
          {/* ========================================================================= */}
          {activeTab === 'import' && (
            <div className="max-w-3xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Nhập Báo Cáo Chuyển Đổi Shopee Affiliate (Excel / CSV)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tải file báo cáo từ <strong>affiliate.shopee.vn</strong> $\rightarrow$ Báo Cáo Chuyển Đổi và dán vào đây để hệ thống tự động cộng {settings.commissionUserPercent}% vào ví khách!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải File Excel Mẫu</span>
                </button>
              </div>

              <form onSubmit={handleImportSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center hover:border-shopee-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-shopee-100 text-shopee-600 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <label className="cursor-pointer text-sm font-bold text-shopee-600 hover:underline">
                      <span>Chọn file Excel báo cáo (.xlsx / .xls / .csv)</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-400 mt-1">
                      {importFile ? `Đã chọn file: ${importFile.name}` : 'Hoặc kéo thả file vào khung này'}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="w-full py-3.5 rounded-2xl bg-shopee-500 hover:bg-shopee-600 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {importing ? (
                    'Đang phân tích & đối soát đơn hàng...'
                  ) : (
                    <>
                      <FileSpreadsheet className="w-5 h-5" />
                      <span>Bắt Đầu Đối Soát &amp; Cộng Tiền Cho Khách</span>
                    </>
                  )}
                </button>
              </form>

              {importResult && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kết Quả Đối Soát:</span>
                  </h4>
                  <p>• Tổng số dòng đọc được: <strong>{importResult.totalRows}</strong></p>
                  <p>• Đơn hàng hợp lệ xử lý: <strong>{importResult.processed}</strong></p>
                  <p>• Tổng hoa hồng Shopee: <strong>{(importResult.totalCommission || 0).toLocaleString('vi-VN')} đ</strong></p>
                  <p>• Tiền hoàn cho khách (60%): <strong>{(importResult.totalUserCashback || 0).toLocaleString('vi-VN')} đ</strong></p>
                  <p>• Lợi nhuận của bạn (40%): <strong>{(importResult.totalAdminProfit || 0).toLocaleString('vi-VN')} đ</strong></p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: CÀI ĐẶT HỆ THỐNG & SAO LƯU */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-8">
              
              {/* Form Cài Đặt */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Cấu Hình Tỷ Lệ Hoa Hồng &amp; Shopee Affiliate ID
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Thiết lập ID tiếp thị liên kết Shopee của bạn và các quy tắc chia sẻ hoa hồng.
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Shopee Affiliate ID Của Bạn:
                    </label>
                    <input
                      type="text"
                      value={settings.shopeeAffId}
                      onChange={(e) => setSettings({ ...settings, shopeeAffId: e.target.value })}
                      placeholder="Ví dụ: 17352020564"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-sm focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      ID này sẽ được tự động gắn vào mọi link sản phẩm khi khách hàng tạo link tiếp thị qua cổng <code>s.shopee.vn/an_redir</code>.
                    </p>
                  </div>

                  {/* Cấu Hình Shopee Open API Kết Nối Tự Động */}
                  <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-orange-900 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Kết Nối Shopee Open API (Tự Động Kéo Đơn Hàng)</span>
                      </h4>
                      <a
                        href="https://affiliate.shopee.vn/open_api/list"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-0.5"
                      >
                        <span>Lấy mã tại Shopee</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Shopee App ID (App Key):
                        </label>
                        <input
                          type="text"
                          value={settings.shopeeAppId || ''}
                          onChange={(e) => setSettings({ ...settings, shopeeAppId: e.target.value })}
                          placeholder="Ví dụ: 17352020564..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Shopee Secret Key:
                        </label>
                        <input
                          type="password"
                          value={settings.shopeeAppSecret || ''}
                          onChange={(e) => setSettings({ ...settings, shopeeAppSecret: e.target.value })}
                          placeholder="Nhập Secret Key từ Shopee..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      💡 Khi điền App ID &amp; Secret Key, bạn có thể bấm nút <strong>"⚡ Đồng Bộ Đơn Shopee"</strong> để hệ thống tự động kéo mọi đơn hàng và cộng tiền hoàn cho khách mà không cần làm gì!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        % Hoàn Cho Khách:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={settings.commissionUserPercent}
                          onChange={(e) => setSettings({ ...settings, commissionUserPercent: Number(e.target.value) })}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-emerald-600 text-sm focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        % Lợi Nhuận Admin Giữ:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={settings.commissionAdminPercent}
                          onChange={(e) => setSettings({ ...settings, commissionAdminPercent: Number(e.target.value) })}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-shopee-500 text-sm focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Hạn Mức Rút Tiền Tối Thiểu (VNĐ):
                    </label>
                    <input
                      type="number"
                      min={10000}
                      step={10000}
                      value={settings.minWithdrawAmount}
                      onChange={(e) => setSettings({ ...settings, minWithdrawAmount: Number(e.target.value) })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-sm focus:ring-2 focus:ring-shopee-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-shopee-500 hover:bg-shopee-600 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Cài Đặt Hệ Thống</span>
                  </button>

                </form>
              </div>

              {/* Khu Vực Sao Lưu & Khôi Phục Dữ Liệu */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span>Sao Lưu &amp; Khôi Phục Dữ Liệu Hệ Thống</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Tải về 1 file lưu trữ toàn bộ dữ liệu (Khách hàng, Link đã tạo, Đơn hàng, Lịch sử rút tiền) để bảo đảm an toàn dữ liệu trọn đời.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>📥 Xuất File Sao Lưu (Backup JSON)</span>
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{restoringBackup ? 'Đang khôi phục...' : '📤 Khôi Phục Từ File JSON'}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreBackup}
                      disabled={restoringBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL: THÊM ĐƠN HÀNG NHANH */}
      {/* ========================================================================= */}
      {showAddOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-shopee-500" />
                <span>Thêm Đơn Hàng Shopee Nhanh</span>
              </h3>
              <button
                onClick={() => setShowAddOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualOrder} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã Đơn Hàng Shopee:
                </label>
                <input
                  type="text"
                  value={manualOrder.orderSn}
                  onChange={(e) => setManualOrder({ ...manualOrder, orderSn: e.target.value })}
                  placeholder="Ví dụ: 240824ABC12345"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã Sub_ID Của Link Khách:
                </label>
                <input
                  type="text"
                  value={manualOrder.subId}
                  onChange={(e) => setManualOrder({ ...manualOrder, subId: e.target.value })}
                  placeholder="Ví dụ: GUEST3fad hoặc mã link"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-shopee-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Sản Phẩm:
                </label>
                <input
                  type="text"
                  value={manualOrder.itemName}
                  onChange={(e) => setManualOrder({ ...manualOrder, itemName: e.target.value })}
                  placeholder="Ví dụ: Áo thun nam Shopee"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Giá Trị Mua (VNĐ):
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={manualOrder.totalAmount}
                    onChange={(e) => setManualOrder({ ...manualOrder, totalAmount: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hoa Hồng Shopee (VNĐ):
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={manualOrder.shopeeCommission}
                    onChange={(e) => setManualOrder({ ...manualOrder, shopeeCommission: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-emerald-600"
                  />
                </div>
              </div>

              {/* Tính toán hiển thị trước */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 text-[11px] space-y-1 text-emerald-800 dark:text-emerald-300">
                <div className="flex justify-between">
                  <span>Hoàn cho khách ({settings.commissionUserPercent}%):</span>
                  <strong className="font-bold">
                    {Math.round(manualOrder.shopeeCommission * (settings.commissionUserPercent / 100)).toLocaleString('vi-VN')} đ
                  </strong>
                </div>
                <div className="flex justify-between text-shopee-600 font-semibold">
                  <span>Lợi nhuận của bạn ({settings.commissionAdminPercent}%):</span>
                  <strong>
                    {Math.round(manualOrder.shopeeCommission * (settings.commissionAdminPercent / 100)).toLocaleString('vi-VN')} đ
                  </strong>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrderModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addingOrder}
                  className="flex-2 py-3 rounded-xl bg-shopee-500 hover:bg-shopee-600 text-white font-bold shadow-md transition-colors"
                >
                  {addingOrder ? 'Đang tạo...' : 'Xác Nhận & Cộng Tiền'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL QUÉT MÃ VIETQR THANH TOÁN CHI TRẢ */}
      {/* ========================================================================= */}
      {payingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span>Quét VietQR Chuyển Khoản</span>
              </h3>
              <button
                onClick={() => setPayingWithdrawal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* VietQR Image Container */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 inline-block shadow-sm">
              <img
                src={generateVietQrUrl({
                  bankShortName: payingWithdrawal.bankName,
                  accountNo: payingWithdrawal.bankAccountNo,
                  accountName: payingWithdrawal.bankAccountName,
                  amount: payingWithdrawal.amount,
                  description: `SHOPEE CASHBACK ${payingWithdrawal.id.slice(-6).toUpperCase()}`,
                })}
                alt="VietQR Chuyển Khoản"
                className="w-64 h-auto mx-auto rounded-lg"
              />
            </div>

            {/* Thông tin chuyển khoản */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl text-left text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {payingWithdrawal.bankAccountName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold text-indigo-600">{payingWithdrawal.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {payingWithdrawal.bankAccountNo}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5">
                <span className="text-slate-500">Số tiền cần chuyển:</span>
                <span className="font-black text-emerald-600 text-sm">
                  {payingWithdrawal.amount.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                onClick={() => setPayingWithdrawal(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => handleConfirmPayout(payingWithdrawal.id, 'PAID')}
                disabled={processingPayout}
                className="flex-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                {processingPayout ? (
                  'Đang xử lý...'
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Xác Nhận Đã Chuyển Tiền Xong</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SỬA VÍ TIỀN KHÁCH HÀNG */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Điều Chỉnh Số Dư Khách Hàng
            </h3>
            <p className="text-xs text-slate-500">
              Khách hàng: <strong>{editingUser.fullname || editingUser.phone}</strong> (SĐT: {editingUser.phone})
            </p>

            <form onSubmit={handleUpdateUserBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Số Dư Khả Dụng Mới (VNĐ):
                </label>
                <input
                  type="number"
                  step={1000}
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-emerald-600 text-base"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Lưu Số Dư
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
