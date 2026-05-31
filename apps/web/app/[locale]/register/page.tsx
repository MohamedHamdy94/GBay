"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useActionState } from "react";
import { registerUser } from "./actions";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(registerUser, { error: null });

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">{t("create_account") || "Create an account"}</CardTitle>
          <CardDescription>
            {t("register_desc") || "Enter your details to get started"}
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md">
                {state.error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("first_name") || "First name"}</Label>
                <Input id="firstName" name="firstName" required disabled={pending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("last_name") || "Last name"}</Label>
                <Input id="lastName" name="lastName" required disabled={pending} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email") || "Email"}</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required disabled={pending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password") || "Password"}</Label>
              <Input id="password" name="password" type="password" required disabled={pending} minLength={8} />
              <p className="text-xs text-muted-foreground">{t("password_hint") || "Must be at least 8 characters long."}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? (t("creating_account") || "Creating account...") : (t("sign_up") || "Sign Up")}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              {t("has_account") || "Already have an account?"}{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                {t("sign_in") || "Sign in"}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
