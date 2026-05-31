"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { fetchApi } from "@/lib/api";

export async function registerUser(prevState: any, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");

  if (!email || !password || !firstName || !lastName) {
    return { error: "All fields are required" };
  }

  try {
    const res = await fetchApi("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        email, 
        password, 
        name: `${firstName} ${lastName}`,
        preferredLanguage: 'en' // Default for now
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error?.messageKey || data.message || "Failed to register" };
    }

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
