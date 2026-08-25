'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Video, 
  Sparkles, 
  Copy, 
  Check, 
  Upload, 
  Download, 
  Play, 
  RefreshCw, 
  Layers, 
  Clock, 
  Film, 
  Scissors, 
  CheckCircle2, 
  Building2, 
  ChevronRight, 
  Sliders, 
  Eye, 
  Trash2,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

// Danh sách các mẫu kiến trúc nhà
const ARCHITECTURE_PRESETS = [
  {
    id: 'modern_villa',
    name: 'Biệt Thự Hiện Đại Kính & Hồ Bơi',
    icon: '🏡',
    styleName: 'Ultra-modern luxury glass villa with infinity pool and sleek concrete accents',
  },
  {
    id: 'nordic_cabin',
    name: 'Nhà Gỗ Scandinavia A-Frame Trong Rừng',
    icon: '🌲',
    styleName: 'Cozy Nordic wooden A-frame cabin with large triangular glass facade and stone chimney',
  },
  {
    id: 'japanese_house',
    name: 'Nhà Cấp 4 Mái Nhật Sân Vườn Zen',
    icon: '🏯',
    styleName: 'Modern Japanese zen courtyard house with tiled hip roof, wooden lattice, and minimalist garden',
  },
  {
    id: 'modern_townhouse',
    name: 'Nhà Phố Hiện Đại 3 Tầng Mặt Tiền Đẹp',
    icon: '🏢',
    styleName: '3-story contemporary city townhouse with vertical wooden slats, green balcony planter boxes, and warm ambient LED strip lighting',
  },
  {
    id: 'container_home',
    name: 'Nhà Container Tối Giản Độc Đáo',
    icon: '📦',
    styleName: 'Modular luxury shipping container home with floor-to-ceiling panoramic windows and rooftop deck',
  },
  {
    id: 'neoclassical_mansion',
    name: 'Biệt Thự Tân Cổ Điển Sang Trọng',
    icon: '🏰',
    styleName: 'Grand neoclassical European mansion with elegant Roman columns, white molding, and manicured French garden',
  },
];

// Danh sách môi trường xung quanh
const ENVIRONMENT_PRESETS = [
  {
    id: 'sunny_meadow',
    name: 'Đồng cỏ xanh nắng vàng rực rỡ',
    desc: 'lush green open grass field, bright clear blue sky, natural sunlight',
  },
  {
    id: 'pine_forest',
    name: 'Giữa rừng thông thơ mộng trên đồi',
    desc: 'peaceful pine tree forest on gentle mountain slope, misty morning atmosphere',
  },
  {
    id: 'coastal_cliff',
    name: 'Ven sườn đồi nhìn ra biển xanh',
    desc: 'scenic coastal cliff with panoramic ocean views, gentle sea breeze',
  },
  {
    id: 'suburban_lot',
    name: 'Khu đô thị sinh thái hiện đại',
    desc: 'clean modern residential neighborhood, paved driveway, landscaped sidewalk',
  },
];

