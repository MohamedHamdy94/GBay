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
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, User, Store, AlertCircle } from "lucide-react";
import { DisputeActions } from "./dispute-actions";

async function getDisputes(token: string, status?: string) {
  try {
    const statusQuery = status ? `&status=${status}` : "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1"}/admin/disputes?limit=50${statusQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      next: { revalidate: 0 }
    });
    if (!res.ok) return { items: [] };
    return await res.json();
  } catch (error) {
    return { items: [] };
  }
}

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; locale: string }>
}) {
  const token = await requireAuth();
  const params = await searchParams;
  const data = await getDisputes(token, params.status);
  const t = await getTranslations("admin");

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'OPEN': return 'destructive';
      case 'UNDER_REVIEW': return 'secondary';
      case 'RESOLVED': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-primary" />
            {t("disputes") || "Disputes Management"}
          </h1>
          <p className="text-muted-foreground mt-1">Investigate and resolve conflicts between buyers and sellers.</p>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Refund / ID</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">{t("actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No open disputes found.
                </TableCell>
              </TableRow>
            ) : (
              data.items?.map((dispute: any) => (
                <TableRow key={dispute.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs font-mono">#{dispute.id.slice(-8).toUpperCase()}</span>
                      <span className="text-[10px] text-muted-foreground">Refund: {dispute.refundId.slice(-8)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{dispute.refund?.buyer?.name || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span>{dispute.refund?.seller?.displayName || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-[200px]">
                      <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-sm">{dispute.reason || "No reason provided"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(dispute.status)}>
                      {dispute.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DisputeActions disputeId={dispute.id} status={dispute.status} token={token} />
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
