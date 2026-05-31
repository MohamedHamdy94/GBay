"use client";

import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface FeatureFlagToggleProps {
  name: string;
  enabled: boolean;
  token: string;
}

export function FeatureFlagToggle({ name, enabled, token }: FeatureFlagToggleProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const res = await fetchApi(`/admin/feature-flags/${name}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: checked }),
      });

      if (!res.ok) throw new Error("Failed to update feature flag");

      toast({
        title: "Feature flag updated",
        description: `${name} is now ${checked ? "enabled" : "disabled"}.`,
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
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      <Switch checked={enabled} onCheckedChange={handleToggle} disabled={loading} />
    </div>
  );
}
