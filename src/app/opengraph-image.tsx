import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Mua Sắm Thông Minh - Hoàn 60% Hoa Hồng Shopee';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #ee4d2d 0%, #ff7337 50%, #ff9800 100%)',
          fontFamily: 'sans-serif',
          padding: '40px 60px',
          position: 'relative',
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.12)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.08)',
          }}
        />

        {/* Main Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '36px',
            padding: '50px 70px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#fff1ed',
              color: '#ee4d2d',
              padding: '10px 24px',
              borderRadius: '999px',
              fontSize: '22px',
              fontWeight: 800,
              marginBottom: '20px',
              border: '2px solid #ffcdb5',
            }}
          >
            🔥 CÔNG CỤ HOÀN TIỀN SHOPEE SỐ 1 VIỆT NAM
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '52px',
              fontWeight: 900,
              color: '#1e293b',
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            MUA SẮM THÔNG MINH
          </div>

          {/* Highlight Subtitle */}
          <div
            style={{
              fontSize: '44px',
              fontWeight: 900,
              color: '#ee4d2d',
              marginBottom: '24px',
            }}
          >
            NHẬN LẠI 60% TIỀN HOA HỒNG MẶT
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '22px',
              color: '#64748b',
              fontWeight: 600,
              maxWidth: '850px',
              lineHeight: 1.5,
              marginBottom: '32px',
            }}
          >
            Dán link sản phẩm Shopee bất kỳ để tích lũy tiền mặt • Rút tiền nhanh 24/7 về mọi ngân hàng Việt Nam từ 50.000đ!
          </div>

          {/* Badges Footer */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                backgroundColor: '#f1f5f9',
                color: '#334155',
                padding: '10px 24px',
                borderRadius: '16px',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              ✅ Uy Tín 100%
            </div>
            <div
              style={{
                backgroundColor: '#ecfdf5',
                color: '#059669',
                padding: '10px 24px',
                borderRadius: '16px',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              💰 Hoàn 60% Tiền Mặt
            </div>
            <div
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                padding: '10px 24px',
                borderRadius: '16px',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              ⚡ Rút VietQR 24/7
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
