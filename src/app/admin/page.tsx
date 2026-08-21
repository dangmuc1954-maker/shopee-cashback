'use client';

import React, { useState, useEffect } from 'react';
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
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { generateVietQrUrl } from '@/lib/vietqr';
import { CashbackOrderItem, WithdrawalItem, UserSession, ConvertedLinkItem } from '@/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<UserSession | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'import' | 'withdrawals' | 'orders' | 'users' | 'links' | 'settings'>('import');
  const [loading, setLoading] = useState(true);

  // Data lists
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [orders, setOrders] = useState<CashbackOrderItem[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [linksList, setLinksList] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    shopeeAffId: '17300000000',
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
  const [withdrawalFilter, setWithdrawalFilter] = useState('ALL');
  const [linkSearch, setLinkSearch] = useState('');

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

  // View User Details Modal
  const [viewingUser, setViewingUser] = useState<any | null>(null);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
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
      toast.error('Lỗi khi tải dữ liệu trang quản trị!');
    } finally {
      setLoading(false);
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
        'Mã phụ': linksList[0]?.subId || 'U123456_demo',
        'Tên sản phẩm': 'Tai Nghe Không Dây Bluetooth TWS Cao Cấp',
        'Tổng giá trị': 450000,
        'Hoa hồng thực nhận': 45000,
        'Trạng thái': 'Đã hoàn thành',
      },
      {
        'Mã đơn hàng': '240821XYZ987654',
        'Mã phụ': linksList[1]?.subId || 'U987654_demo',
        'Tên sản phẩm': 'Áo Thun Nam Cotton Thoáng Khí Cao Cấp',
        'Tổng giá trị': 250000,
        'Hoa hồng thực nhận': 30000,
        'Trạng thái': 'Đã hoàn thành',
      },
      {
        'Mã đơn hàng': '240821TEST55555',
        'Mã phụ': 'NO_SUB_ID',
        'Tên sản phẩm': 'Sản phẩm mua ngoài hệ thống',
        'Tổng giá trị': 800000,
        'Hoa hồng thực nhận': 60000,
        'Trạng thái': 'Chờ xử lý',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bao_Cao_Shopee');
    XLSX.writeFile(wb, 'Mau_Bao_Cao_Shopee_Affiliate.xlsx');
    toast.success('Đã tải xuống file Excel mẫu Shopee!');
  };

  // Export Withdrawals to Excel
  const handleExportWithdrawalsExcel = () => {
    if (withdrawals.length === 0) {
      toast.error('Chưa có dữ liệu rút tiền để xuất!');
      return;
    }
    const exportData = withdrawals.map((w) => ({
      'Mã Yêu Cầu': w.id,
      'Khách Hàng': w.user?.fullname || w.user?.phone,
      'Số Điện Thoại': w.user?.phone,
      'Số Tiền Rút (VNĐ)': w.amount,
      'Ngân Hàng': w.bankName,
      'Số Tài Khoản': w.bankAccountNo,
      'Chủ Tài Khoản': w.bankAccountName,
      'Trạng Thái': w.status === 'PAID' ? 'Đã thanh toán' : w.status === 'PENDING' ? 'Chờ xử lý' : 'Từ chối',
      'Ghi Chú Admin': w.adminNote || '',
      'Ngày Tạo': new Date(w.createdAt).toLocaleString('vi-VN'),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rut_Tien');
    XLSX.writeFile(wb, `Danh_Sach_Rut_Tien_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Đã xuất file Excel danh sách rút tiền!');
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
        toast.success('Thêm đơn hàng thành công!');
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

  // 6. Handle Save Settings
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

  // 7. Handle Edit User Balance
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-slate-500">Đang tải trung tâm quản trị Admin...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* 1. ADMIN HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-950 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Quản Trị Hệ Thống Hoàn Tiền Shopee
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Admin: <strong>{adminUser?.fullname || adminUser?.phone}</strong> (SĐT: 0395957039)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllAdminData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Làm Mới Số Liệu</span>
          </button>
          <button
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' });
              router.push('/admin/login');
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            Đăng Xuất Admin
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Card 1: Tổng Doanh Thu Đơn Hàng */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng Giá Trị Mua Hàng
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {(stats.totalOrderAmount || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-slate-500">
              Tổng số {stats.totalOrdersCount} đơn hàng
            </div>
          </div>

          {/* Card 2: Tổng Hoa Hồng Shopee */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hoa Hồng Shopee (100%)
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {(stats.totalShopeeCommission || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-slate-500">
              Doanh thu hoa hồng tổng
            </div>
          </div>

          {/* Card 3: Tiền Đã Hoàn Khách (60%) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hoàn Cho Khách (60%)
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {(stats.totalUserCashback || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-emerald-600">
              Cộng vào ví người dùng
            </div>
          </div>

          {/* Card 4: Lợi Nhuận Của Bạn (40%) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Lợi Nhuận Của Bạn (40%)
            </div>
            <div className="text-xl sm:text-2xl font-black text-shopee-500">
              {(stats.totalAdminProfit || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-shopee-500 font-semibold">
              Lợi nhuận ròng Admin
            </div>
          </div>

        </div>
      )}

      {/* 3. TABS NAVIGATION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>⚡ Đối Soát Đơn Shopee (Excel)</span>
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'withdrawals'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>
              💳 Duyệt Rút Tiền VietQR ({withdrawals.filter((w) => w.status === 'PENDING').length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'orders'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>📦 Toàn Bộ Đơn Hàng ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Quản Lý Khách Hàng ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'links'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>🔗 Link Đã Tạo ({linksList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>⚙️ Cài Đặt Hệ Thống</span>
          </button>

        </div>

        {/* TAB CONTENTS */}
        <div className="p-6">
          
          {/* TAB 1: IMPORT EXCEL ĐỐI SOÁT */}
          {activeTab === 'import' && (
            <div className="max-w-3xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Nhập Báo Cáo Chuyển Đổi Shopee Affiliate (Excel / CSV)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tải file báo cáo đơn hàng từ trang <strong>affiliate.shopee.vn</strong> và kéo thả vào đây. Hệ thống tự động chia 60% vào ví khách và 40% lợi nhuận của bạn!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải File Excel Mẫu</span>
                </button>
              </div>

              <form onSubmit={handleImportSubmit} className="space-y-4">
                
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100/50 transition-colors">
                  <FileSpreadsheet className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {importFile ? importFile.name : 'Chọn hoặc kéo thả file Excel (.xlsx, .xls, .csv)'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Hỗ trợ file báo cáo đơn hàng xuất từ Shopee Affiliate Portal
                  </p>

                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="mt-4 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {importing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Tiến Hành Đối Soát & Chia 60% Hoa Hồng Tự Động</span>
                    </>
                  )}
                </button>

              </form>

              {/* KẾT QUẢ ĐỐI SOÁT */}
              {importResult && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Đã xử lý xong file báo cáo!</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100">
                      <span className="text-slate-400">Đơn hàng quét được:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                        {importResult.processedCount}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100">
                      <span className="text-slate-400">Khách được cộng ví:</span>
                      <p className="font-bold text-emerald-600 text-sm mt-0.5">
                        {importResult.matchedUserCount} người
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100">
                      <span className="text-slate-400">Tổng hoa hồng Shopee:</span>
                      <p className="font-bold text-indigo-600 text-sm mt-0.5">
                        {importResult.totalShopeeCommission.toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100">
                      <span className="text-slate-400">Tiền hoàn khách (60%):</span>
                      <p className="font-bold text-emerald-600 text-sm mt-0.5">
                        {importResult.totalCashbackCredited.toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DUYỆT RÚT TIỀN VIETQR */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Danh Sách Yêu Cầu Rút Tiền ({withdrawals.length})
                </h3>

                <div className="flex items-center gap-2">
                  <select
                    value={withdrawalFilter}
                    onChange={(e) => setWithdrawalFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="ALL">Tất Cả Trạng Thái</option>
                    <option value="PENDING">Đang Chờ Duyệt</option>
                    <option value="PAID">Đã Chuyển Tiền</option>
                    <option value="REJECTED">Bị Từ Chối</option>
                  </select>

                  <button
                    onClick={handleExportWithdrawalsExcel}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất Excel</span>
                  </button>
                </div>
              </div>

              {withdrawals.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Chưa có yêu cầu rút tiền nào.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                      <tr>
                        <th className="py-3 px-4 rounded-l-xl">Ngày Tạo</th>
                        <th className="py-3 px-4">Khách Hàng</th>
                        <th className="py-3 px-4 text-right">Số Tiền Rút</th>
                        <th className="py-3 px-4">Ngân Hàng</th>
                        <th className="py-3 px-4">Số Tài Khoản</th>
                        <th className="py-3 px-4">Tên Chủ TK</th>
                        <th className="py-3 px-4 text-center">Trạng Thái</th>
                        <th className="py-3 px-4 text-center rounded-r-xl">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {withdrawals
                        .filter((w) => withdrawalFilter === 'ALL' || w.status === withdrawalFilter)
                        .map((w) => (
                          <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(w.createdAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {w.user?.fullname || w.user?.phone}
                              </span>
                              <span className="block text-[11px] text-slate-400">{w.user?.phone}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white text-sm">
                              {w.amount.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="py-3 px-4 font-bold text-indigo-600">{w.bankName}</td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {w.bankAccountNo}
                            </td>
                            <td className="py-3 px-4 uppercase text-slate-700 dark:text-slate-300">
                              {w.bankAccountName}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {w.status === 'PAID' && (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                                  Đã Chuyển Tiền
                                </span>
                              )}
                              {w.status === 'PENDING' && (
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
                                  Chờ Duyệt
                                </span>
                              )}
                              {w.status === 'REJECTED' && (
                                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold">
                                  Từ Chối
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {w.status === 'PENDING' ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => setPayingWithdrawal(w)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>Quét VietQR & Chi Trả</span>
                                  </button>
                                  <button
                                    onClick={() => setRejectingWithdrawal(w)}
                                    className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                                  >
                                    Từ Chối
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">{w.adminNote || 'Đã xử lý'}</span>
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

          {/* TAB 3: TOÀN BỘ ĐƠN HÀNG */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Đơn Hàng Shopee ({orders.length})
                  </h3>
                  <button
                    onClick={() => setShowAddOrderModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Đơn Thủ Công</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="ALL">Tất Cả</option>
                    <option value="APPROVED">Đã Duyệt (APPROVED)</option>
                    <option value="PENDING">Chờ Xử Lý (PENDING)</option>
                    <option value="REJECTED">Đã Hủy (REJECTED)</option>
                  </select>

                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Tìm mã đơn, sub_id..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Mã Đơn Shopee</th>
                      <th className="py-3 px-4">Tên Sản Phẩm</th>
                      <th className="py-3 px-4">Mã Sub_ID</th>
                      <th className="py-3 px-4">Tài Khoản Khách</th>
                      <th className="py-3 px-4 text-right">Tổng Tiền</th>
                      <th className="py-3 px-4 text-right">Hoa Hồng 100%</th>
                      <th className="py-3 px-4 text-right">Hoàn Khách 60%</th>
                      <th className="py-3 px-4 text-right">Lãi Admin 40%</th>
                      <th className="py-3 px-4 text-center">Trạng Thái</th>
                      <th className="py-3 px-4 text-center rounded-r-xl">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {orders
                      .filter(
                        (o) =>
                          (orderStatusFilter === 'ALL' || o.status === orderStatusFilter) &&
                          (o.orderSn.toLowerCase().includes(orderSearch.toLowerCase()) ||
                            o.subId.toLowerCase().includes(orderSearch.toLowerCase()) ||
                            (o.itemName && o.itemName.toLowerCase().includes(orderSearch.toLowerCase())))
                      )
                      .map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {o.orderSn}
                          </td>
                          <td className="py-3 px-4 max-w-[160px] truncate text-slate-700 dark:text-slate-300">
                            {o.itemName || 'Sản phẩm Shopee'}
                          </td>
                          <td className="py-3 px-4 font-mono text-indigo-600">{o.subId}</td>
                          <td className="py-3 px-4">
                            {o.user ? (
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {o.user.fullname || o.user.phone}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Khách vãng lai</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                            {o.totalAmount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500">
                            {o.shopeeCommission.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">
                            +{o.userCashback.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-shopee-500">
                            +{o.adminProfit.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-center">
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                                o.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : o.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <option value="APPROVED">APPROVED (Đã Duyệt)</option>
                              <option value="PENDING">PENDING (Chờ Duyệt)</option>
                              <option value="REJECTED">REJECTED (Hủy)</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteOrder(o.id)}
                              title="Xóa đơn"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: QUẢN LÝ KHÁCH HÀNG */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Danh Sách Khách Hàng ({usersList.length})
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

          {/* TAB 5: QUẢN LÝ TOÀN BỘ LINK CHUYỂN ĐỔI */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Danh Sách Toàn Bộ Link Đã Tạo ({linksList.length})
                </h3>
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={linkSearch}
                    onChange={(e) => setLinkSearch(e.target.value)}
                    placeholder="Tìm theo Sub_ID, SĐT..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Mã Sub_ID</th>
                      <th className="py-3 px-4">Người Tạo</th>
                      <th className="py-3 px-4">Link Gốc</th>
                      <th className="py-3 px-4">Link Tiếp Thị (Affiliate)</th>
                      <th className="py-3 px-4 text-center">Lượt Click</th>
                      <th className="py-3 px-4 rounded-r-xl">Ngày Tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {linksList
                      .filter(
                        (l) =>
                          l.subId.toLowerCase().includes(linkSearch.toLowerCase()) ||
                          (l.user?.phone && l.user.phone.includes(linkSearch))
                      )
                      .map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-shopee-600">
                            {l.subId}
                          </td>
                          <td className="py-3 px-4">
                            {l.user ? (
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {l.user.fullname || l.user.phone}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Khách vãng lai</span>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-[200px] truncate text-slate-500 font-mono">
                            {l.originalUrl}
                          </td>
                          <td className="py-3 px-4 max-w-[200px] truncate text-indigo-600 font-mono">
                            {l.affiliateUrl}
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            {l.clicks || 0}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(l.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CÀI ĐẶT HỆ THỐNG */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Cấu Hình Tỷ Lệ Hoa Hồng & ID Shopee Affiliate
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
                    placeholder="Ví dụ: 17300000000"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    ID này sẽ được tự động gắn vào mọi link sản phẩm khi khách hàng tạo link.
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
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-emerald-600 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-shopee-500 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Thông Báo Nổi Bật Trang Chủ:
                  </label>
                  <input
                    type="text"
                    value={settings.announcement || ''}
                    onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                    placeholder="Thông báo tới người dùng..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Cài Đặt Hệ Thống</span>
                </button>

              </form>
            </div>
          )}

        </div>
      </div>

      {/* MODAL QUÉT MÃ VIETQR THANH TOÁN CHI TRẢ */}
      {payingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
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

      {/* MODAL TỪ CHỐI RÚT TIỀN */}
      {rejectingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Từ Chối Yêu Cầu Rút Tiền
            </h3>
            <p className="text-xs text-slate-500">
              Số tiền <strong>{rejectingWithdrawal.amount.toLocaleString('vi-VN')} VNĐ</strong> sẽ được hoàn trả tự động vào ví của khách hàng.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Lý Do Từ Chối:
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingWithdrawal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPayout(rejectingWithdrawal.id, 'REJECTED', rejectReason)}
                disabled={processingPayout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs"
              >
                {processingPayout ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM ĐƠN THỦ CÔNG */}
      {showAddOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Thêm Đơn Hàng Shopee Thủ Công
            </h3>

            <form onSubmit={handleAddManualOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Mã Đơn Shopee:</label>
                <input
                  type="text"
                  value={manualOrder.orderSn}
                  onChange={(e) => setManualOrder({ ...manualOrder, orderSn: e.target.value })}
                  placeholder="Ví dụ: 240821SHOPEE999"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Mã Sub_ID (Người Mua):</label>
                <input
                  type="text"
                  value={manualOrder.subId}
                  onChange={(e) => setManualOrder({ ...manualOrder, subId: e.target.value })}
                  placeholder="Ví dụ: U123456_abcde (để trống nếu không rõ)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Tên Sản Phẩm:</label>
                <input
                  type="text"
                  value={manualOrder.itemName}
                  onChange={(e) => setManualOrder({ ...manualOrder, itemName: e.target.value })}
                  placeholder="Nhập tên sản phẩm..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Tổng Giá Trị Đơn (VNĐ):</label>
                  <input
                    type="number"
                    value={manualOrder.totalAmount}
                    onChange={(e) => setManualOrder({ ...manualOrder, totalAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Hoa Hồng Shopee 100% (VNĐ):</label>
                  <input
                    type="number"
                    value={manualOrder.shopeeCommission}
                    onChange={(e) => setManualOrder({ ...manualOrder, shopeeCommission: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-indigo-600"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Khách nhận lại (60%):</span>
                  <span className="font-bold text-emerald-600">
                    {Math.round(manualOrder.shopeeCommission * 0.6).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admin giữ lại (40%):</span>
                  <span className="font-bold text-shopee-500">
                    {Math.round(manualOrder.shopeeCommission * 0.4).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrderModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={addingOrder}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs"
                >
                  {addingOrder ? 'Đang thêm...' : 'Lưu Đơn Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA SỐ DƯ USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sửa Số Dư Ví: {editingUser.fullname || editingUser.phone}
            </h3>
            
            <form onSubmit={handleUpdateUserBalance} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Số Dư Khả Dụng Mới (VNĐ):
                </label>
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-emerald-600 text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs"
                >
                  Lưu Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
