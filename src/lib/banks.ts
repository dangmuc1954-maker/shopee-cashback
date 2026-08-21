import { BankInfo } from '@/types';

export const VIETNAM_BANKS: BankInfo[] = [
  { id: 'MB', code: '970422', shortName: 'MBBank', name: 'Ngân hàng Quân Đội', logo: 'https://api.vietqr.io/img/MB.png' },
  { id: 'VCB', code: '970436', shortName: 'Vietcombank', name: 'Ngân hàng Ngoại Thương Việt Nam', logo: 'https://api.vietqr.io/img/VCB.png' },
  { id: 'TCB', code: '970407', shortName: 'Techcombank', name: 'Ngân hàng Kỹ Thương', logo: 'https://api.vietqr.io/img/TCB.png' },
  { id: 'VPB', code: '970432', shortName: 'VPBank', name: 'Ngân hàng Việt Nam Thịnh Vượng', logo: 'https://api.vietqr.io/img/VPB.png' },
  { id: 'ACB', code: '970416', shortName: 'ACB', name: 'Ngân hàng Á Châu', logo: 'https://api.vietqr.io/img/ACB.png' },
  { id: 'BIDV', code: '970418', shortName: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển VN', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { id: 'VBA', code: '970405', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp và PTNT', logo: 'https://api.vietqr.io/img/VBA.png' },
  { id: 'TPB', code: '970423', shortName: 'TPBank', name: 'Ngân hàng Tiên Phong', logo: 'https://api.vietqr.io/img/TPB.png' },
  { id: 'STB', code: '970403', shortName: 'Sacombank', name: 'Ngân hàng Sài Gòn Thương Tín', logo: 'https://api.vietqr.io/img/STB.png' },
  { id: 'VIB', code: '970441', shortName: 'VIB', name: 'Ngân hàng Quốc tế', logo: 'https://api.vietqr.io/img/VIB.png' },
  { id: 'HDB', code: '970437', shortName: 'HDBank', name: 'Ngân hàng Phát triển TP.HCM', logo: 'https://api.vietqr.io/img/HDB.png' },
  { id: 'OCB', code: '970448', shortName: 'OCB', name: 'Ngân hàng Phương Đông', logo: 'https://api.vietqr.io/img/OCB.png' },
  { id: 'SHB', code: '970443', shortName: 'SHB', name: 'Ngân hàng Sài Gòn - Hà Nội', logo: 'https://api.vietqr.io/img/SHB.png' },
  { id: 'MSB', code: '970426', shortName: 'MSB', name: 'Ngân hàng Hàng Hải', logo: 'https://api.vietqr.io/img/MSB.png' },
  { id: 'LPB', code: '970449', shortName: 'LPBank', name: 'Ngân hàng Bưu Điện Liên Việt', logo: 'https://api.vietqr.io/img/LPB.png' },
  { id: 'SEAB', code: '970440', shortName: 'SeABank', name: 'Ngân hàng Đông Nam Á', logo: 'https://api.vietqr.io/img/SEAB.png' },
  { id: 'TIMO', code: '963388', shortName: 'Timo', name: 'Ngân hàng số Timo by BVBank', logo: 'https://api.vietqr.io/img/TIMO.png' },
  { id: 'CAKE', code: '546034', shortName: 'CAKE', name: 'Ngân hàng số CAKE by VPBank', logo: 'https://api.vietqr.io/img/CAKE.png' },
  { id: 'VIETTELPAY', code: '971005', shortName: 'ViettelMoney', name: 'Viettel Money', logo: 'https://api.vietqr.io/img/VIETTELPAY.png' },
];

export function getBankByShortName(shortName: string): BankInfo | undefined {
  const normalized = shortName.trim().toUpperCase();
  return VIETNAM_BANKS.find(
    (b) => b.shortName.toUpperCase() === normalized || b.id.toUpperCase() === normalized
  );
}
