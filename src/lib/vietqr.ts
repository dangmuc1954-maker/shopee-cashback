import { getBankByShortName } from './banks';

export interface VietQrOptions {
  bankShortName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}

export function generateVietQrUrl(options: VietQrOptions): string {
  const {
    bankShortName,
    accountNo,
    accountName,
    amount,
    description,
    template = 'compact2',
  } = options;

  const bank = getBankByShortName(bankShortName);
  const bankId = bank ? bank.id : bankShortName;
  const cleanAccountNo = accountNo.replace(/\s+/g, '');
  const encodedDesc = encodeURIComponent(description);
  const encodedName = encodeURIComponent(accountName.toUpperCase());

  return `https://img.vietqr.io/image/${bankId}-${cleanAccountNo}-${template}.png?amount=${Math.round(
    amount
  )}&addInfo=${encodedDesc}&accountName=${encodedName}`;
}
