import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default async function Image({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  
  try {
    const res = await fetch(`${API_URL}/v1/catalog/products/${id}`);
    if (!res.ok) {
      throw new Error('Product not found');
    }
    const product = await res.json();

    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: "currency",
      currency: product.currency || "USD",
    }).format(product.priceCents / 100);

    return new ImageResponse(
      (
        <div
          style={{
            background: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 40,
              fontSize: 32,
              fontWeight: 'bold',
              color: '#000',
            }}
          >
            GBay
          </div>
          <h1
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 20,
              color: '#1a1a1a',
            }}
          >
            {product.title}
          </h1>
          <p
            style={{
              fontSize: 48,
              color: '#0070f3',
              fontWeight: 'bold',
            }}
          >
            {formattedPrice}
          </p>
          <div
            style={{
              marginTop: 40,
              fontSize: 24,
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Marketplace
          </div>
        </div>
      ),
      { ...size }
    );
  } catch (error) {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            fontFamily: 'sans-serif',
          }}
        >
          GBay Marketplace
        </div>
      ),
      { ...size }
    );
  }
}
