"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { markAsShipped } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

interface ShipOrderButtonProps {
  orderId: string;
}

export function ShipOrderButton({ orderId }: ShipOrderButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslations("seller_orders");

  const handleShip = async () => {
    setIsLoading(true);
    try {
      const result = await markAsShipped(orderId);
      if (result.error) {
        toast({
          title: t("shipping_error"),
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("shipping_success"),
        });
      }
    } catch (error) {
      toast({
        title: t("shipping_error"),
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleShip} 
      disabled={isLoading} 
      size="sm" 
      variant="outline"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Truck className="h-4 w-4" />
      )}
      {t("mark_shipped")}
    </Button>
  );
}
