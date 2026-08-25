const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { Resvg } = require('@resvg/resvg-js');

// Thư mục lưu tạm và lưu kết quả
const outputDir = path.join(__dirname, '..', 'public');
const tempDir = path.join(__dirname, '..', 'temp_video_build');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 1. Danh sách kịch bản phân cảnh kèm lời thoại
const scriptScenes = [
  {
    id: 'scene1_hook',
    title: '⚠️ CẢNH BÁO MUA SẮM!',
    subtitle: 'BẠN ĐANG MẤT TIỀN OAN KHI MUA SHOPEE?',
    voiceText: 'Dừng lại ba giây! Mua sắm Shopee bao lâu nay, bạn có biết mình đang vứt đi hàng triệu đồng tiền hoa hồng mỗi tháng không?',
    badge: 'DỪNG LẠI 3 GIÂY!',
    badgeColor: '#ef4444',
    bgGradient: ['#1e1b4b', '#0f172a', '#450a0a'],
    accentColor: '#f43f5e',
    cardContent: `
      <rect x="140" y="550" width="800" height="700" rx="40" fill="#1e1b4b" stroke="#f43f5e" stroke-width="6" opacity="0.95" />
      <text x="540" y="650" font-family="Arial, sans-serif" font-size="46" font-weight="900" fill="#f43f5e" text-anchor="middle">💸 BẠN CÓ BIẾT?</text>
      <text x="540" y="740" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">Mỗi đơn hàng Shopee đều có</text>
      <text x="540" y="820" font-family="Arial, sans-serif" font-size="52" font-weight="900" fill="#fbbf24" text-anchor="middle">5% ĐẾN 20% HOA HỒNG</text>
      <text x="540" y="910" font-family="Arial, sans-serif" font-size="34" font-weight="600" fill="#cbd5e1" text-anchor="middle">Mua trực tiếp bạn sẽ</text>
      <rect x="240" y="960" width="600" height="90" rx="25" fill="#ef4444" />
      <text x="540" y="1020" font-family="Arial, sans-serif" font-size="40" font-weight="900" fill="#ffffff" text-anchor="middle">❌ MẤT TRẮNG 0 ĐỒNG!</text>
      <text x="540" y="1170" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#94a3b8" text-anchor="middle">Xem ngay bí quyết nhận lại 60% 👇</text>
    `,
  },
  {
    id: 'scene2_secret',
    title: 'BÍ MẬT DÂN MUA SẮM PRO',
    subtitle: 'NGƯỜI THÔNG MINH KHÔNG MUA GIÁ GỐC',
    voiceText: 'Mỗi món đồ bạn mua trên Shopee đều có hoa hồng. Mua trực tiếp thì mất trắng, nhưng dân săn sale chuyên nghiệp thì không bao giờ làm thế!',
    badge: 'SO SÁNH THỰC TẾ',
    badgeColor: '#f97316',
    bgGradient: ['#0f172a', '#1e1b4b', '#1e293b'],
    accentColor: '#f97316',
    cardContent: `
      <!-- Card so sánh 1: Mua thường -->
      <rect x="140" y="520" width="800" height="320" rx="35" fill="#1e293b" stroke="#ef4444" stroke-width="4" />
      <text x="190" y="590" font-family="Arial, sans-serif" font-size="36" font-weight="900" fill="#ef4444">❌ NGƯỜI MUA THƯỜNG:</text>
      <text x="190" y="660" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#cbd5e1">• Mua đơn hàng 500.000 VNĐ</text>
      <text x="190" y="730" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#ef4444">• Nhận lại: 0 VNĐ (Mất tiền hoa hồng)</text>
      <text x="190" y="790" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#94a3b8">Tiền hoa hồng chảy vào túi người khác</text>

      <!-- Card so sánh 2: Shopee Cashback -->
      <rect x="140" y="880" width="800" height="380" rx="35" fill="#1e1b4b" stroke="#10b981" stroke-width="6" />
      <text x="190" y="960" font-family="Arial, sans-serif" font-size="36" font-weight="900" fill="#10b981">✅ QUA SHOPEECASHBACK.ONLINE:</text>
      <text x="190" y="1030" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#cbd5e1">• Mua đơn hàng 500.000 VNĐ</text>
      <rect x="190" y="1070" width="700" height="80" rx="20" fill="#10b981" />
      <text x="540" y="1125" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="#ffffff" text-anchor="middle">🎁 HOÀN LẠI 60% TIỀN TƯƠI VỀ VÍ!</text>
      <text x="540" y="1210" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#fbbf24" text-anchor="middle">⚡ Rút thẳng về thẻ ngân hàng 24/7</text>
    `,
  },
  {
    id: 'scene3_step1',
    title: 'CỰC KỲ DỄ DÀNG',
    subtitle: 'CHỈ MẤT ĐÚNG 3 GIÂY THAO TÁC',
    voiceText: 'Cách làm siêu dễ trong ba giây. Bước một, sao chép đường link món đồ bạn thích trên Shopee.',
    badge: 'BƯỚC 1: COPY LINK',
    badgeColor: '#6366f1',
    bgGradient: ['#0f172a', '#1e1b4b', '#312e81'],
    accentColor: '#818cf8',
    cardContent: `
      <!-- Khung điện thoại mô phỏng -->
      <rect x="180" y="520" width="720" height="740" rx="40" fill="#1e293b" stroke="#6366f1" stroke-width="6" />
      
      <rect x="220" y="560" width="640" height="80" rx="20" fill="#ee4d2d" />
      <text x="540" y="615" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">🛒 ỨNG DỤNG SHOPEE</text>

      <rect x="220" y="670" width="640" height="280" rx="25" fill="#334155" />
      <text x="260" y="730" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">Áo Thun Nam Cao Cấp</text>
      <text x="260" y="780" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#ee4d2d">250.000 đ</text>
      <text x="260" y="830" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#cbd5e1">Đã bán 1.2k • Đánh giá 4.9⭐</text>

      <rect x="220" y="990" width="640" height="110" rx="25" fill="#6366f1" />
      <text x="540" y="1060" font-family="Arial, sans-serif" font-size="36" font-weight="900" fill="#ffffff" text-anchor="middle">📋 BẤM CHIA SẺ ➡️ SAO CHÉP LINK</text>
      <text x="540" y="1170" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#fbbf24" text-anchor="middle">👉 Bước 1 hoàn thành trong 1 giây!</text>
    `,
  },
  {
    id: 'scene4_step2',
    title: 'DÁN VÀO WEB HOÀN TIỀN',
    subtitle: 'HỆ THỐNG TỰ ĐỘNG GẮN MÃ HOÀN 60%',
    voiceText: 'Bước hai, mở web shopeecashback.online, dán link vào và bấm nhận hoàn tiền.',
    badge: 'BƯỚC 2: DÁN LINK VÀO WEB',
    badgeColor: '#f97316',
    bgGradient: ['#18181b', '#27272a', '#431407'],
    accentColor: '#f97316',
    cardContent: `
      <!-- Khung giao diện shopeecashback.online -->
      <rect x="160" y="520" width="760" height="740" rx="40" fill="#18181b" stroke="#f97316" stroke-width="6" />
      
      <text x="540" y="600" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="#f97316" text-anchor="middle">🌐 shopeecashback.online</text>
      <text x="540" y="660" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#cbd5e1" text-anchor="middle">Công Cụ Hoàn Tiền Shopee Số 1 Việt Nam</text>

      <!-- Ô nhập link -->
      <rect x="200" y="710" width="680" height="120" rx="25" fill="#27272a" stroke="#71717a" stroke-width="3" />
      <text x="240" y="780" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#a1a1aa">https://shopee.vn/product/123/456...</text>

      <!-- Nút bấm cam -->
      <rect x="200" y="870" width="680" height="130" rx="30" fill="#ea580c" />
      <text x="540" y="950" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="#ffffff" text-anchor="middle">✨ NHẬN 60% HOÀN TIỀN</text>

      <rect x="200" y="1040" width="680" height="150" rx="25" fill="#14532d" stroke="#22c55e" stroke-width="3" />
      <text x="540" y="1100" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#4ade80" text-anchor="middle">✅ ĐÃ TẠO LINK HOÀN TIỀN THÀNH CÔNG!</text>
      <text x="540" y="1150" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff" text-anchor="middle">Mã định danh Sub_ID của bạn đã được gắn tự động</text>
    `,
  },
  {
    id: 'scene5_step3',
    title: 'ĐẶT HÀNG NHƯ THƯỜNG',
    subtitle: 'MUA SẮM XONG LÀ CÓ TIỀN TƯƠI',
    voiceText: 'Bước ba, bấm mở Shopee đặt hàng như bình thường!',
    badge: 'BƯỚC 3: ĐẶT HÀNG',
    badgeColor: '#10b981',
    bgGradient: ['#0f172a', '#064e3b', '#022c22'],
    accentColor: '#10b981',
    cardContent: `
      <!-- Khung đặt hàng -->
      <rect x="180" y="520" width="720" height="740" rx="40" fill="#064e3b" stroke="#10b981" stroke-width="6" />
      
      <text x="540" y="620" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle">🛍️ ĐẶT HÀNG TRÊN APP SHOPEE</text>
      <text x="540" y="690" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#a7f3d0" text-anchor="middle">Bạn vẫn áp dụng mã giảm giá, Freeship 100%</text>

      <rect x="220" y="750" width="640" height="250" rx="30" fill="#022c22" stroke="#10b981" stroke-width="2" />
      <text x="540" y="820" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#10b981" text-anchor="middle">🎉 ĐẶT HÀNG THÀNH CÔNG!</text>
      <text x="540" y="880" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff" text-anchor="middle">Đơn hàng đã được Shopee ghi nhận</text>
      <text x="540" y="940" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#fbbf24" text-anchor="middle">Hoa hồng đang chuyển về ví của bạn...</text>

      <rect x="220" y="1050" width="640" height="120" rx="25" fill="#10b981" />
      <text x="540" y="1125" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">⚡ TỰ ĐỘNG CỘNG 60% TIỀN VÀO VÍ</text>
    `,
  },
  {
    id: 'scene6_payoff',
    title: 'TING TING TIỀN VỀ!',
    subtitle: 'RÚT TIỀN THẲNG VỀ TÀI KHOẢN NGÂN HÀNG 24/7',
    voiceText: 'Tiền hoa hồng sáu mươi phần trăm sẽ nhảy ngay vào ví của bạn. Đủ năm mươi ngàn là rút thẳng về tài khoản ngân hàng hai mươi bốn trên bảy!',
    badge: '💵 RÚT TIỀN TỨC THÌ',
    badgeColor: '#10b981',
    bgGradient: ['#0f172a', '#14532d', '#052e16'],
    accentColor: '#22c55e',
    cardContent: `
      <!-- Khung thông báo ngân hàng -->
      <rect x="140" y="520" width="800" height="740" rx="40" fill="#052e16" stroke="#22c55e" stroke-width="6" />
      
      <!-- Pop up ngân hàng -->
      <rect x="180" y="570" width="720" height="320" rx="30" fill="#14532d" stroke="#4ade80" stroke-width="4" />
      <text x="230" y="640" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#facc15">🔔 THÔNG BÁO BIẾN ĐỘNG SỐ DƯ</text>
      <text x="230" y="720" font-family="Arial, sans-serif" font-size="56" font-weight="900" fill="#4ade80">+450.000 VNĐ</text>
      <text x="230" y="780" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff">Nội dung: SHOPEE CASHBACK HOAN TIEN</text>
      <text x="230" y="830" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#a7f3d0">Số dư khả dụng đã được cộng thành công</text>

      <rect x="180" y="930" width="720" height="280" rx="30" fill="#0f172a" stroke="#22c55e" stroke-width="2" />
      <text x="540" y="1000" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">💳 RÚT TIỀN SIÊU TỐC VIETQR</text>
      <text x="540" y="1060" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#4ade80" text-anchor="middle">✓ Hỗ trợ tất cả ngân hàng Việt Nam</text>
      <text x="540" y="1110" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#4ade80" text-anchor="middle">✓ Rút tiền từ 50.000 VNĐ • Nhận tiền 24/7</text>
      <text x="540" y="1160" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#facc15" text-anchor="middle">Càng mua sắm nhiều - Tiền về càng khủng!</text>
    `,
  },
  {
    id: 'scene7_cta',
    title: 'TRUY CẬP NGAY HÔM NAY!',
    subtitle: 'MIỄN PHÍ 100% TRỌN ĐỜI',
    voiceText: 'Truy cập ngay shopeecashback.online để nhận lại sáu mươi phần trăm tiền hoàn ngay hôm nay!',
    badge: 'ƯU ĐÃI ĐẶC BIỆT',
    badgeColor: '#f97316',
    bgGradient: ['#0f172a', '#312e81', '#1e1b4b'],
    accentColor: '#f97316',
    cardContent: `
      <!-- Khung CTA cuối -->
      <rect x="140" y="500" width="800" height="780" rx="40" fill="#1e1b4b" stroke="#f97316" stroke-width="6" />
      
      <rect x="340" y="550" width="400" height="80" rx="20" fill="#f97316" />
      <text x="540" y="605" font-family="Arial, sans-serif" font-size="36" font-weight="900" fill="#ffffff" text-anchor="middle">ShopeeCashback</text>

      <text x="540" y="710" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle">HOÀN TIỀN 60% SHOPEE</text>
      <text x="540" y="770" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#a5b4fc" text-anchor="middle">Không thu bất kỳ chi phí nào • Miễn phí trọn đời</text>

      <!-- 3 tính năng vàng -->
      <rect x="190" y="820" width="700" height="60" rx="15" fill="#312e81" />
      <text x="540" y="860" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#4ade80" text-anchor="middle">✓ Tự động nhận 60% tiền mặt</text>

      <rect x="190" y="900" width="700" height="60" rx="15" fill="#312e81" />
      <text x="540" y="940" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#4ade80" text-anchor="middle">✓ Rút tiền 24/7 về thẻ ngân hàng</text>

      <rect x="190" y="980" width="700" height="60" rx="15" fill="#312e81" />
      <text x="540" y="1020" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#4ade80" text-anchor="middle">✓ Không cần tải app • Dùng ngay trên web</text>

      <!-- Nút bấm to -->
      <rect x="190" y="1080" width="700" height="140" rx="35" fill="#ea580c" stroke="#fde047" stroke-width="4" />
      <text x="540" y="1165" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#ffffff" text-anchor="middle">👉 shopeecashback.online</text>
    `,
  },
];

