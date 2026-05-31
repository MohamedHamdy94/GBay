"use server";

import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { fetchApi } from "@/lib/api";

export async function addProduct(prevState: any, formData: FormData) {
  const token = await getAuthToken();
  if (!token) return { error: "Unauthorized" };

  const title = formData.get("title");
  const description = formData.get("description");
  const price = formData.get("price");
  const status = formData.get("status");
  const condition = formData.get("condition");

  try {
    const res = await fetchApi("/catalog/listings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        priceCents: parseInt(price as string, 10),
        status,
        condition,
        currency: "USD",
        categoryId: "default",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.error?.messageKey || data.message || "Failed to create product" };
    }
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT") throw err;
    return { error: "Network error occurred." };
  }

  redirect("/seller/products");
}
