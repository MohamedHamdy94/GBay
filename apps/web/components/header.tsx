import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:px-0">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left">GBAY</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  <div className="relative md:hidden mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={t("shop") + "..."} 
                      className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                  </div>
                  <Link href="/products" className="text-lg font-semibold hover:text-primary transition-colors">
                    {t("products") || "Products"}
                  </Link>
                  <Link href="/seller/dashboard" className="text-lg font-semibold hover:text-primary transition-colors">
                    {t("sell") || "Sell"}
                  </Link>
                  <Separator className="my-2" />
                  <Link href="/login" className="text-lg font-semibold hover:text-primary transition-colors">
                    {t("account") || "Account"}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 tracking-tighter">GBAY</span>
          </Link>
          
          <nav className="hidden lg:flex gap-6">
            <Link href="/products" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              {t("products") || "Products"}
            </Link>
            <Link href="/seller/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              {t("sell") || "Sell"}
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("shop") + "..."} 
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild className="hover:bg-primary/5 hover:text-primary">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">{t("cart") || "Cart"}</span>
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild className="hidden sm:flex hover:bg-primary/5 hover:text-primary">
              <Link href="/login">
                <User className="h-5 w-5" />
                <span className="sr-only">{t("account") || "Account"}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Separator({ className }: { className?: string }) {
  return <div className={`h-[1px] w-full bg-border ${className}`} />;
}
