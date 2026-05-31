import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User } from "lucide-react";

export function Header() {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">GBay</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("products") || "Products"}
            </Link>
            <Link href="/seller/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("sell") || "Sell"}
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">{t("cart") || "Cart"}</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href="/login">
              <User className="h-5 w-5" />
              <span className="sr-only">{t("account") || "Account"}</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
