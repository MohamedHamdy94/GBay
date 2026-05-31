"use client";

import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Eye, Gavel } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface DisputeActionsProps {
  disputeId: string;
  status: string;
  token: string;
}

export function DisputeActions({ disputeId, status, token }: DisputeActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resolution, setResolution] = useState("");
  const [outcome, setOutcome] = useState("BUYER");

  const handleReview = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/admin/disputes/${disputeId}/review`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to start review");

      toast({ title: "Review started", description: "The dispute is now under review." });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution) {
      toast({ title: "Error", description: "Please provide a resolution reason.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi(`/admin/disputes/${disputeId}/resolve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ outcome, resolution }),
      });

      if (!res.ok) throw new Error("Failed to resolve dispute");

      toast({ title: "Dispute resolved", description: `Resolved in favor of ${outcome}.` });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'RESOLVED') return null;

  return (
    <div className="flex justify-end gap-2">
      {status === 'OPEN' && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReview}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
          Start Review
        </Button>
      )}
      {status === 'UNDER_REVIEW' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
              <Gavel className="h-4 w-4 mr-1" />
              Resolve
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Dispute</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Favor Outcome</Label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUYER">Buyer (Full Refund)</SelectItem>
                    <SelectItem value="SELLER">Seller (Release Payment)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Resolution Reason</Label>
                <Textarea 
                  placeholder="Explain the decision..." 
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleResolve} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirm Resolution
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
