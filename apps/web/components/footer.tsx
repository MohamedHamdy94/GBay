import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4 text-lg">GBay</h3>
            <p className="text-sm text-muted-foreground">
              {t("footer_description") || "The next-generation marketplace for unique items."}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{t("shop") || "Shop"}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground">{t("all_products") || "All Products"}</Link></li>
              <li><Link href="/auctions" className="hover:text-foreground">{t("auctions") || "Auctions"}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{t("sell") || "Sell"}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/profile/onboarding" className="hover:text-foreground">{t("start_selling") || "Start Selling"}</Link></li>
              <li><Link href="/seller/dashboard" className="hover:text-foreground">{t("seller_dashboard") || "Seller Dashboard"}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{t("support") || "Support"}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/contact" className="hover:text-foreground">{t("contact_us") || "Contact Us"}</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">{t("faq") || "FAQ"}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} GBay. {t("all_rights_reserved") || "All rights reserved."}</p>
        </div>
      </div>
    </footer>
  );
}
