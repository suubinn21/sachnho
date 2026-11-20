import type { ThemeMode } from '../data/types';

interface MeadowBackdropProps {
  theme: ThemeMode;
}

const STARS = [
  { top: '7%', left: '11%', size: 2, delay: '0s', dur: '3.2s' },
  { top: '12%', left: '24%', size: 2.5, delay: '0.8s', dur: '4.1s' },
  { top: '6%', left: '39%', size: 1.5, delay: '1.4s', dur: '2.9s' },
  { top: '15%', left: '53%', size: 2, delay: '0.4s', dur: '3.7s' },
  { top: '9%', left: '68%', size: 2.5, delay: '1.9s', dur: '4.4s' },
  { top: '14%', left: '82%', size: 2, delay: '0.6s', dur: '3.5s' },
  { top: '22%', left: '16%', size: 1.5, delay: '1.2s', dur: '3.1s' },
  { top: '20%', left: '33%', size: 2, delay: '2.1s', dur: '4.0s' },
  { top: '25%', left: '61%', size: 1.5, delay: '0.9s', dur: '3.3s' },
  { top: '19%', left: '91%', size: 2.5, delay: '1.6s', dur: '4.3s' },
  { top: '29%', left: '8%', size: 2, delay: '0.3s', dur: '3.6s' },
  { top: '31%', left: '76%', size: 1.5, delay: '1.1s', dur: '2.8s' },
];

const MOTES = [
  { left: '9%', bottom: '18%', size: 5, delay: '0s', dur: '7.5s' },
  { left: '18%', bottom: '24%', size: 4, delay: '1.4s', dur: '8.8s' },
  { left: '29%', bottom: '14%', size: 6, delay: '2.6s', dur: '7.2s' },
  { left: '42%', bottom: '20%', size: 4, delay: '0.8s', dur: '9.4s' },
  { left: '56%', bottom: '16%', size: 5, delay: '3.1s', dur: '8.0s' },
  { left: '67%', bottom: '22%', size: 4, delay: '1.9s', dur: '7.6s' },
  { left: '79%', bottom: '15%', size: 6, delay: '0.5s', dur: '8.5s' },
  { left: '89%', bottom: '21%', size: 4, delay: '2.2s', dur: '9.0s' },
];

const GRASS_CLUSTERS = [
  { left: '3%', bottom: '4%', scale: 1.0, delay: '0s', flower: '#FDE047' },
  { left: '9%', bottom: '9%', scale: 0.82, delay: '0.7s', flower: '#FFFBEB' },
  { left: '16%', bottom: '3%', scale: 1.08, delay: '1.3s', flower: '#FACC15' },
  { left: '23%', bottom: '11%', scale: 0.78, delay: '0.4s', flower: '' },
  { left: '31%', bottom: '5%', scale: 0.95, delay: '1.8s', flower: '#FEF08A' },
  { left: '41%', bottom: '8%', scale: 0.8, delay: '0.9s', flower: '#FFFBEB' },
  { left: '52%', bottom: '4%', scale: 1.05, delay: '1.5s', flower: '#FDE047' },
  { left: '63%', bottom: '10%', scale: 0.85, delay: '0.2s', flower: '' },
  { left: '72%', bottom: '4%', scale: 1.02, delay: '1.1s', flower: '#FEF9C3' },
  { left: '81%', bottom: '9%', scale: 0.88, delay: '1.9s', flower: '#FACC15' },
  { left: '89%', bottom: '3%', scale: 1.05, delay: '0.6s', flower: '#FFFBEB' },
  { left: '95%', bottom: '8%', scale: 0.82, delay: '1.4s', flower: '' },
];

/**
 * Animated sunlit countryside meadow (Light Mode) / starlit firefly meadow (Dark Mode)
 * rendered smoothly behind the 3D bookshelf without stealing focus or pointer events.
 */