// Hàm tải TTS tiếng Việt
async function downloadTTS(text, destPath) {
  const url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=' + encodeURIComponent(text);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch TTS');
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

// Lấy độ dài file audio bằng ffprobe/ffmpeg
function getAudioDuration(audioPath) {
  try {
    const output = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`, {
      encoding: 'utf-8',
    });
    const duration = parseFloat(output.trim());
    return isNaN(duration) ? 4.5 : duration;
  } catch (err) {
    return 4.5;
  }
}

// Hàm render frame SVG thành file PNG
function renderSvgToPng(svgString, outputPath) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: 1080 },
    font: {
      defaultFontFamily: 'Arial',
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(outputPath, pngBuffer);
}

// Tạo SVG cho phân cảnh
function generateSceneSvg(scene) {
  return `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${scene.bgGradient[0]}" />
        <stop offset="50%" stop-color="${scene.bgGradient[1]}" />
        <stop offset="100%" stop-color="${scene.bgGradient[2]}" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="30" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Background -->
    <rect width="1080" height="1920" fill="url(#bgGrad)" />

    <!-- Top Badge -->
    <rect x="290" y="160" width="500" height="80" rx="40" fill="${scene.badgeColor}" filter="url(#glow)" opacity="0.3" />
    <rect x="290" y="160" width="500" height="80" rx="40" fill="${scene.badgeColor}" />
    <text x="540" y="215" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">
      ${scene.badge}
    </text>

    <!-- Main Headings -->
    <text x="540" y="320" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle">
      ${scene.title}
    </text>
    <text x="540" y="390" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="${scene.accentColor}" text-anchor="middle">
      ${scene.subtitle}
    </text>

    <!-- Dynamic Card Content -->
    ${scene.cardContent}

    <!-- Bottom Watermark & CTA Bar -->
    <rect x="0" y="1740" width="1080" height="180" fill="#020617" opacity="0.95" />
    <text x="540" y="1810" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="900" fill="#f97316" text-anchor="middle">
      🔥 shopeecashback.online
    </text>
    <text x="540" y="1860" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#94a3b8" text-anchor="middle">
      Nhận Lại 60% Hoa Hồng Shopee Ngay Hôm Nay
    </text>
  </svg>
  `;
}

// 3. Tiến hành tạo toàn bộ video
async function generateFullVideo() {
  console.log('🚀 Bắt đầu sản xuất Video Quảng Cáo Marketing Hoàn Chỉnh...');

  const clipVideoFiles = [];

  for (let i = 0; i < scriptScenes.length; i++) {
    const scene = scriptScenes[i];
    console.log(`\n[${i + 1}/${scriptScenes.length}] Xử lý phân cảnh: ${scene.id}...`);

    // 1. Tải TTS Voiceover
    const audioPath = path.join(tempDir, `${scene.id}_voice.mp3`);
    console.log('   - Tải giọng đọc AI...');
    await downloadTTS(scene.voiceText, audioPath);

    // 2. Lấy thời lượng âm thanh + cộng thêm 0.5s nghỉ tự nhiên
    const rawDuration = getAudioDuration(audioPath);
    const sceneDuration = Math.max(3.5, rawDuration + 0.6);
    console.log(`   - Thời lượng phân cảnh: ${sceneDuration.toFixed(2)}s`);

    // 3. Render ảnh PNG 1080x1920
    const imagePath = path.join(tempDir, `${scene.id}_frame.png`);
    console.log('   - Render khung hình 1080x1920...');
    const svgContent = generateSceneSvg(scene);
    renderSvgToPng(svgContent, imagePath);

    // 4. Dùng FFmpeg tạo video clip cho phân cảnh này (kết hợp frame + voiceover)
    const clipVideoPath = path.join(tempDir, `${scene.id}_clip.mp4`);
    console.log('   - Đóng gói clip MP4 với FFmpeg...');

    execSync(
      `ffmpeg -loop 1 -i "${imagePath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -t ${sceneDuration} -vf "scale=1080:1920" -shortest -y "${clipVideoPath}"`,
      { stdio: 'ignore' }
    );

    clipVideoFiles.push(clipVideoPath);
  }

  // 5. Ghép tất cả các clip phân cảnh lại thành 1 video hoàn chỉnh
  console.log('\n🎬 Đang ghép toàn bộ các phân cảnh thành 1 video hoàn chỉnh...');
  const concatListPath = path.join(tempDir, 'concat_list.txt');
  const fileContent = clipVideoFiles.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(concatListPath, fileContent, 'utf-8');

  const finalVideoPath = path.join(outputDir, 'shopee_cashback_marketing_video.mp4');

  execSync(
    `ffmpeg -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -pix_fmt yuv420p -y "${finalVideoPath}"`,
    { stdio: 'inherit' }
  );

  console.log('\n🎉 THÀNH CÔNG RỰC RỠ!');
  console.log(`📁 Video hoàn chỉnh đã được lưu tại: ${finalVideoPath}`);
  const stats = fs.statSync(finalVideoPath);
  console.log(`📦 Dung lượng video: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

generateFullVideo().catch(console.error);
