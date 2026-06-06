import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { Gavel, ShoppingCart } from "lucide-react";

export interface Product {
  id: string;
  title: string;
  description: string;
  condition: string;
  status: string;
  mainImage?: string;
  sellerId?: string;
  listings?: Array<{
    id: string;
    buyNowPriceCents?: number;
    currency: string;
    type: string;
    auction?: {
      id: string;
      currentHighestBidCents?: number;
      startPriceCents: number;
    };
  }>;
}

interface ProductCardProps {
  product: Product;
  locale?: string;
}

export function ProductCard({ product, locale = "en" }: ProductCardProps) {
  const t = useTranslations("common");
  
  const activeListing = product.listings?.[0];
  const isAuction = activeListing?.type === 'AUCTION' || product.status === 'AUCTION';
  
  const priceCents = isAuction 
    ? (activeListing?.auction?.currentHighestBidCents || activeListing?.auction?.startPriceCents || 0)
    : (activeListing?.buyNowPriceCents || 0);
    
  const currency = activeListing?.currency || "EUR";

  const formattedPrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(priceCents / 100);

  return (
    <Card className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:border-primary/50 dark:hover:shadow-primary/5">
      <Link href={`/products/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-muted">
        {product.mainImage ? (
          <Image
            src={product.mainImage}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            priority={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground bg-muted/50">
            <ShoppingCart className="h-12 w-12 opacity-10 mb-2" />
            <span className="text-xs uppercase tracking-widest opacity-30">No Image</span>
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {isAuction ? (
            <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground animate-pulse flex items-center gap-1 shadow-sm">
              <Gavel className="h-3 w-3" />
              <span>LIVE</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-none shadow-sm">
              NEW
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4 flex-grow space-y-2">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground font-bold tracking-tighter uppercase border px-1.5 py-0.5 rounded">
            {product.condition}
          </span>
        </div>
        
        <Link href={`/products/${product.id}`}>
          <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {product.title}
          </h3>
        </Link>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex flex-col items-start gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-black text-xl tracking-tight">
            {formattedPrice}
          </span>
          {isAuction && (
            <span className="text-[10px] text-muted-foreground font-medium uppercase">
              Current Bid
            </span>
          )}
        </div>
        
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-full bg-primary w-1/3 animate-progress" />
        </div>
      </CardFooter>
    </Card>
  );
}
