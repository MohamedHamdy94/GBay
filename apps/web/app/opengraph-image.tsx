import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'GBay - Next-Generation Marketplace';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #000000, #333333)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 128,
          fontWeight: 'bold',
          fontFamily: 'sans-serif',
        }}
      >
        GBay
      </div>
    ),
    { ...size }
  );
}
