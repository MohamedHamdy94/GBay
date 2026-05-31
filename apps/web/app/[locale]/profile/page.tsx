import { requireAuth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, Store } from "lucide-react";

async function getUserProfile(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1"}/identity/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      next: { revalidate: 0 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function ProfilePage() {
  const token = await requireAuth();
  const user = await getUserProfile(token);
  const t = await getTranslations("profile");

  return (
    <div className="container py-12 px-4 md:px-6 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">{t("my_account") || "My Account"}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> {t("personal_info") || "Personal Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("name") || "Name"}</p>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("email") || "Email"}</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" /> {t("seller_account") || "Seller Account"}
            </CardTitle>
            <CardDescription>
              {t("seller_desc") || "Manage your selling preferences and status."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user?.roles?.includes("SELLER") ? (
              <Button asChild className="w-full">
                <Link href="/seller/dashboard">{t("go_to_dashboard") || "Go to Seller Dashboard"}</Link>
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href="/profile/onboarding">{t("become_a_seller") || "Become a Seller"}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
