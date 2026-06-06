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
  Activity,
  Menu
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const token = await requireAuth();
  const t = await getTranslations("admin");

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: t("dashboard") || "Overview" },
    { href: "/admin/users", icon: Users, label: t("users") || "Users" },
    { href: "/admin/sellers", icon: Store, label: t("sellers") || "Sellers & KYC" },
    { href: "/admin/products", icon: Package, label: t("products") || "Products & Listings" },
    { href: "/admin/auctions", icon: Gavel, label: t("auctions") || "Auctions" },
    { href: "/admin/refunds", icon: Undo2, label: t("refunds") || "Refunds" },
    { href: "/admin/disputes", icon: ShieldAlert, label: t("disputes") || "Disputes" },
    { href: "/admin/analytics", icon: BarChart, label: t("analytics") || "Analytics" },
    { href: "/admin/audit-log", icon: FileText, label: t("audit_logs") || "Audit Logs" },
    { href: "/admin/feature-flags", icon: Settings2, label: t("feature_flags") || "Feature Flags" },
    { href: "/admin/system-health", icon: Activity, label: t("system_health") || "System Health" },
  ];

  const sidebarContent = (
    <nav className="p-4 space-y-1 overflow-y-auto h-full">
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
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      {/* Mobile Admin Nav */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-16 z-40">
        <span className="font-bold">Admin Panel</span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetHeader className="p-6 border-b">
              <SheetTitle>Admin Navigation</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r bg-muted/20 flex-shrink-0 hidden md:block">
        <div className="sticky top-16 h-full overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
        {children}
      </main>
    </div>
  );
}
