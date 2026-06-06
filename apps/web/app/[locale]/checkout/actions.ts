"use server";

import { redirect } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { randomUUID } from "node:crypto";

export async function initiatePayment(formData: FormData): Promise<void> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const street = formData.get("street") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zip = formData.get("zip") as string;
  const country = formData.get("country") as string;

  // We also need the cartId. Let's fetch the cart first.
  let cart: any;
  try {
    const cartRes = await fetchApi("/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!cartRes.ok) return; // In a real app, we'd handle this with a toast or error state
    cart = await cartRes.json();
  } catch (err) {
    console.error("Cart fetch error", err);
    return;
  }

  try {
    const res = await fetchApi("/checkout/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cartId: cart.id,
        idempotencyKey: randomUUID(),
        shippingAddress: {
          street,
          city,
          state,
          zip,
          country,
        },
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Checkout initiation failed", errorData.message);
      return;
    }

    const session = await res.json();
    redirect(`/checkout/payment?sessionId=${session.id}`);
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT" || err.digest?.includes("NEXT_REDIRECT")) throw err;
    console.error("Checkout initiation network error", err);
  }
}

export async function confirmOrderAction(sessionId: string) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetchApi("/checkout/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        checkoutSessionId: sessionId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, orderIds: data.orderIds };
    } else {
      const errorData = await res.json();
      return { success: false, error: errorData.message || "Failed to confirm order" };
    }
  } catch (err) {
    console.error("Order confirmation error:", err);
    return { success: false, error: "Network error" };
  }
}
