# SEO Infrastructure Design Spec - GBay

**Date:** 2026-05-31  
**Status:** Draft  
**Module:** 24 - SEO

## 1. Overview
The goal of this module is to implement a robust, multilingual SEO infrastructure for the GBay marketplace using Next.js 15 App Router capabilities. This includes metadata management, sitemaps, robots.txt, hreflang tags, dynamic OpenGraph images, and structured data (JSON-LD).

## 2. Goals
- Ensure 100% crawlability of public product and category pages.
- Provide accurate multilingual metadata for search engines and social media.
- Implement structured data to enable Google Rich Snippets for products.
- Automate sitemap generation to reflect real-time catalog changes.

## 3. Architecture & Components

### 3.1 Metadata & Internationalization
- **Root Layout (`apps/web/app/[locale]/layout.tsx`):**
    - Configure `metadataBase` using `NEXT_PUBLIC_APP_URL`.
    - Define default `title` and `description` with multilingual support.
    - Implement `alternates` with `languages` mapping (en-US, de-DE) for automatic `hreflang` generation.
- **Product Page (`apps/web/app/[locale]/products/[id]/page.tsx`):**
    - Implement dynamic `generateMetadata`.
    - Fetch product details from `GET /v1/catalog/products/:id`.
    - Map product title, description, and images to Metadata objects.

### 3.2 Dynamic Sitemap (`apps/web/app/sitemap.ts`)
- Use the standard Next.js `sitemap` function.
- Fetch all active products from `GET /v1/catalog/products`.
- Fetch all categories from `GET /v1/catalog/categories`.
- Generate URLs for each locale (en, de).
- Include `lastModified` (from product `updatedAt`) and `changeFrequency`.

### 3.3 Robots.txt (`apps/web/app/robots.ts`)
- Configure `robots` function to allow all crawlers (`User-agent: *`).
- Disallow private paths: `/admin`, `/profile`, `/seller/dashboard`, `/cart`, `/checkout`, `/login`, `/register`.
- Link to the dynamic sitemap URL.

### 3.4 Structured Data (JSON-LD)
- **Component:** `apps/web/components/structured-data/product-jsonld.tsx`.
- **Schema:** `Product` from Schema.org.
- **Fields:** `name`, `description`, `image`, `offers` (price, currency, availability), `aggregateRating` (if available), `brand`.

### 3.5 OpenGraph Images
- **Default OG:** `apps/web/app/opengraph-image.tsx` (Static logo/brand image).
- **Dynamic Product OG:** `apps/web/app/[locale]/products/[id]/opengraph-image.tsx`.
    - Use `ImageResponse` from `next/og`.
    - Render product name, price, and primary image on a branded background.

## 4. Implementation Details

### API Integration
- Use `fetch` with appropriate revalidation tags (e.g., `next: { tags: ['products'] }`).
- Handle API failures gracefully in metadata/sitemap generation (fallback to defaults).

### Multilingual Logic
- Use `next-intl` messages for static SEO strings.
- Pass the `locale` parameter to the API where applicable or handle mapping in the frontend.

## 5. Testing & Verification
- **Script:** `scripts/verify-seo.ts`.
- **Checks:**
    - Verify `sitemap.xml` responds with 200 OK and contains valid XML.
    - Verify `robots.txt` contains expected Disallow rules.
    - Check for `<link rel="alternate" hreflang="...">` tags on homepage and product pages.
    - Validate JSON-LD presence and structure on product pages.
    - Confirm OpenGraph meta tags are correctly populated.

## 6. Documentation
- Update `IMPLEMENTATION_STATUS.md`.
- Update `AI_MEMORY.md`.
- Log changes in `CHANGELOG_AI.md`.
