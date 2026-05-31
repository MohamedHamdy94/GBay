import type { Product } from "@/components/product-card";

export function ProductJsonLd({ product }: { product: Product }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description,
    "image": product.mainImage ? [product.mainImage] : [],
    "brand": {
      "@type": "Brand",
      "name": "GBay"
    },
    "offers": {
      "@type": "Offer",
      "price": (product.listings?.[0]?.buyNowPriceCents || 0) / 100,
      "priceCurrency": product.listings?.[0]?.currency || "EUR",
      "availability": product.status === "SOLD" 
        ? "https://schema.org/OutOfStock" 
        : "https://schema.org/InStock",
      "url": `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${product.id}`
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
