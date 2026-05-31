import { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Package, 
  Gavel, 
  ShoppingCart, 
  CreditCard, 
  Undo2, 
  ShieldAlert, 
  MessageSquare, 
  Bell, 
  Percent, 
  BarChart, 
  FileText, 
  Settings2,
  Activity
} from "lucide-react";
import { requireAuth } from "@/lib/auth";

export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const token = await requireAuth();
  const t = await getTranslations("admin");

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: t("dashboard") || "Overview" },
    { href: "/admin/users", icon: Users, label: t("users") || "Users" },
    { href: "/admin/sellers", icon: Store, label: t("sellers") || "Sellers & KYC" },
    { href: "/admin/products", icon: Package, label: t("products") || "Products & Listings" },
    { href: "/admin/auctions", icon: Gavel, label: t("auctions") || "Auctions" },
    // { href: "/admin/orders", icon: ShoppingCart, label: t("orders") || "Orders" },
    // { href: "/admin/payments", icon: CreditCard, label: t("payments") || "Payments & Escrow" },
    { href: "/admin/refunds", icon: Undo2, label: t("refunds") || "Refunds" },
    { href: "/admin/disputes", icon: ShieldAlert, label: t("disputes") || "Disputes" },
    // { href: "/admin/fraud", icon: ShieldAlert, label: t("fraud") || "Fraud Monitoring" },
    // { href: "/admin/messages", icon: MessageSquare, label: t("messages") || "Messaging Reports" },
    // { href: "/admin/notifications", icon: Bell, label: t("notifications") || "Notifications" },
    // { href: "/admin/commissions", icon: Percent, label: t("commissions") || "Commissions" },
    { href: "/admin/analytics", icon: BarChart, label: t("analytics") || "Analytics" },
    { href: "/admin/audit-logs", icon: FileText, label: t("audit_logs") || "Audit Logs" },
    { href: "/admin/feature-flags", icon: Settings2, label: t("feature_flags") || "Feature Flags" },
    { href: "/admin/system-health", icon: Activity, label: t("system_health") || "System Health" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 flex-shrink-0 hidden md:block">
        <nav className="p-4 space-y-1 overflow-y-auto h-full sticky top-16">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 bg-background">
        {children}
      </main>
    </div>
  );
}
