# Module 24: SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive SEO infrastructure for GBay, including dynamic metadata, sitemaps, robots.txt, and structured data.

**Architecture:** Utilize Next.js 15 App Router built-in SEO features (Metadata API, Sitemap/Robots functions) integrated with `next-intl` for multilingual support. Absolute URLs will be generated using `NEXT_PUBLIC_APP_URL`.

**Tech Stack:** Next.js 15, TypeScript, next-intl, schema-dts (conceptually), next/og.

---

### Task 1: Root Metadata & Hreflang

**Files:**
- Modify: `apps/web/app/[locale]/layout.tsx`
- Modify: `apps/web/messages/en.json`
- Modify: `apps/web/messages/de.json`

- [ ] **Step 1: Update English messages**
Add SEO keys to `apps/web/messages/en.json`.
```json
{
  "SEO": {
    "title": "GBay - Next-Generation Marketplace",
    "description": "Buy and sell unique items on GBay, the world's most advanced auction platform.",
    "keywords": "marketplace, auction, buy, sell, gbay"
  }
}
```

- [ ] **Step 2: Update German messages**
Add SEO keys to `apps/web/messages/de.json`.
```json
{
  "SEO": {
    "title": "GBay - Marktplatz der nächsten Generation",
    "description": "Kaufen und verkaufen Sie einzigartige Artikel auf GBay, der weltweit fortschrittlichsten Auktionsplattform.",
    "keywords": "Marktplatz, Auktion, kaufen, verkaufen, gbay"
  }
}
```

- [ ] **Step 3: Implement root metadata in layout.tsx**
Update `apps/web/app/[locale]/layout.tsx` to use `metadataBase` and `alternates`.

```typescript
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t('title'),
      template: `%s | GBay`,
    },
    description: t('description'),
    keywords: t('keywords'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'en-US': '/en',
        'de-DE': '/de',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'de_DE',
      url: baseUrl,
      siteName: 'GBay',
    },
  };
}
```

- [ ] **Step 4: Commit**
```bash
git add apps/web/app/[locale]/layout.tsx apps/web/messages/*.json
git commit -m "feat(seo): add root metadata and hreflang support"
```

---

### Task 2: Robots.txt & Sitemap

**Files:**
- Create: `apps/web/app/robots.ts`
- Create: `apps/web/app/sitemap.ts`

