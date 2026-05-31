"use client";

import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Play } from "lucide-react";

interface RefundActionsProps {
  refundId: string;
  status: string;
  token: string;
}

export function RefundActions({ refundId, status, token }: RefundActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "reject" | "process") => {
    setLoading(action);
    try {
      const res = await fetchApi(`/admin/refunds/${refundId}/${action}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to ${action} refund`);
      }

      toast({
        title: `Refund ${action}d`,
        description: `The refund has been successfully ${action}d.`,
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  if (status === 'COMPLETED' || status === 'REJECTED') return null;

  return (
    <div className="flex justify-end gap-2">
      {status === 'REQUESTED' && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="text-emerald-600"
            onClick={() => handleAction("approve")}
            disabled={loading !== null}
          >
            {loading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => handleAction("reject")}
            disabled={loading !== null}
          >
            {loading === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Reject
          </Button>
        </>
      )}
      {status === 'APPROVED' && (
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600"
          onClick={() => handleAction("process")}
          disabled={loading !== null}
        >
          {loading === "process" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Process Payment
        </Button>
      )}
    </div>
  );
}
