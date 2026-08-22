import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://muaxamthongminh.up.railway.app'),
  title: 'Mua Sắm Thông Minh - Hoàn 60% Hoa Hồng Shopee Tự Động',
  description:
    'Công cụ hoàn tiền Shopee số 1 Việt Nam! Dán link sản phẩm bất kỳ để nhận lại 60% tiền hoa hồng mặt. Rút tiền nhanh 24/7 về thẻ ngân hàng từ 50.000 VNĐ.',
  keywords: [
    'hoàn tiền shopee',
    'shopee cashback',
    'mua sắm thông minh',
    'shopee affiliate',
    'rút tiền shopee',
    'hoàn 60% hoa hồng',
  ],
  authors: [{ name: 'Mua Sắm Thông Minh' }],
  openGraph: {
    title: 'Mua Sắm Thông Minh - Hoàn 60% Tiền Hoa Hồng Shopee',
    description:
      'Dán link sản phẩm Shopee bất kỳ để nhận lại 60% tiền hoa hồng mặt. Rút tiền nhanh 24/7 về mọi ngân hàng từ 50k!',
    siteName: 'Mua Sắm Thông Minh',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Mua Sắm Thông Minh - Hoàn 60% Tiền Hoa Hồng Shopee',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mua Sắm Thông Minh - Hoàn 60% Tiền Hoa Hồng Shopee',
    description: 'Nhận lại 60% tiền hoa hồng khi mua sắm Shopee. Rút tiền mặt nhanh 24/7 từ 50k!',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased`}>
        <Toaster position="top-right" richColors />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
