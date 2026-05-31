import { requireAuth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings2, Zap } from "lucide-react";
import { FeatureFlagToggle } from "./toggle";

async function getFeatureFlags(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1"}/admin/feature-flags`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      next: { revalidate: 0 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function AdminFeatureFlagsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const token = await requireAuth();
  const { locale } = await params;
  const flags = await getFeatureFlags(token);
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="h-8 w-8 text-primary" />
            Feature Flags
          </h1>
          <p className="text-muted-foreground mt-1">Enable or disable system features in real-time.</p>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feature Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No feature flags defined in the database.
                </TableCell>
              </TableRow>
            ) : (
              flags.map((flag: any) => (
                <TableRow key={flag.id || flag.name}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="font-mono">{flag.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {flag.description || "No description provided."}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(flag.updatedAt).toLocaleString(locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <FeatureFlagToggle name={flag.name} enabled={flag.enabled} token={token} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
