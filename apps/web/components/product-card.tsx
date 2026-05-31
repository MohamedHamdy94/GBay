import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export interface Product {
  id: string;
  title: string;
  description: string;
  condition: string;
  status: string;
  mainImage?: string;
  sellerId?: string;
  listings?: Array<{
    buyNowPriceCents?: number;
    currency: string;
    type: string;
  }>;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("common");
  
  const activeListing = product.listings?.[0];
  const priceCents = activeListing?.buyNowPriceCents || 0;
  const currency = activeListing?.currency || "EUR";

  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency,
  }).format(priceCents / 100);

  return (
    <Card className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-lg hover:border-primary/50">
      <Link href={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-muted">
        {product.mainImage ? (
          <img
            src={product.mainImage}
            alt={product.title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground">
            No Image
          </div>
        )}
        {product.status === 'AUCTION' && (
          <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
            {t("auction")}
          </Badge>
        )}
      </Link>
      <CardContent className="p-4 flex-grow">
        <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wider uppercase">
          {product.condition}
        </div>
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {product.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <span className="font-bold text-lg text-foreground">
          {formattedPrice}
        </span>
        <Badge variant="secondary" className="capitalize text-xs">
          {product.status.toLowerCase()}
        </Badge>
      </CardFooter>
    </Card>
  );
}
