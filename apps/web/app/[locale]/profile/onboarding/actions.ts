"use server";

import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { fetchApi } from "@/lib/api";

export async function onboardSeller(prevState: any, formData: FormData) {
  const token = await getAuthToken();
  if (!token) return { error: "Unauthorized" };

  const storeName = formData.get("storeName");
  const businessType = formData.get("businessType");

  try {
    const res = await fetchApi("/seller/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ storeName, businessType }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.error?.messageKey || data.message || "Failed to submit onboarding" };
    }
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT") throw err;
    return { error: "Network error occurred." };
  }

  redirect("/seller/dashboard");
}