export function MeadowBackdrop({ theme }: MeadowBackdropProps) {
  const isDark = theme === 'dark';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Celestial Body & Atmospheric Glow */}
      {!isDark ? (
        <>
          <div className="sun-glow absolute top-[7%] left-[12%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100/80 blur-2xl sm:h-44 sm:w-44" />
          <div className="sun-core absolute top-[7%] left-[12%] h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200 shadow-[0_0_50px_14px_rgba(254,240,138,0.65)] sm:h-16 sm:w-16" />
          {/* Gentle diagonal sunbeams */}
          <div
            className="sun-rays absolute -top-24 left-[4%] h-[65vh] w-[48vw] origin-top-left rotate-[22deg] opacity-35"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,251,225,0.55) 0%, rgba(255,251,225,0.12) 55%, transparent 100%)',
              filter: 'blur(24px)',
            }}
          />
        </>
      ) : (
        <>
          {/* Starfield */}
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
                boxShadow: '0 0 6px 1px rgba(255, 251, 235, 0.55)',
              }}
            />
          ))}
          {/* Moon glow */}
          <div className="sun-glow absolute top-[9%] right-[14%] h-28 w-28 rounded-full bg-blue-200/15 blur-2xl" />
          <div className="absolute top-[10%] right-[15%] h-12 w-12 rounded-full bg-gradient-to-br from-slate-100 to-blue-100/80 shadow-[0_0_32px_6px_rgba(191,219,254,0.28)]">
            <div className="absolute -top-1 -right-1 h-10 w-10 rounded-full bg-[#0f1a29]" />
          </div>
        </>
      )}

      {/* Drifting Clouds */}
      <div className="cloud-drift-slow absolute top-[11%] -left-48 opacity-80 dark:opacity-15">
        <svg width="210" height="64" viewBox="0 0 210 64" fill="none">
          <path
            d="M32 54H178C191 54 200 45 200 34C200 24 192 16 181 15C176 6 166 0 154 0C141 0 130 8 125 18C119 13 111 10 102 10C86 10 73 21 71 36C66 33 60 32 54 32C39 32 27 42 32 54Z"
            fill="white"
            fillOpacity="0.82"
          />
        </svg>
      </div>
      <div className="cloud-drift-medium absolute top-[18%] -left-40 opacity-65 dark:opacity-12">
        <svg width="160" height="50" viewBox="0 0 160 50" fill="none">
          <path
            d="M20 44H136C146 44 153 37 153 28C153 20 147 13 138 12C133 5 125 0 115 0C104 0 94 7 90 16C84 12 76 10 68 10C54 10 43 19 41 31C35 29 24 34 20 44Z"
            fill="white"
            fillOpacity="0.72"
          />
        </svg>
      </div>
      <div className="cloud-drift-fast absolute top-[7%] -left-32 opacity-55 dark:opacity-10">
        <svg width="128" height="42" viewBox="0 0 128 42" fill="none">
          <path
            d="M16 36H110C118 36 124 30 124 23C124 16 118 11 111 10C106 4 99 0 91 0C82 0 74 6 70 13C64 9 56 8 48 10C37 12 29 21 28 29C22 28 18 31 16 36Z"
            fill="white"
            fillOpacity="0.68"
          />
        </svg>
      </div>

      {/* Subtle Distant Soaring Birds (Light Mode) */}
      {!isDark && (
        <div className="bird-glide absolute top-[26%] -left-24 opacity-45">
          <svg width="86" height="32" viewBox="0 0 86 32" fill="none">
            <path
              d="M4 18C9 12 15 12 18 17C21 12 27 12 32 18"
              stroke="#3b5369"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M46 10C50 5 55 5 57 9C59 5 64 5 68 10"
              stroke="#3b5369"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M64 24C67 20 71 20 73 23C75 20 79 20 82 24"
              stroke="#3b5369"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* Horizon Warm Atmospheric Haze */}
      <div
        className="absolute inset-x-0 bottom-[28%] h-32"
        style={{
          background: isDark
            ? 'linear-gradient(180deg, transparent 0%, rgba(28, 46, 36, 0.35) 100%)'
            : 'linear-gradient(180deg, transparent 0%, rgba(254, 249, 226, 0.55) 100%)',
        }}
      />

      {/* Rolling Countryside Meadow Hills (3 Parallax Depth Layers) */}
      <svg
        viewBox="0 0 1440 420"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[44vh] min-h-[260px] w-full"
      >
        <defs>
          <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#243c2e' : '#a8cf7e'} />
            <stop offset="100%" stopColor={isDark ? '#1a2d22' : '#85b35c'} />
          </linearGradient>
          <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#1c3125' : '#84b457'} />
            <stop offset="100%" stopColor={isDark ? '#14241b' : '#639340'} />
          </linearGradient>
          <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#15251c' : '#6b9d44'} />
            <stop offset="100%" stopColor={isDark ? '#0e1913' : '#4a762d'} />
          </linearGradient>
        </defs>

        {/* Far gentle sunlit hill */}
        <path
          d="M0 165 C220 95, 420 110, 680 155 C940 200, 1180 90, 1440 145 L1440 420 L0 420 Z"
          fill="url(#hillFar)"
        />
        {/* Mid rolling meadow */}
        <path
          d="M0 215 C260 155, 520 245, 810 185 C1060 135, 1270 190, 1440 165 L1440 420 L0 420 Z"
          fill="url(#hillMid)"
        />
        {/* Foreground rich grass field */}
        <path
          d="M0 265 C310 215, 620 295, 960 245 C1180 215, 1320 245, 1440 230 L1440 420 L0 420 Z"
          fill="url(#hillNear)"
        />
      </svg>

      {/* Swaying Meadow Grass Tufts & Wildflowers */}
      <div className="absolute inset-x-0 bottom-0 h-[26vh] min-h-[150px]">
        {GRASS_CLUSTERS.map((tuft, idx) => (
          <div
            key={idx}
            className="grass-sway absolute origin-bottom"
            style={{
              left: tuft.left,
              bottom: tuft.bottom,
              transform: `scale(${tuft.scale})`,
              animationDelay: tuft.delay,
            }}
          >
            <svg width="56" height="58" viewBox="0 0 56 58" fill="none">
              <path
                d="M22 58C20 42 14 28 7 18C14 26 21 38 25 58Z"
                fill={isDark ? '#254431' : '#4b7c2d'}
              />
              <path
                d="M27 58C27 38 30 22 36 10C32 23 30 39 30 58Z"
                fill={isDark ? '#2e543d' : '#5e953a'}
              />
              <path
                d="M31 58C35 44 42 32 49 23C43 34 38 45 34 58Z"
                fill={isDark ? '#1e3828' : '#3f6b25'}
              />
              {tuft.flower && (
                <>
                  <path
                    d="M25 58C24 44 21 30 19 16"
                    stroke={isDark ? '#325a41' : '#5f963b'}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="19"
                    cy="14"
                    r="3.4"
                    fill={isDark ? '#eab308' : tuft.flower}
                    fillOpacity={isDark ? '0.65' : '0.95'}
                  />
                  <circle
                    cx="19"
                    cy="14"
                    r="1.3"
                    fill={isDark ? '#fef08a' : '#d97706'}
                  />
                </>
              )}
            </svg>
          </div>
        ))}
      </div>

      {/* Floating Sunlight Pollen Motes (Light) / Fireflies (Dark) */}
      {MOTES.map((mote, idx) => (
        <span
          key={idx}
          className={`mote-float absolute rounded-full ${
            isDark
              ? 'bg-lime-200 shadow-[0_0_10px_3px_rgba(217,249,157,0.75)]'
              : 'bg-amber-100/90 shadow-[0_0_10px_2px_rgba(254,243,199,0.8)]'
          }`}
          style={{
            left: mote.left,
            bottom: mote.bottom,
            width: `${mote.size}px`,
            height: `${mote.size}px`,
            animationDelay: mote.delay,
            animationDuration: mote.dur,
          }}
        />
      ))}
    </div>
  );
}
