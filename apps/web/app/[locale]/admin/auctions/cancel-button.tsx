"use client";

import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Ban, Loader2 } from "lucide-react";

interface CancelAuctionButtonProps {
  auctionId: string;
  token: string;
}

export function CancelAuctionButton({ auctionId, token }: CancelAuctionButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this auction?")) return;

    setLoading(true);
    try {
      const res = await fetchApi(`/admin/auctions/${auctionId}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Cancelled by administrator" }),
      });

      if (!res.ok) {
        throw new Error("Failed to cancel auction");
      }

      toast({
        title: "Auction cancelled",
        description: "The auction has been successfully cancelled.",
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-destructive"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <Ban className="h-4 w-4 mr-1" />
      )}
      Cancel
    </Button>
  );
}
