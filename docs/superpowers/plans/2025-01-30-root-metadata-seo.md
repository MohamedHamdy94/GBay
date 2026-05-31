# Root Metadata & SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add basic multilingual SEO metadata and hreflang support to the root layout.

**Architecture:** Use Next.js 15 `generateMetadata` function in the root layout to dynamically generate SEO metadata based on the current locale using `next-intl`.

**Tech Stack:** Next.js 15, next-intl, TypeScript.

---

### Task 1: Update Localization Files

**Files:**
- Modify: `apps/web/messages/en.json`
- Modify: `apps/web/messages/de.json`

- [ ] **Step 1: Add SEO namespace to `apps/web/messages/en.json`**

```json
{
  "SEO": {
    "title": "GBay - Next-Generation Marketplace",
    "description": "Buy and sell unique items on GBay, the world's most advanced auction platform.",
    "keywords": "marketplace, auction, buy, sell, gbay"
  }
}
```

- [ ] **Step 2: Add SEO namespace to `apps/web/messages/de.json`**

```json
{
  "SEO": {
    "title": "GBay - Marktplatz der nächsten Generation",
    "description": "Kaufen und verkaufen Sie einzigartige Artikel auf GBay, der weltweit fortschrittlichsten Auktionsplattform.",
    "keywords": "Marktplatz, Auktion, kaufen, verkaufen, gbay"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/messages/en.json apps/web/messages/de.json
git commit -m "feat(seo): add SEO translation strings"
```

### Task 2: Implement dynamic metadata in Root Layout

**Files:**
- Modify: `apps/web/app/[locale]/layout.tsx`

- [ ] **Step 1: Replace static metadata with dynamic generateMetadata**

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
      canonical: '/',
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

- [ ] **Step 2: Verify build**

Run: `npm run build` in `apps/web`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/[locale]/layout.tsx
git commit -m "feat(seo): add root metadata and hreflang support"
```
