import { useEffect, useRef } from 'react';
import type { ThemeMode } from '../data/types';

interface MeadowBackdropProps {
  theme: ThemeMode;
}

interface GrassBlade {
  xRatio: number;
  baseYRatio: number;
  height: number;
  width: number;
  phase: number;
  speed: number;
  tier: 0 | 1 | 2;
  hasFlower: boolean;
  flowerColor: string;
}

interface FireflyOrMote {
  xRatio: number;
  yRatio: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  speed: number;
}

interface Butterfly {
  xRatio: number;
  yRatio: number;
  vx: number;
  phase: number;
  wingSpeed: number;
  scale: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const FLOWER_COLORS_DAY = ['#FDE047', '#FEF08A', '#FFFBEB', '#FBCFE8', '#DDD6FE'];
const FLOWER_COLORS_NIGHT = ['#A3E635', '#FACC15', '#E2E8F0'];
const BUTTERFLY_COLORS = ['#FDE68A', '#FED7AA', '#BAE6FD', '#FBCFE8'];

const STARS = [
  { top: '6%', left: '10%', size: 2, delay: '0s', dur: '3.2s' },
  { top: '11%', left: '22%', size: 2.5, delay: '0.7s', dur: '4.1s' },
  { top: '5%', left: '36%', size: 1.5, delay: '1.3s', dur: '2.9s' },
  { top: '14%', left: '49%', size: 2, delay: '0.4s', dur: '3.7s' },
  { top: '8%', left: '63%', size: 2.5, delay: '1.8s', dur: '4.4s' },
  { top: '13%', left: '77%', size: 2, delay: '0.5s', dur: '3.5s' },
  { top: '7%', left: '90%', size: 2, delay: '1.1s', dur: '3.8s' },
  { top: '21%', left: '15%', size: 1.5, delay: '1.2s', dur: '3.1s' },
  { top: '19%', left: '31%', size: 2, delay: '2.1s', dur: '4.0s' },
  { top: '24%', left: '57%', size: 1.5, delay: '0.9s', dur: '3.3s' },
  { top: '18%', left: '84%', size: 2.5, delay: '1.6s', dur: '4.3s' },
  { top: '28%', left: '7%', size: 2, delay: '0.3s', dur: '3.6s' },
  { top: '30%', left: '71%', size: 1.5, delay: '1.1s', dur: '2.8s' },
  { top: '26%', left: '43%', size: 2, delay: '0.2s', dur: '3.9s' },
];

/**
 * Painterly multi-layer countryside meadow with real-time Canvas wind ripples,
 * swaying wildflowers, fluttering butterflies / night fireflies, distant turning
 * windmill silhouette, and subtle mouse parallax.
 */
export function MeadowBackdrop({ theme }: MeadowBackdropProps) {
  const isDark = theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skyLayerRef = useRef<HTMLDivElement>(null);
  const farHillRef = useRef<SVGSVGElement>(null);
  const nearHillRef = useRef<SVGSVGElement>(null);

  // Gentle GPU parallax tracking pointer without triggering React re-renders
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let rafId = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tickParallax = () => {
      curX += (targetX - curX) * 0.05;
      curY += (targetY - curY) * 0.05;

      if (skyLayerRef.current) {
        skyLayerRef.current.style.transform = `translate3d(${(-curX * 8).toFixed(2)}px, ${(-curY * 5).toFixed(2)}px, 0)`;
      }
      if (farHillRef.current) {
        farHillRef.current.style.transform = `translate3d(${(-curX * 14).toFixed(2)}px, ${(-curY * 6).toFixed(2)}px, 0) scale(1.03)`;
      }
      if (nearHillRef.current) {
        nearHillRef.current.style.transform = `translate3d(${(-curX * 22).toFixed(2)}px, ${(-curY * 9).toFixed(2)}px, 0) scale(1.04)`;
      }
      rafId = window.requestAnimationFrame(tickParallax);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    rafId = window.requestAnimationFrame(tickParallax);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Real-time 60fps HTML5 Canvas: wind-rippled grass field, wildflowers, butterflies & fireflies
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const blades: GrassBlade[] = Array.from({ length: 170 }, (_, i) => {
      const tier = (i % 3) as 0 | 1 | 2;
      const baseYRatio = tier === 0 ? 0.77 : tier === 1 ? 0.87 : 0.985;
      return {
        xRatio: (i + Math.random() * 0.85) / 170,
        baseYRatio: baseYRatio + (Math.random() - 0.5) * 0.06,
        height: (tier === 0 ? 30 : tier === 1 ? 46 : 68) + Math.random() * 24,
        width: tier === 0 ? 2.1 : tier === 1 ? 2.8 : 3.6,
        phase: Math.random() * Math.PI * 2,
        speed: 1.1 + Math.random() * 0.8,
        tier,
        hasFlower: i % 5 === 0,
        flowerColor: isDark
          ? FLOWER_COLORS_NIGHT[i % FLOWER_COLORS_NIGHT.length]
          : FLOWER_COLORS_DAY[i % FLOWER_COLORS_DAY.length],
      };
    });

    const motes: FireflyOrMote[] = Array.from({ length: isDark ? 24 : 16 }, () => ({
      xRatio: Math.random(),
      yRatio: 0.56 + Math.random() * 0.38,
      vx: (Math.random() - 0.5) * 0.00018,
      vy: -0.00008 - Math.random() * 0.00014,
      radius: isDark ? 1.8 + Math.random() * 2.2 : 1.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      speed: 1.4 + Math.random() * 1.8,
    }));

    const butterflies: Butterfly[] = !isDark
      ? Array.from({ length: 4 }, (_, i) => ({
          xRatio: 0.12 + i * 0.23,
          yRatio: 0.64 + (i % 2) * 0.12,
          vx: (i % 2 === 0 ? 1 : -1) * (0.00024 + Math.random() * 0.00015),
          phase: Math.random() * Math.PI * 2,
          wingSpeed: 7 + Math.random() * 3,
          scale: 0.75 + Math.random() * 0.45,
          color: BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length],
        }))
      : [];

    let shootingStar: ShootingStar | null = null;
    let nextStarAt = performance.now() + 4500;

    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    const start = performance.now();

    const drawFrame = (now: number) => {
      if (document.hidden && !prefersReduced) {
        rafId = window.requestAnimationFrame(drawFrame);
        return;
      }

      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);

      // 1. Occasional night shooting star
      if (isDark && !prefersReduced) {
        if (!shootingStar && now > nextStarAt) {
          shootingStar = {
            x: width * (0.18 + Math.random() * 0.55),
            y: height * (0.06 + Math.random() * 0.14),
            vx: 5.5 + Math.random() * 3,
            vy: 2.2 + Math.random() * 1.4,
            life: 0,
            maxLife: 42,
          };
          nextStarAt = now + 7000 + Math.random() * 8000;
        }
        if (shootingStar) {
          shootingStar.x += shootingStar.vx;
          shootingStar.y += shootingStar.vy;
          shootingStar.life += 1;
          const alpha = Math.sin((shootingStar.life / shootingStar.maxLife) * Math.PI);
          const grad = ctx.createLinearGradient(
            shootingStar.x,
            shootingStar.y,
            shootingStar.x - shootingStar.vx * 14,
            shootingStar.y - shootingStar.vy * 14,
          );
          grad.addColorStop(0, `rgba(255, 250, 225, ${alpha * 0.9})`);
          grad.addColorStop(1, 'rgba(255, 250, 225, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(
            shootingStar.x - shootingStar.vx * 14,
            shootingStar.y - shootingStar.vy * 14,
          );
          ctx.stroke();
          if (shootingStar.life >= shootingStar.maxLife) shootingStar = null;
        }
      }

      // 2. Wind-rippled grass blades & wildflowers
      const bladeColorsDay = ['#6fa047', '#538635', '#3e6d24'];
      const bladeColorsNight = ['#1e3829', '#172c20', '#112117'];

      for (const b of blades) {
        const bx = b.xRatio * width;
        const by = b.baseYRatio * height;
        // Traveling gust wave across horizontal coordinate
        const windWave = prefersReduced
          ? 0.25
          : Math.sin(t * b.speed - b.xRatio * 7.5 + b.phase) * 0.6 +
            Math.sin(t * 0.7 - b.xRatio * 3.1) * 0.45;
        const tipX = bx + windWave * (b.height * 0.32);
        const tipY = by - b.height;
        const cpX = bx + windWave * (b.height * 0.14);
        const cpY = by - b.height * 0.55;

        ctx.fillStyle = isDark ? bladeColorsNight[b.tier] : bladeColorsDay[b.tier];
        ctx.beginPath();
        ctx.moveTo(bx - b.width * 0.5, by);
        ctx.quadraticCurveTo(cpX - b.width * 0.2, cpY, tipX, tipY);
        ctx.quadraticCurveTo(cpX + b.width * 0.25, cpY, bx + b.width * 0.5, by);
        ctx.closePath();
        ctx.fill();

        if (b.hasFlower) {
          ctx.save();
          ctx.globalAlpha = isDark ? 0.52 : 0.92;
          ctx.fillStyle = b.flowerColor;
          ctx.beginPath();
          ctx.arc(tipX, tipY, b.tier === 2 ? 3.2 : 2.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = isDark ? '#fef08a' : '#d97706';
          ctx.beginPath();
          ctx.arc(tipX, tipY, 1.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 3. Sunlight motes (Day) / Fireflies (Night)
      for (const m of motes) {
        if (!prefersReduced) {
          m.xRatio += m.vx + Math.sin(t * 0.7 + m.phase) * 0.00012;
          m.yRatio += m.vy + Math.cos(t * 0.9 + m.phase) * 0.00008;
          if (m.yRatio < 0.42) m.yRatio = 0.95;
          if (m.xRatio < 0) m.xRatio = 1;
          if (m.xRatio > 1) m.xRatio = 0;
        }
        const px = m.xRatio * width;
        const py = m.yRatio * height;
        const pulse = 0.45 + 0.55 * Math.sin(t * m.speed + m.phase);

        ctx.save();
        if (isDark) {
          const glow = ctx.createRadialGradient(px, py, 0, px, py, m.radius * 5);
          glow.addColorStop(0, `rgba(217, 249, 157, ${0.9 * pulse})`);
          glow.addColorStop(0.4, `rgba(163, 230, 53, ${0.35 * pulse})`);
          glow.addColorStop(1, 'rgba(163, 230, 53, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(px, py, m.radius * 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(255, 250, 220, ${0.55 * pulse})`;
          ctx.beginPath();
          ctx.arc(px, py, m.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Fluttering Butterflies (Light mode)
      for (const bf of butterflies) {
        if (!prefersReduced) {
          bf.xRatio += bf.vx;
          bf.yRatio += Math.sin(t * 2.1 + bf.phase) * 0.00035;
          if (bf.xRatio > 1.05) bf.xRatio = -0.05;
          if (bf.xRatio < -0.05) bf.xRatio = 1.05;
        }
        const bx = bf.xRatio * width;
        const by = bf.yRatio * height;
        const flap = prefersReduced ? 0.8 : Math.abs(Math.sin(t * bf.wingSpeed + bf.phase));
        const wingW = 7 * bf.scale * (0.35 + flap * 0.65);
        const wingH = 5.5 * bf.scale;

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(bf.vx > 0 ? 0.15 : -0.15);
        ctx.fillStyle = bf.color;
        ctx.globalAlpha = 0.86;
        // Left & right wing petals
        ctx.beginPath();
        ctx.ellipse(-wingW * 0.55, -wingH * 0.25, wingW, wingH, -0.35, 0, Math.PI * 2);
        ctx.ellipse(wingW * 0.55, -wingH * 0.25, wingW, wingH, 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(60, 45, 30, 0.7)';
        ctx.fillRect(-0.7, -wingH * 0.7, 1.4, wingH * 1.4);
        ctx.restore();
      }

      if (!prefersReduced) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    rafId = window.requestAnimationFrame(drawFrame);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, [isDark]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Parallax Sky Layer: Sun/Moon, Sunbeams, Stars & Drifting Clouds */}
      <div
        ref={skyLayerRef}
        className="absolute inset-0 transition-transform duration-150 ease-out will-change-transform"
      >
        {!isDark ? (
          <>
            <div className="sun-glow absolute top-[8%] left-[12%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100/85 blur-2xl sm:h-52 sm:w-52" />
            <div className="sun-core absolute top-[8%] left-[12%] h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-white via-amber-100 to-amber-200 shadow-[0_0_65px_20px_rgba(254,240,138,0.72)] sm:h-16 sm:w-16" />
            <div
              className="sun-rays absolute -top-20 left-[3%] h-[72vh] w-[52vw] origin-top-left rotate-[24deg] opacity-40"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,252,232,0.6) 0%, rgba(255,248,214,0.14) 58%, transparent 100%)',
                filter: 'blur(26px)',
              }}
            />
          </>
        ) : (
          <>
            {STARS.map((star, idx) => (
              <span
                key={idx}
                className="star-twinkle absolute rounded-full bg-amber-50"
                style={{
                  top: star.top,
                  left: star.left,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  animationDelay: star.delay,
                  animationDuration: star.dur,
                  boxShadow: '0 0 8px 1px rgba(255, 251, 235, 0.65)',
                }}
              />
            ))}
            <div className="sun-glow absolute top-[10%] right-[14%] h-32 w-32 rounded-full bg-indigo-200/15 blur-2xl" />
            <div className="absolute top-[10%] right-[15%] h-12 w-12 rounded-full bg-gradient-to-br from-slate-50 to-blue-100/85 shadow-[0_0_36px_8px_rgba(191,219,254,0.3)]">
              <div className="absolute -top-1 -right-1 h-10 w-10 rounded-full bg-[#0e1928]" />
            </div>
          </>
        )}

        {/* Volumetric Soft Clouds */}
        <div className="cloud-drift-slow absolute top-[10%] -left-52 opacity-85 dark:opacity-15">
          <svg width="240" height="72" viewBox="0 0 240 72" fill="none">
            <path
              d="M36 60H202C217 60 227 50 227 38C227 27 218 18 205 17C199 7 187 0 174 0C159 0 146 9 141 21C134 15 125 11 115 11C97 11 82 23 80 40C74 37 67 35 61 35C44 35 30 47 36 60Z"
              fill="url(#cloudGrad1)"
            />
            <defs>
              <linearGradient id="cloudGrad1" x1="120" y1="0" x2="120" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="white" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.65" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="cloud-drift-medium absolute top-[18%] -left-44 opacity-70 dark:opacity-12">
          <svg width="176" height="54" viewBox="0 0 176 54" fill="none">
            <path
              d="M22 48H150C161 48 168 40 168 30C168 22 162 14 152 13C146 5 137 0 126 0C114 0 103 8 99 17C92 13 84 11 75 11C59 11 47 21 45 34C38 32 26 37 22 48Z"
              fill="white"
              fillOpacity="0.78"
            />
          </svg>
        </div>
        <div className="cloud-drift-fast absolute top-[6%] -left-36 opacity-55 dark:opacity-10">
          <svg width="136" height="44" viewBox="0 0 136 44" fill="none">
            <path
              d="M18 38H116C125 38 131 32 131 24C131 17 125 11 117 10C112 4 104 0 96 0C86 0 78 6 74 14C67 10 59 9 50 11C39 13 30 22 29 31C23 30 19 33 18 38Z"
              fill="white"
              fillOpacity="0.7"
            />
          </svg>
        </div>

        {/* Distant Gliding Birds */}
        {!isDark && (
          <div className="bird-glide absolute top-[25%] -left-28 opacity-50">
            <svg width="96" height="34" viewBox="0 0 96 34" fill="none">
              <path d="M4 19C10 12 16 12 20 18C24 12 30 12 36 19" stroke="#3f586e" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M48 11C53 6 58 6 60 10C62 6 67 6 72 11" stroke="#3f586e" strokeWidth="1.35" strokeLinecap="round" />
              <path d="M72 25C76 21 80 21 82 24C84 21 88 21 92 25" stroke="#3f586e" strokeWidth="1.15" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Far Misty Mountains & Distant Countryside Ridge with Turning Windmill */}
      <svg
        ref={farHillRef}
        viewBox="0 0 1440 460"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[50vh] min-h-[290px] w-full transition-transform duration-150 ease-out will-change-transform"
      >
        <defs>
          <linearGradient id="mountainMist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#1e3242' : '#b7d5d4'} stopOpacity="0.78" />
            <stop offset="100%" stopColor={isDark ? '#172830' : '#dcebd5'} stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id="hillFarRich" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#253f2f' : '#b4d883'} />
            <stop offset="100%" stopColor={isDark ? '#1a2d22' : '#85b35a'} />
          </linearGradient>
        </defs>

        {/* Distant mountain silhouette */}
        <path
          d="M0 165 L190 92 L360 138 L580 76 L790 145 L1030 88 L1240 132 L1440 96 L1440 460 L0 460 Z"
          fill="url(#mountainMist)"
        />

        {/* Far sunlit meadow ridge */}
        <path
          d="M0 198 C240 132, 470 148, 720 192 C980 236, 1210 128, 1440 180 L1440 460 L0 460 Z"
          fill="url(#hillFarRich)"
        />

        {/* Distant tree grove silhouette along ridge */}
        <g fill={isDark ? '#1c3325' : '#6c9d4b'} opacity="0.88">
          <ellipse cx="185" cy="148" rx="22" ry="18" />
          <ellipse cx="212" cy="144" rx="26" ry="22" />
          <ellipse cx="242" cy="150" rx="20" ry="16" />
          <ellipse cx="1180" cy="156" rx="24" ry="19" />
          <ellipse cx="1212" cy="150" rx="28" ry="24" />
          <ellipse cx="1244" cy="158" rx="20" ry="16" />
        </g>
      </svg>

      {/* Cozy Distant Countryside Windmill on the right hill */}
      <div
        className="absolute right-[13%] bottom-[34%] hidden opacity-70 sm:block"
        style={{ filter: isDark ? 'brightness(0.55)' : 'none' }}
      >
        <svg width="46" height="62" viewBox="0 0 46 62" fill="none">
          {/* Tower */}
          <path d="M17 24H29L33 60H13L17 24Z" fill={isDark ? '#273b32' : '#d6c3a5'} />
          <path d="M16 24L23 13L30 24H16Z" fill={isDark ? '#1e2c26' : '#9c5a3c'} />
          <rect x="21" y="45" width="4" height="9" rx="1.5" fill={isDark ? '#facc15' : '#784830'} opacity="0.8" />
          {/* Rotating blades */}
          <g className="windmill-spin origin-[23px_22px]">
            <path d="M23 22L21 2L25 2L23 22Z" fill={isDark ? '#cbd5e1' : '#f8f4ea'} />
            <path d="M23 22L43 20L43 24L23 22Z" fill={isDark ? '#cbd5e1' : '#f8f4ea'} />
            <path d="M23 22L25 42L21 42L23 22Z" fill={isDark ? '#cbd5e1' : '#f8f4ea'} />
            <path d="M23 22L3 24L3 20L23 22Z" fill={isDark ? '#cbd5e1' : '#f8f4ea'} />
            <circle cx="23" cy="22" r="2.2" fill={isDark ? '#94a3b8' : '#784830'} />
          </g>
        </svg>
      </div>

      {/* Mid & Foreground Lush Rolling Meadow Hills */}
      <svg
        ref={nearHillRef}
        viewBox="0 0 1440 380"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[38vh] min-h-[220px] w-full transition-transform duration-150 ease-out will-change-transform"
      >
        <defs>
          <linearGradient id="hillMidRich" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#1c3225' : '#85b858'} />
            <stop offset="100%" stopColor={isDark ? '#132219' : '#5e8e39'} />
          </linearGradient>
          <linearGradient id="hillNearRich" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#15271d' : '#6ca144'} />
            <stop offset="100%" stopColor={isDark ? '#0c1711' : '#426e26'} />
          </linearGradient>
          <linearGradient id="meadowPath" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#27342b' : '#e6d8b8'} stopOpacity="0.45" />
            <stop offset="100%" stopColor={isDark ? '#19221c' : '#cbb98e'} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Mid rolling hill */}
        <path
          d="M0 145 C290 88, 560 176, 860 120 C1120 72, 1290 125, 1440 105 L1440 380 L0 380 Z"
          fill="url(#hillMidRich)"
        />
        {/* Soft winding sunlit path across the meadow */}
        <path
          d="M660 135 C720 175, 610 235, 710 380 L820 380 C720 245, 765 178, 695 130 Z"
          fill="url(#meadowPath)"
        />
        {/* Foreground sweeping grass slope */}
        <path
          d="M0 212 C330 165, 640 246, 980 198 C1200 168, 1340 194, 1440 182 L1440 380 L0 380 Z"
          fill="url(#hillNearRich)"
        />
      </svg>

      {/* Live 60fps Canvas Layer: Wind-Rippled Grass, Wildflowers, Butterflies & Fireflies */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