export default function VideoStudioPage() {
  const [selectedPreset, setSelectedPreset] = useState(ARCHITECTURE_PRESETS[0]);
  const [selectedEnv, setSelectedEnv] = useState(ENVIRONMENT_PRESETS[0]);
  const [sceneCount, setSceneCount] = useState<number>(4);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Video Files State for Stitcher
  const [sceneVideos, setSceneVideos] = useState<{ [key: number]: File }>({});
  const [videoPreviews, setVideoPreviews] = useState<{ [key: number]: string }>({});
  const [merging, setMerging] = useState(false);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);

  // Sinh kịch bản và Prompt đồng nhất cho từng phân cảnh 8s
  const generatedScenes = useMemo(() => {
    const baseSubject = selectedPreset.styleName;
    const envDesc = selectedEnv.desc;
    const cameraLock = 'Fixed static 45-degree high-angle isometric tripod camera view, locked camera position, zero camera panning, fast-motion construction hyperlapse, photorealistic 8k, Unreal Engine 5 render, cinematic realistic lighting';

    const stageTemplates = [
      {
        stageName: 'Giai Đoạn 1: Đào Đất & Đổ Bê Tông Móng (0s - 8s)',
        shortDesc: 'Máy xúc đào móng, công nhân đan sắt thép và đổ bê tông móng bè móng giằng vững chắc.',
        prompt: `Ultra-fast construction time-lapse (Stage 1 of construction). In a ${envDesc}, excavators digging deep foundation trenches, steel rebar grid being assembled, concrete trucks pouring foundation slab. ${cameraLock}, continuous time progression, sunny daylight.`,
      },
      {
        stageName: 'Giai Đoạn 2: Dựng Cột Trụ & Xây Tường Tầng 1 (8s - 16s)',
        shortDesc: 'Dựng cột bê tông cốt thép, đổ sàn tầng và xây các hàng tường gạch đỏ bao quanh.',
        prompt: `Ultra-fast construction time-lapse (Stage 2 of construction). On the freshly cured concrete foundation of ${baseSubject}, reinforced concrete pillars rising, scaffolding erected, red brick walls rapidly masonry stacking up layer by layer. ${cameraLock}, seamless structure growth from previous stage, sunny daylight.`,
      },
      {
        stageName: 'Giai Đoạn 3: Dựng Tầng Thượng & Lắp Khung Mái (16s - 24s)',
        shortDesc: 'Đổ sàn tầng trên, dựng khung xà gồ vì kèo mái và lắp đặt các khung cửa sổ kính lớn.',
        prompt: `Ultra-fast construction time-lapse (Stage 3 of construction). The structure of ${baseSubject} rapidly reaching full height, roof trusses and roof framework assembled, roof tiles installed, large glass panoramic window frames fitted into place. ${cameraLock}, seamless structure completion, clear sky.`,
      },
      {
        stageName: 'Giai Đoạn 4: Trát Tường, Sơn Ngoại Thất & Cảnh Quan (24s - 32s)',
        shortDesc: 'Trát vữa hoàn thiện, sơn màu cao cấp, lát đá sân vườn và trồng thảm cỏ cây xanh.',
        prompt: `Ultra-fast construction time-lapse (Stage 4 of construction). Exterior walls of ${baseSubject} being smoothly plastered and painted with elegant modern colors, stone siding installed, green grass lawn rolled out, garden trees planted, wooden deck and swimming pool filled with sparkling turquoise water. ${cameraLock}, daytime to sunset golden hour transition.`,
      },
      {
        stageName: 'Giai Đoạn 5: Bật Đèn LED Ban Đêm & Hoàn Thiện Lung Linh (32s - 40s)',
        shortDesc: 'Hoàn thiện toàn bộ, bật hệ thống đèn LED kiến trúc ban đêm ấm áp, ngôi nhà lung linh 100%.',
        prompt: `Stunning architectural cinematic time-lapse (Final Stage of construction). The completed ${baseSubject} glowing gorgeously in twilight sunset transitioning into night, warm golden interior lights turning on, modern exterior architectural LED strip lights glowing, water reflections in pool. ${cameraLock}, hyper-detailed photorealistic architectural masterpiece.`,
      },
      {
        stageName: 'Giai Đoạn 6: Góc Toàn Cảnh Hoàn Hảo & Không Gian Sống (40s - 48s)',
        shortDesc: 'Khoe trọn vẹn vẻ đẹp ngôi nhà hoàn thiện trong nắng sớm mai rực rỡ.',
        prompt: `Magnificent cinematic reveal time-lapse of the finished ${baseSubject} in crisp early morning sunlight, sparkling glass windows, pristine landscaped garden, subtle gentle breeze swaying trees, ultra high resolution 8k realistic architecture showcase. ${cameraLock}.`,
      },
    ];

    return stageTemplates.slice(0, sceneCount);
  }, [selectedPreset, selectedEnv, sceneCount]);

  // Xử lý sao chép Prompt
  const handleCopyPrompt = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success(`Đã sao chép Prompt Phân Cảnh ${index + 1}! Hãy dán vào Veo 3 / Video AI.`);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // Xử lý chọn video cho phân cảnh
  const handleVideoSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('video')) {
      toast.error('Vui lòng chọn file video hợp lệ (MP4 / WebM / MOV)!');
      return;
    }

    const url = URL.createObjectURL(file);
    setSceneVideos((prev) => ({ ...prev, [index]: file }));
    setVideoPreviews((prev) => ({ ...prev, [index]: url }));
    toast.success(`Đã nhận video cho Phân Cảnh ${index + 1}!`);
  };

  // Xóa video phân cảnh
  const handleRemoveVideo = (index: number) => {
    setSceneVideos((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
    setVideoPreviews((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  // Xử lý ghép video với FFmpeg qua API Backend
  const handleMergeVideos = async () => {
    const videoKeys = Object.keys(sceneVideos).map(Number).sort((a, b) => a - b);
    if (videoKeys.length < 2) {
      toast.error('Vui lòng tải lên ít nhất 2 phân cảnh video 8s để ghép!');
      return;
    }

    setMerging(true);
    setMergedVideoUrl(null);

    try {
      const formData = new FormData();
      videoKeys.forEach((key) => {
        formData.append('videos', sceneVideos[key]);
      });

      toast.info('Đang dùng FFmpeg ghép các phân cảnh 8s thành 1 video mượt mà...');

      const response = await fetch('/api/video/merge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || 'Ghép video thất bại');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMergedVideoUrl(url);
      toast.success('🎉 Ghép video Timelapse hoàn chỉnh thành công 100%!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi ghép video!');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 1. STUDIO HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Google Veo 3 &amp; Marketing Studio</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                Xưởng Tạo Video AI &amp; Marketing Cashback
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Tạo chuỗi phân cảnh <strong>Timelapse Xây Nhà 8s</strong> đồng nhất, hoặc <strong>Tải video Marketing Hướng Dẫn Hoàn Tiền 60%</strong> để đăng TikTok / Reels kéo khách!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                ← Quay lại Admin
              </Link>
            </div>
          </div>
        </div>

        {/* 1.5. VIDEO MARKETING HOÀN TIỀN 60% (SẴN SÀNG TẢI & CHỈNH SỬA) */}
        <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  🔥 Video Marketing Hướng Dẫn Hoàn Tiền 60% Shopee
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                    Đã Render Xong (54s)
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chuẩn kích thước 9:16 dọc (1080x1920 Full HD), giọng đọc AI tiếng Việt lôi cuốn, 7 phân cảnh đánh trúng tâm lý người mua!
                </p>
              </div>
            </div>

            <a
              href="/shopee_cashback_marketing_video.mp4"
              download="shopee_cashback_marketing_video.mp4"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>📥 Tải Video Về Máy (.MP4)</span>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Player Preview */}
            <div className="lg:col-span-5 max-w-xs mx-auto w-full aspect-[9/16] rounded-2xl overflow-hidden border-2 border-slate-700 bg-black shadow-2xl">
              <video
                src="/shopee_cashback_marketing_video.mp4"
                controls
                className="w-full h-full object-contain"
              />
            </div>

            {/* Thông tin kịch bản & Hướng dẫn fix nhẹ */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Cấu trúc 7 phân cảnh tâm lý trong video:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-rose-400">#1 Hook (0-9s):</strong> Cảnh báo mất tiền oan khi mua Shopee.
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-amber-400">#2 So Sánh (9-20s):</strong> Người thường 0đ vs Dân Pro nhận 60%.
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-indigo-400">#3 Bước 1 (20-28s):</strong> Copy link sản phẩm Shopee.
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-orange-400">#4 Bước 2 (28-35s):</strong> Dán link vào shopeecashback.online.
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-emerald-400">#5 Bước 3 (35-40s):</strong> Đặt hàng Shopee như bình thường.
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-green-400">#6 Ting Ting (40-47s):</strong> Tiền hoa hồng về ví + Rút VietQR 24/7.
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 sm:col-span-2">
                    <strong className="text-yellow-400">#7 CTA (47-54s):</strong> Kêu gọi truy cập shopeecashback.online nhận hoàn tiền ngay!
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  <span>Mẹo chỉnh sửa nhanh trong CapCut (nếu muốn):</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Video đã có sẵn giọng đọc AI và khung hình chuẩn. Anh chỉ cần nạp vào CapCut chèn thêm 1 bản nhạc beat TikTok vui nhộn (âm lượng 15-20%) hoặc thêm hiệu ứng sticker bàn tay chỉ vào link là có thể đăng kéo triệu view ngay!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CẤU HÌNH KIẾN TRÚC & PHONG CÁCH TIMELAPSE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              Tạo Video Timelapse Xây Nhà AI (Phân Cảnh 8 Giây)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chọn Phong Cách Nhà */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Mẫu Kiến Trúc Nhà Muốn Xây:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ARCHITECTURE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPreset(p)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                      selectedPreset.id === p.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xl shrink-0">{p.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-slate-200">{p.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn Bối Cảnh & Thời Gian */}
            <div className="space-y-4">
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Môi Trường &amp; Vị Trí Xây Dựng:
                </label>
                <div className="space-y-2">
                  {ENVIRONMENT_PRESETS.map((env) => (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => setSelectedEnv(env)}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                        selectedEnv.id === env.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
                      <span>{env.name}</span>
                      {selectedEnv.id === env.id && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn Độ Dài / Số Lượng Phân Cảnh */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Độ Dài Video Hoàn Chỉnh (Mỗi phân cảnh 8s):
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSceneCount(num)}
                      className={`py-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                        sceneCount === num
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-800 border-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {num} Cảnh ({num * 8}s)
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* 3. DANH SÁCH CÁC PHÂN CẢNH 8S ĐỒNG NHẤT & PROMPT TỐI ƯU */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-base font-bold text-white">
                  Bước 2: Tạo Từng Phân Cảnh 8 Giây &amp; Nạp Video Vào Khung
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Copy từng Prompt dán vào Veo 3 $\rightarrow$ Tải file video 8s về và kéo thả vào đúng khung phân cảnh bên dưới.
                </p>
              </div>
            </div>

            <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shrink-0">
              Đã nạp: {Object.keys(sceneVideos).length} / {generatedScenes.length} Phân Cảnh
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {generatedScenes.map((scene, idx) => (
              <div 
                key={idx}
                className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-5 space-y-4 hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      #{idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {scene.stageName}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(scene.prompt, idx)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      copiedIndex === idx
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                    }`}
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã Sao Chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao Chép Prompt Cảnh #{idx + 1}</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  {scene.shortDesc}
                </p>

                {/* Prompt Box */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-indigo-200/90 select-all leading-relaxed">
                  {scene.prompt}
                </div>

                {/* Video Upload Dropzone for this Scene */}
                <div className="pt-2">
                  {videoPreviews[idx] ? (
                    <div className="flex items-center justify-between gap-4 p-3 bg-slate-900/90 rounded-xl border border-emerald-500/40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Film className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {sceneVideos[idx]?.name || `video_scene_${idx + 1}.mp4`}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-medium">
                            ✓ Đã sẵn sàng ghép vào dòng thời gian
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={videoPreviews[idx]}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                          title="Xem trước clip"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(idx)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs"
                          title="Xóa clip này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer transition-all text-xs font-bold text-slate-400 hover:text-indigo-300">
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span>Kéo thả hoặc Bấm vào đây để tải file video 8s của Cảnh #{idx + 1}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={(e) => handleVideoSelect(idx, e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* 4. KHU VỰC GHÉP VIDEO HOÀN CHỈNH TỰ ĐỘNG (FFMPEG AUTO STITCHER) */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Scissors className="w-6 h-6 text-indigo-400" />
              <div>
                <h2 className="text-lg font-black text-white">
                  Bước 3: Ghép Thành Video Timelapse Hoàn Chỉnh
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tự động nối các phân cảnh 8s thành 1 video dài {generatedScenes.length * 8}s mượt mà 100% bằng FFmpeg.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMergeVideos}
              disabled={merging || Object.keys(sceneVideos).length < 2}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              {merging ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý &amp; ghép video...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>⚡ Ghép Thành 1 Video Hoàn Chỉnh</span>
                </>
              )}
            </button>
          </div>

          {/* Player xem trước video thành phẩm sau khi ghép */}
          {mergedVideoUrl && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/40 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Video Timelapse Thành Phẩm Đã Sẵn Sàng!</span>
                </div>

                <a
                  href={mergedVideoUrl}
                  download={`timelapse_${selectedPreset.id}_full.mp4`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Xuống Video MP4</span>
                </a>
              </div>

              <div className="max-w-2xl mx-auto rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                <video
                  src={mergedVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Hướng dẫn quy trình 0-credit Veo 3 */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-400 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Bí kíp tạo video Timelapse mượt mà 0-Credit:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
              <li>Mỗi lần tạo trên Veo 3 / model lite, hãy chọn thời lượng <strong>8 giây</strong>.</li>
              <li>Mọi Prompt đã được tích hợp từ khóa <strong>Fixed static 45-degree isometric tripod camera</strong> để góc máy quay hoàn toàn cố định không bị rung lắc khi chuyển cảnh.</li>
              <li>Sau khi tải đủ các video 8s về, kéo thả vào từng Cảnh rồi bấm <strong>Ghép Thành 1 Video Hoàn Chỉnh</strong> là xong!</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
