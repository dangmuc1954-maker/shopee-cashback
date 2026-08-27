'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, Play, Pause } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  rotationAxis: number; // 3D flip simulation
  axisSpeed: number;
  opacity: number;
  type: 'coin' | 'bill500k' | 'bill200k' | 'bill100k' | 'sparkle';
  swayFreq: number;
  swayAmp: number;
  timeOffset: number;
}

export default function FallingMoney() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isBursting, setIsBursting] = useState(false);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const isEnabledRef = useRef(isEnabled);

  isEnabledRef.current = isEnabled;

  // Khởi tạo particle mới
  const createParticle = useCallback((isBurst = false, startY?: number): Particle => {
    const types: Particle['type'][] = ['coin', 'coin', 'bill500k', 'bill200k', 'bill100k', 'sparkle'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;

    const baseSize = type === 'coin' ? 24 : type === 'sparkle' ? 16 : 38;
    const size = baseSize * (0.65 + Math.random() * 0.7);

    return {
      x: isBurst ? width * 0.2 + Math.random() * width * 0.6 : Math.random() * width,
      y: startY !== undefined ? startY : isBurst ? -20 - Math.random() * 80 : -50 - Math.random() * height,
      size,
      speedY: isBurst ? 2.5 + Math.random() * 4.5 : 1.2 + Math.random() * 2.2,
      speedX: (Math.random() - 0.5) * (isBurst ? 3 : 1.2),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.06,
      rotationAxis: Math.random() * Math.PI,
      axisSpeed: 0.02 + Math.random() * 0.05,
      opacity: 0.75 + Math.random() * 0.25,
      type,
      swayFreq: 0.015 + Math.random() * 0.02,
      swayAmp: 0.8 + Math.random() * 2.2,
      timeOffset: Math.random() * 1000,
    };
  }, []);

  // Kích hoạt mưa tiền rơi nhiều (Burst) khi chuyển đổi link thành công
  const triggerBurst = useCallback(() => {
    if (!isEnabledRef.current) return;
    setIsBursting(true);
    const burstCount = window.innerWidth < 768 ? 45 : 90;
    const newParticles: Particle[] = [];
    for (let i = 0; i < burstCount; i++) {
      newParticles.push(createParticle(true, -10 - Math.random() * 150));
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];

    setTimeout(() => {
      setIsBursting(false);
    }, 4500);
  }, [createParticle]);

  // Đăng ký custom event listener để các trang khác (ví dụ: page.tsx khi convert link) có thể kích hoạt
  useEffect(() => {
    const handleCustomTrigger = () => {
      triggerBurst();
    };

    window.addEventListener('trigger-money-rain', handleCustomTrigger);
    return () => {
      window.removeEventListener('trigger-money-rain', handleCustomTrigger);
    };
  }, [triggerBurst]);

  // Khởi tạo và render Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Tạo các particle ambient ban đầu
    const ambientCount = window.innerWidth < 768 ? 14 : 28;
    particlesRef.current = Array.from({ length: ambientCount }, () => createParticle(false, Math.random() * height));

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (isEnabledRef.current) {
        time += 1;
        const currentParticles = particlesRef.current;

        for (let i = 0; i < currentParticles.length; i++) {
          const p = currentParticles[i];

          // Cập nhật vị trí
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(time * p.swayFreq + p.timeOffset) * p.swayAmp;
          p.rotation += p.rotationSpeed;
          p.rotationAxis += p.axisSpeed;

          // Nếu rơi ra khỏi màn hình
          if (p.y > height + 60) {
            if (isBursting) {
              // Nếu đang trong đợt burst, xóa bớt hạt thừa
              currentParticles.splice(i, 1);
              i--;
              continue;
            } else {
              // Hồi sinh particle ở đỉnh màn hình
              Object.assign(p, createParticle(false, -50));
            }
          }

          // Vẽ particle lên canvas
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          // Mô phỏng hiệu ứng 3D lật mặt (3D flip)
          const scaleX = Math.cos(p.rotationAxis);
          ctx.scale(scaleX, 1);
          ctx.globalAlpha = p.opacity;

          if (p.type === 'coin') {
            // VẼ ĐỒNG XU VÀNG 3D
            const radius = p.size / 2;
            const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, radius);
            grad.addColorStop(0, '#FFF6A5');
            grad.addColorStop(0.35, '#FFD700');
            grad.addColorStop(0.75, '#FFA500');
            grad.addColorStop(1, '#CC7A00');

            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Viền đồng xu
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = '#FFEAA7';
            ctx.stroke();

            // Ký hiệu ₫ ở giữa đồng xu
            ctx.font = `bold ${Math.round(radius * 1.05)}px sans-serif`;
            ctx.fillStyle = '#B35900';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('₫', 0, 1);

            // Chấm sáng lấp lánh trên đồng xu
            ctx.beginPath();
            ctx.arc(-radius * 0.4, -radius * 0.4, radius * 0.22, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.fill();

          } else if (p.type === 'bill500k') {
            // VẼ TỜ TIỀN 500.000 VNĐ (Xanh dương)
            const w = p.size * 1.65;
            const h = p.size * 0.85;

            const billGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
            billGrad.addColorStop(0, '#0097a7');
            billGrad.addColorStop(0.5, '#00838f');
            billGrad.addColorStop(1, '#006064');

            ctx.fillStyle = billGrad;
            ctx.beginPath();
            ctx.roundRect(-w / 2, -h / 2, w, h, 3.5);
            ctx.fill();

            ctx.lineWidth = 1;
            ctx.strokeStyle = '#80deea';
            ctx.stroke();

            ctx.font = `bold ${Math.round(h * 0.36)}px sans-serif`;
            ctx.fillStyle = '#e0f7fa';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('500k', 0, 0);

          } else if (p.type === 'bill200k') {
            // VẼ TỜ TIỀN 200.000 VNĐ (Đỏ / Nâu Cam)
            const w = p.size * 1.65;
            const h = p.size * 0.85;

            const billGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
            billGrad.addColorStop(0, '#c2185b');
            billGrad.addColorStop(0.5, '#b71c1c');
            billGrad.addColorStop(1, '#880e4f');

            ctx.fillStyle = billGrad;
            ctx.beginPath();
            ctx.roundRect(-w / 2, -h / 2, w, h, 3.5);
            ctx.fill();

            ctx.lineWidth = 1;
            ctx.strokeStyle = '#f48fb1';
            ctx.stroke();

            ctx.font = `bold ${Math.round(h * 0.36)}px sans-serif`;
            ctx.fillStyle = '#fce4ec';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('200k', 0, 0);

          } else if (p.type === 'bill100k') {
            // VẼ TỜ TIỀN 100.000 VNĐ (Xanh lá cây)
            const w = p.size * 1.65;
            const h = p.size * 0.85;

            const billGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
            billGrad.addColorStop(0, '#2e7d32');
            billGrad.addColorStop(0.5, '#1b5e20');
            billGrad.addColorStop(1, '#004d40');

            ctx.fillStyle = billGrad;
            ctx.beginPath();
            ctx.roundRect(-w / 2, -h / 2, w, h, 3.5);
            ctx.fill();

            ctx.lineWidth = 1;
            ctx.strokeStyle = '#a5d6a7';
            ctx.stroke();

            ctx.font = `bold ${Math.round(h * 0.36)}px sans-serif`;
            ctx.fillStyle = '#e8f5e9';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('100k', 0, 0);

          } else {
            // VẼ NGÔI SAO / LẤP LÁNH (Sparkle)
            const rad = p.size / 2;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(0, -rad);
            ctx.lineTo(rad * 0.3, -rad * 0.3);
            ctx.lineTo(rad, 0);
            ctx.lineTo(rad * 0.3, rad * 0.3);
            ctx.lineTo(0, rad);
            ctx.lineTo(-rad * 0.3, rad * 0.3);
            ctx.lineTo(-rad, 0);
            ctx.lineTo(-rad * 0.3, -rad * 0.3);
            ctx.closePath();
            ctx.fill();
          }

          ctx.restore();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [createParticle]);

  return (
    <>
      {/* Canvas rơi tiền toàn màn hình, không chặn click người dùng */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-500"
        style={{ opacity: isEnabled ? 1 : 0 }}
      />

      {/* Floating Control Button ở góc dưới bên trái */}
      <div className="fixed bottom-5 left-5 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl backdrop-blur-md shadow-lg border text-xs font-bold transition-all transform hover:scale-105 active:scale-95 ${
            isEnabled
              ? 'bg-amber-500/90 hover:bg-amber-500 text-white border-amber-300/50 shadow-amber-500/20'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title={isEnabled ? 'Bấm để tắt hiệu ứng tiền rơi' : 'Bấm để bật hiệu ứng tiền rơi'}
        >
          <span className="text-sm">🪙</span>
          <span>{isEnabled ? 'Mưa Tiền: Bật' : 'Mưa Tiền: Tắt'}</span>
          {isEnabled ? <Pause className="w-3 h-3 ml-0.5 opacity-80" /> : <Play className="w-3 h-3 ml-0.5 opacity-80" />}
        </button>

        {isEnabled && (
          <button
            onClick={triggerBurst}
            className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black shadow-lg border border-orange-300/40 transform hover:scale-105 active:scale-95 transition-all"
            title="Bấm để bung toả cơn mưa tiền tài lộc!"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Mưa Lớn!</span>
          </button>
        )}
      </div>
    </>
  );
}
