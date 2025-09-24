import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#111827,#1f2937)', color: '#fff', fontSize: 64, fontWeight: 800 }}>
        Popularity Trends
      </div>
    ),
    { ...size }
  );
}

