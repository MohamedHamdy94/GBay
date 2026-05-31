"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useActionState } from "react";
import { loginUser } from "./actions";

export default function LoginPage() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(loginUser, { error: null });

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">{t("welcome_back") || "Welcome back"}</CardTitle>
          <CardDescription>
            {t("login_desc") || "Enter your email to sign in to your account"}
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md">
                {state.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("email") || "Email"}</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required disabled={pending} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("password") || "Password"}</Label>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  {t("forgot_password") || "Forgot password?"}
                </Link>
              </div>
              <Input id="password" name="password" type="password" required disabled={pending} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? (t("signing_in") || "Signing in...") : (t("sign_in") || "Sign In")}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              {t("no_account") || "Don't have an account?"}{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                {t("sign_up") || "Sign up"}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
