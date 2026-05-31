import { getTranslations } from "next-intl/server";
import { notFound } from "next-navigation";
import { fetchApi } from "@/lib/api";
import { AuctionDetailClient } from "@/components/auction/auction-detail-client";

async function getAuction(id: string) {
  try {
    const res = await fetchApi(`/auctions/${id}`, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch auction detail", error);
    return null;
  }
}

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const auction = await getAuction(id);

  if (!auction) {
    notFound();
  }

  return (
    <div className="container py-12 px-4 md:px-6">
      <AuctionDetailClient initialAuction={auction} locale={locale} />
    </div>
  );
}
