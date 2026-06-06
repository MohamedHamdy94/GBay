"use server";

import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { fetchApi } from "@/lib/api";

export async function addProduct(prevState: any, formData: FormData) {
  const token = await getAuthToken();
  if (!token) return { error: "Unauthorized" };

  // Get seller profile to get sellerId
  let sellerId: string;
  try {
    const sellerRes = await fetchApi("/seller/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!sellerRes.ok) return { error: "Failed to retrieve seller profile" };
    const seller = await sellerRes.json();
    sellerId = seller.id;
  } catch (err) {
    return { error: "Network error fetching seller profile" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price");
  const status = formData.get("status") as string;
  const condition = formData.get("condition") as string;
  const categoryId = formData.get("categoryId") as string;
  
  // Auction specific fields
  const startingBid = formData.get("startingBid");
  const reservePrice = formData.get("reservePrice");
  const auctionDuration = formData.get("auctionDuration");

  try {
    const payload: any = {
      sellerId,
      condition,
      categoryId,
      translations: [
        {
          locale: "en", // Default for now, could be dynamic
          title,
          description,
          slug: title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""),
        }
      ],
      listing: {
        type: status,
        buyNowPriceCents: price ? parseInt(price as string, 10) : undefined,
        quantityTotal: 1,
      }
    };

    if (status === "AUCTION") {
      payload.listing.startingBidCents = parseInt(startingBid as string, 10);
      if (reservePrice) {
        payload.listing.reservePriceCents = parseInt(reservePrice as string, 10);
      }
      payload.listing.auctionDurationDays = parseInt(auctionDuration as string, 10) || 7;
    }

    const res = await fetchApi("/catalog/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
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
