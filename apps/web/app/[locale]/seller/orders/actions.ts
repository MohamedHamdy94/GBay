"use server";

import { fetchApi } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markAsShipped(orderId: string, trackingNumber?: string, carrier?: string) {
  const token = await requireAuth();

  try {
    const res = await fetchApi(`/seller/orders/${orderId}/ship`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        trackingNumber: trackingNumber || "TRK-" + Math.random().toString(36).substring(7).toUpperCase(),
        carrier: carrier || "Standard Shipping",
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { error: error.message || "Failed to mark order as shipped" };
    }

    revalidatePath("/[locale]/seller/orders", "page");
    revalidatePath("/[locale]/seller/dashboard", "page");
    
    return { success: true };
  } catch (error) {
    console.error("Mark as shipped error:", error);
    return { error: "An unexpected error occurred" };
  }
}
