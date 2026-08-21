export interface UserSession {
  id: string;
  phone: string;
  email?: string | null;
  fullname?: string | null;
  role: 'USER' | 'ADMIN';
  balance: number;
  pendingBalance: number;
  totalWithdrawn: number;
}

export interface BankInfo {
  id: string;
  name: string;
  code: string;
  shortName: string;
  logo: string;
}

export interface ConvertedLinkItem {
  id: string;
  originalUrl: string;
  affiliateUrl: string;
  subId: string;
  productTitle?: string | null;
  clicks: number;
  createdAt: string;
}

export interface CashbackOrderItem {
  id: string;
  orderSn: string;
  subId: string;
  itemName?: string | null;
  totalAmount: number;
  shopeeCommission: number;
  userCashback: number;
  adminProfit: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  orderTime?: string | null;
  completedAt?: string | null;
  createdAt: string;
  user?: {
    fullname?: string | null;
    phone: string;
  } | null;
}

export interface WithdrawalItem {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  adminNote?: string | null;
  paidAt?: string | null;
  createdAt: string;
  user?: {
    fullname?: string | null;
    phone: string;
  };
}
