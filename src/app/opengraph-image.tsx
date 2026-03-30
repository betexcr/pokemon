import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';
export const dynamic = 'force-static';
export const alt = 'PokéDex - Modern Pokémon Database & Battle Platform';

const SPRITES = {
  charizard:
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
  pikachu:
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
  mewtwo:
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
};

const PILLS: { label: string; color: string }[] = [
  { label: '1000+ Pokémon', color: '#FF5350' },
  { label: 'Live Battles', color: '#FFDE00' },
  { label: 'Competitive Meta', color: '#3B4CCA' },
  { label: 'Team Builder', color: '#4FC1A6' },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(140deg, #0f0c29 0%, #1a1a2e 25%, #302b63 50%, #24243e 75%, #0f0c29 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Large Pokeball — top half (red) */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-40px',
            width: '520px',
            height: '260px',
            borderRadius: '260px 260px 0 0',
            background: 'rgba(255, 83, 80, 0.12)',
            display: 'flex',
          }}
        />
        {/* Large Pokeball — bottom half (white-ish) */}
        <div
          style={{
            position: 'absolute',
            top: '200px',
            right: '-40px',
            width: '520px',
            height: '260px',
            borderRadius: '0 0 260px 260px',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
          }}
        />
        {/* Pokeball center band */}
        <div
          style={{
            position: 'absolute',
            top: '192px',
            right: '-40px',
            width: '520px',
            height: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            display: 'flex',
          }}
        />
        {/* Pokeball center button */}
        <div
          style={{
            position: 'absolute',
            top: '170px',
            right: '180px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '8px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.06)',
            display: 'flex',
          }}
        />

        {/* Small decorative pokeball — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-60px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            border: '14px solid rgba(255, 83, 80, 0.08)',
            display: 'flex',
          }}
        />

        {/* Pokemon sprites */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SPRITES.charizard}
          alt=""
          width={260}
          height={260}
          style={{
            position: 'absolute',
            bottom: '-10px',
            right: '60px',
            opacity: 0.85,
            filter: 'drop-shadow(0 0 40px rgba(255, 83, 80, 0.4))',
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SPRITES.pikachu}
          alt=""
          width={180}
          height={180}
          style={{
            position: 'absolute',
            bottom: '-5px',
            right: '280px',
            opacity: 0.75,
            filter: 'drop-shadow(0 0 30px rgba(255, 222, 0, 0.35))',
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SPRITES.mewtwo}
          alt=""
          width={220}
          height={220}
          style={{
            position: 'absolute',
            bottom: '-5px',
            right: '420px',
            opacity: 0.6,
            filter: 'drop-shadow(0 0 35px rgba(160, 100, 255, 0.35))',
          }}
        />

        {/* Main content — left-aligned */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '70px 80px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: 86,
              fontWeight: 900,
              letterSpacing: '-3px',
              display: 'flex',
              alignItems: 'baseline',
              lineHeight: 1,
            }}
          >
            <span style={{ color: '#FF5350' }}>Poké</span>
            <span style={{ color: '#ffffff' }}>Dex</span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 26,
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 400,
              marginTop: '16px',
              display: 'flex',
            }}
          >
            Modern Pokémon Database & Battle Platform
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '36px',
              flexWrap: 'wrap',
            }}
          >
            {PILLS.map(({ label, color }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: color,
                    display: 'flex',
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background:
              'linear-gradient(90deg, #FF5350 0%, #FFDE00 25%, #3B4CCA 50%, #4FC1A6 75%, #A064FF 100%)',
            display: 'flex',
          }}
        />

        {/* URL watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '24px',
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.3)',
            fontWeight: 500,
            display: 'flex',
          }}
        >
          pokemon-indol-tau.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
