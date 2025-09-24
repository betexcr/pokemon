import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#111827,#3B4CCA)', color: 'white', fontSize: 72, fontWeight: 800 }}>
        Type Matchups
      </div>
    ),
    { ...size }
  );
}

