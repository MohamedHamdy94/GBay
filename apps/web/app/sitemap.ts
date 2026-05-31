import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOCALES = ['en', 'de'] as const;

type Locale = (typeof LOCALES)[number];

interface Product {
  id: string;
  updatedAt: string;
  translations: {
    locale: string;
    slug: string;
  }[];
}

interface Category {
  id: string;
  createdAt: string;
  translations: {
    locale: string;
    slug: string;
  }[];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [];

  // Generate static routes for each locale
  for (const locale of LOCALES) {
    staticRoutes.push({
      url: `${APP_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    });
    staticRoutes.push({
      url: `${APP_URL}/${locale}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    });
    staticRoutes.push({
      url: `${APP_URL}/${locale}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  }

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${API_URL}/v1/catalog/products?includeTranslations=true`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${API_URL}/v1/catalog/categories?includeTranslations=true`, { next: { revalidate: 3600 } }).catch(() => null),
    ]);

    const products: Product[] = productsRes?.ok ? await productsRes.json() : [];
    const categories: Category[] = categoriesRes?.ok ? await categoriesRes.json() : [];

    const productRoutes: MetadataRoute.Sitemap = products.flatMap((product) =>
      product.translations.map((t) => ({
        url: `${APP_URL}/${t.locale}/products/${t.slug}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    );

    const categoryRoutes: MetadataRoute.Sitemap = categories.flatMap((category) =>
      category.translations.map((t) => ({
        url: `${APP_URL}/${t.locale}/catalog?category=${t.slug}`,
        lastModified: new Date(category.createdAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))
    );

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticRoutes;
  }
}