- [ ] **Step 1: Create robots.ts**
```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/profile', '/seller/dashboard', '/cart', '/checkout', '/login', '/register'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: Create sitemap.ts**
Fetch products and categories from API and generate sitemap.

```typescript
import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['en', 'de'];
  
  // Basic pages
  const routes = ['', '/login', '/register'].flatMap((route) =>
    locales.map((locale) => ({
      url: `${APP_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8,
    }))
  );

  try {
    // Products
    const productsRes = await fetch(`${API_URL}/v1/catalog/products`);
    const products = await productsRes.json();
    const productEntries = products.flatMap((p: any) =>
      locales.map((locale) => ({
        url: `${APP_URL}/${locale}/products/${p.id}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: 'hourly' as const,
        priority: 0.7,
      }))
    );

    // Categories (assuming endpoint exists)
    const categoriesRes = await fetch(`${API_URL}/v1/catalog/categories`);
    const categories = await categoriesRes.json();
    const categoryEntries = categories.flatMap((c: any) =>
      locales.map((locale) => ({
        url: `${APP_URL}/${locale}/catalog?category=${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    );

    return [...routes, ...productEntries, ...categoryEntries];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return routes;
  }
}
```

- [ ] **Step 3: Commit**
```bash
git add apps/web/app/robots.ts apps/web/app/sitemap.ts
git commit -m "feat(seo): add dynamic robots.txt and sitemap"
```

---

### Task 3: Product Dynamic Metadata

**Files:**
- Modify: `apps/web/app/[locale]/products/[id]/page.tsx` (or create if missing)

- [ ] **Step 1: Implement generateMetadata in product page**
```typescript
import { Metadata, ResolvingMetadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string; locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id, locale } = await params;
  
  try {
    const res = await fetch(`${API_URL}/v1/catalog/products/${id}`);
    const product = await res.json();

    if (!product || product.statusCode === 404) {
      return { title: 'Product Not Found' };
    }

    return {
      title: product.title,
      description: product.description.substring(0, 160),
      openGraph: {
        title: product.title,
        description: product.description.substring(0, 160),
        images: product.images?.[0] ? [product.images[0]] : [],
      },
    };
  } catch (error) {
    return { title: 'Product' };
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add apps/web/app/[locale]/products/[id]/page.tsx
git commit -m "feat(seo): add dynamic metadata for product pages"
```

---

### Task 4: Structured Data (JSON-LD)

**Files:**
- Create: `apps/web/components/structured-data/product-jsonld.tsx`
- Modify: `apps/web/app/[locale]/products/[id]/page.tsx`

- [ ] **Step 1: Create ProductJsonLd component**
```typescript
import React from 'react';

interface ProductJsonLdProps {
  product: any;
}

export function ProductJsonLd({ product }: ProductJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: 'GBay',
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.id}`,
      priceCurrency: 'USD',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

- [ ] **Step 2: Inject JSON-LD in product page**
Import and use `<ProductJsonLd product={product} />` in the product page component.

- [ ] **Step 3: Commit**
```bash
git add apps/web/components/structured-data/product-jsonld.tsx apps/web/app/[locale]/products/[id]/page.tsx
git commit -m "feat(seo): add JSON-LD structured data for products"
```

---

### Task 5: OpenGraph Images

**Files:**
- Create: `apps/web/app/opengraph-image.tsx`
- Create: `apps/web/app/[locale]/products/[id]/opengraph-image.tsx`

- [ ] **Step 1: Create default OG image**
```typescript
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
        }}
      >
        GBay
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: Create product OG image**
```typescript
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default async function Image({ params }: { params: { id: string } }) {
  const product = await fetch(`${API_URL}/v1/catalog/products/${params.id}`).then((res) => res.json());

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
          padding: 40,
        }}
      >
        <h1 style={{ fontSize: 64, marginBottom: 20 }}>{product.title}</h1>
        <p style={{ fontSize: 48, color: '#666' }}>Price: ${product.price}</p>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 32, fontWeight: 'bold' }}>GBay Marketplace</div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add apps/web/app/opengraph-image.tsx apps/web/app/[locale]/products/[id]/opengraph-image.tsx
git commit -m "feat(seo): add default and dynamic OG images"
```

---

### Task 6: Verification Script

**Files:**
- Create: `scripts/verify-seo.ts`

- [ ] **Step 1: Create verify-seo.ts**
```typescript
import axios from 'axios';

const APP_URL = 'http://localhost:3000';

async function verifySEO() {
  console.log('--- Verifying SEO ---');

  try {
    // 1. Robots.txt
    const robots = await axios.get(`${APP_URL}/robots.txt`);
    if (robots.data.includes('User-agent: *') && robots.data.includes('Sitemap:')) {
      console.log('✅ robots.txt is valid');
    }

    // 2. Sitemap
    const sitemap = await axios.get(`${APP_URL}/sitemap.xml`);
    if (sitemap.status === 200 && sitemap.data.includes('<urlset')) {
      console.log('✅ sitemap.xml is valid');
    }

    // 3. Metadata (Home)
    const home = await axios.get(`${APP_URL}/en`);
    if (home.data.includes('<title>GBay') && home.data.includes('hreflang="en"')) {
      console.log('✅ Home metadata and hreflang are valid');
    }

    console.log('--- SEO Verification Passed ---');
  } catch (error: any) {
    console.error('❌ SEO Verification Failed:', error.message);
    process.exit(1);
  }
}

verifySEO();
```

- [ ] **Step 2: Run verification**
(Note: Requires apps/web and apps/api to be running)
`npx ts-node scripts/verify-seo.ts`

- [ ] **Step 3: Commit**
```bash
git add scripts/verify-seo.ts
git commit -m "test(seo): add verification script"
```
