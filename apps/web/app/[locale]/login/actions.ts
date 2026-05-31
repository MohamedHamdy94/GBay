"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { fetchApi } from "@/lib/api";

export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const res = await fetchApi("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error?.messageKey || data.message || "Failed to login" };
    }

    // Set cookie
    if (data.accessToken) {
      const cookieStore = await cookies();
      cookieStore.set("gbay_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    redirect("/profile");
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT") throw err;
    return { error: "Network error occurred. Please try again." };
  }
}
